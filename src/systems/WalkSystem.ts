import Phaser from 'phaser';
import { Point } from '../data/rooms';

/**
 * Grid cell size in pixels. Smaller = more accurate but slower.
 * 4px gives 80x30 grid for 320x120 viewport — fast enough for A*.
 */
const CELL_SIZE = 4;

/** A node in the A* open/closed set */
interface AStarNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // g + h
  parent: AStarNode | null;
}

/**
 * WalkSystem - Grid-based A* pathfinding for the adventure game.
 *
 * Converts the walkable area polygon into a boolean grid, then uses A*
 * to find paths around obstacles. Includes path smoothing via
 * line-of-sight optimization and an F1 debug overlay.
 */
export class WalkSystem {
  private scene: Phaser.Scene;
  private grid: boolean[][] = []; // true = walkable
  private gridWidth = 0;
  private gridHeight = 0;
  private areaWidth: number;
  private areaHeight: number;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private debugVisible = false;

  constructor(scene: Phaser.Scene, areaWidth: number, areaHeight: number) {
    this.scene = scene;
    this.areaWidth = areaWidth;
    this.areaHeight = areaHeight;
  }

  /**
   * Build the navigation grid from a walkable area polygon.
   * Call this whenever the room changes.
   */
  buildGrid(walkableArea: Point[]): void {
    this.gridWidth = Math.ceil(this.areaWidth / CELL_SIZE);
    this.gridHeight = Math.ceil(this.areaHeight / CELL_SIZE);

    // Build a Phaser polygon for point-in-polygon testing
    const polygon = new Phaser.Geom.Polygon(
      walkableArea.map(p => new Phaser.Geom.Point(p.x, p.y))
    );

    this.grid = [];
    for (let gy = 0; gy < this.gridHeight; gy++) {
      const row: boolean[] = [];
      for (let gx = 0; gx < this.gridWidth; gx++) {
        // Test the center of each cell
        const worldX = gx * CELL_SIZE + CELL_SIZE / 2;
        const worldY = gy * CELL_SIZE + CELL_SIZE / 2;
        row.push(Phaser.Geom.Polygon.Contains(polygon, worldX, worldY));
      }
      this.grid.push(row);
    }

    // Refresh debug overlay if visible
    if (this.debugVisible) {
      this.drawDebug();
    }
  }

  /**
   * Find a path from start to goal using A*.
   * Returns an array of world-coordinate Points, or null if no path found.
   */
  findPath(startX: number, startY: number, goalX: number, goalY: number): Point[] | null {
    const sx = this.worldToGrid(startX, 'x');
    const sy = this.worldToGrid(startY, 'y');
    const gx = this.worldToGrid(goalX, 'x');
    const gy = this.worldToGrid(goalY, 'y');

    // If start or goal is outside grid, clamp
    const clampedStart = this.clampToGrid(sx, sy);
    const clampedGoal = this.clampToGrid(gx, gy);

    // If goal cell is not walkable, find nearest walkable cell
    const goalCell = this.findNearestWalkable(clampedGoal.x, clampedGoal.y);
    if (!goalCell) return null;

    const startCell = this.findNearestWalkable(clampedStart.x, clampedStart.y);
    if (!startCell) return null;

    const rawPath = this.astar(startCell.x, startCell.y, goalCell.x, goalCell.y);
    if (!rawPath) return null;

    // Convert grid coords to world coords
    const worldPath = rawPath.map(p => this.gridToWorld(p.x, p.y));

    // Smooth the path by removing unnecessary waypoints
    const smoothed = this.smoothPath(worldPath);

    // Replace first point with exact start and last with exact goal (if walkable)
    if (smoothed.length > 0) {
      smoothed[0] = { x: startX, y: startY };
      if (this.isWalkable(goalX, goalY)) {
        smoothed[smoothed.length - 1] = { x: goalX, y: goalY };
      }
    }

    return smoothed;
  }

  /**
   * Check if a world-coordinate point is within the walkable area.
   */
  isWalkable(worldX: number, worldY: number): boolean {
    const gx = this.worldToGrid(worldX, 'x');
    const gy = this.worldToGrid(worldY, 'y');
    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) return false;
    return this.grid[gy]?.[gx] ?? false;
  }

  /**
   * Toggle the debug overlay visibility. Returns new state.
   */
  toggleDebug(): boolean {
    this.debugVisible = !this.debugVisible;
    if (this.debugVisible) {
      this.drawDebug();
    } else {
      this.clearDebug();
    }
    return this.debugVisible;
  }

  /**
   * Draw the path as a debug overlay (optional visualization).
   */
  drawPathDebug(path: Point[]): void {
    if (!this.debugGraphics) return;

    this.debugGraphics.lineStyle(1, 0xff00ff, 0.8);
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      this.debugGraphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    // Draw waypoint dots
    this.debugGraphics.fillStyle(0xff00ff, 1);
    for (const p of path) {
      this.debugGraphics.fillCircle(p.x, p.y, 2);
    }
  }

  /**
   * Clean up debug graphics on room change.
   */
  clearDebug(): void {
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }
  }

  // ─── Private methods ──────────────────────────────────────

  /**
   * A* pathfinding on the grid.
   * Uses 8-directional movement with diagonal cost √2.
   */
  private astar(
    sx: number, sy: number,
    gx: number, gy: number
  ): Point[] | null {
    // Quick check: same cell
    if (sx === gx && sy === gy) {
      return [{ x: sx, y: sy }];
    }

    const open: AStarNode[] = [];
    const closed = new Set<number>();

    const key = (x: number, y: number): number => y * this.gridWidth + x;

    const heuristic = (x: number, y: number): number => {
      // Octile distance for 8-direction movement
      const dx = Math.abs(x - gx);
      const dy = Math.abs(y - gy);
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    };

    const startNode: AStarNode = {
      x: sx, y: sy,
      g: 0,
      h: heuristic(sx, sy),
      f: heuristic(sx, sy),
      parent: null,
    };
    open.push(startNode);

    // Use a map for fast open-set lookup by key
    const openMap = new Map<number, AStarNode>();
    openMap.set(key(sx, sy), startNode);

    // 8 directions: cardinal + diagonal
    const dirs = [
      { dx: 0, dy: -1, cost: 1 },     // N
      { dx: 1, dy: -1, cost: Math.SQRT2 },  // NE
      { dx: 1, dy: 0, cost: 1 },      // E
      { dx: 1, dy: 1, cost: Math.SQRT2 },   // SE
      { dx: 0, dy: 1, cost: 1 },      // S
      { dx: -1, dy: 1, cost: Math.SQRT2 },  // SW
      { dx: -1, dy: 0, cost: 1 },     // W
      { dx: -1, dy: -1, cost: Math.SQRT2 }, // NW
    ];

    while (open.length > 0) {
      // Find node with lowest f (simple linear scan — grid is tiny)
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i]!.f < open[bestIdx]!.f) {
          bestIdx = i;
        }
      }

      const current = open[bestIdx]!;
      open.splice(bestIdx, 1);
      openMap.delete(key(current.x, current.y));

      // Goal reached
      if (current.x === gx && current.y === gy) {
        return this.reconstructPath(current);
      }

      closed.add(key(current.x, current.y));

      for (const dir of dirs) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight) continue;
        if (!(this.grid[ny]?.[nx])) continue;
        if (closed.has(key(nx, ny))) continue;

        // For diagonals, check that both adjacent cardinal cells are walkable
        // to prevent corner-cutting
        if (dir.dx !== 0 && dir.dy !== 0) {
          if (!(this.grid[current.y]?.[nx]) || !(this.grid[ny]?.[current.x])) {
            continue;
          }
        }

        const tentativeG = current.g + dir.cost;
        const existing = openMap.get(key(nx, ny));

        if (existing) {
          if (tentativeG < existing.g) {
            existing.g = tentativeG;
            existing.f = tentativeG + existing.h;
            existing.parent = current;
          }
        } else {
          const h = heuristic(nx, ny);
          const node: AStarNode = {
            x: nx, y: ny,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current,
          };
          open.push(node);
          openMap.set(key(nx, ny), node);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Reconstruct path from goal node back to start.
   */
  private reconstructPath(node: AStarNode): Point[] {
    const path: Point[] = [];
    let current: AStarNode | null = node;
    while (current) {
      path.push({ x: current.x, y: current.y });
      current = current.parent;
    }
    path.reverse();
    return path;
  }

  /**
   * Smooth a world-coordinate path by removing unnecessary intermediate waypoints.
   * Uses line-of-sight checking on the grid.
   */
  private smoothPath(path: Point[]): Point[] {
    if (path.length <= 2) return [...path];

    const smoothed: Point[] = [path[0]!];
    let current = 0;

    while (current < path.length - 1) {
      // Try to skip as far ahead as possible while maintaining line of sight
      let farthest = current + 1;
      for (let i = path.length - 1; i > current + 1; i--) {
        if (this.hasLineOfSight(path[current]!, path[i]!)) {
          farthest = i;
          break;
        }
      }
      smoothed.push(path[farthest]!);
      current = farthest;
    }

    return smoothed;
  }

  /**
   * Check if there's a clear line of sight between two world-coordinate points
   * by sampling the grid along the line (Bresenham-style).
   */
  private hasLineOfSight(a: Point, b: Point): boolean {
    const gx0 = this.worldToGrid(a.x, 'x');
    const gy0 = this.worldToGrid(a.y, 'y');
    const gx1 = this.worldToGrid(b.x, 'x');
    const gy1 = this.worldToGrid(b.y, 'y');

    // Bresenham's line algorithm
    let x = gx0;
    let y = gy0;
    const dx = Math.abs(gx1 - gx0);
    const dy = Math.abs(gy1 - gy0);
    const sx = gx0 < gx1 ? 1 : -1;
    const sy = gy0 < gy1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
      if (!(this.grid[y]?.[x])) return false;

      if (x === gx1 && y === gy1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }

  /**
   * Find the nearest walkable grid cell to the given coordinates.
   * Uses BFS expanding outward.
   */
  private findNearestWalkable(gx: number, gy: number): Point | null {
    if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
      if (this.grid[gy]?.[gx]) return { x: gx, y: gy };
    }

    // BFS in expanding rings
    const maxRadius = Math.max(this.gridWidth, this.gridHeight);
    for (let r = 1; r < maxRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // Only ring perimeter
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
            if (this.grid[ny]?.[nx]) return { x: nx, y: ny };
          }
        }
      }
    }

    return null;
  }

  /**
   * Convert world coordinate to grid cell index.
   */
  private worldToGrid(value: number, _axis: 'x' | 'y'): number {
    return Math.floor(value / CELL_SIZE);
  }

  /**
   * Convert grid cell index to world coordinate (center of cell).
   */
  private gridToWorld(gx: number, gy: number): Point {
    return {
      x: gx * CELL_SIZE + CELL_SIZE / 2,
      y: gy * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  /**
   * Clamp grid coordinates to valid range.
   */
  private clampToGrid(gx: number, gy: number): Point {
    return {
      x: Math.max(0, Math.min(this.gridWidth - 1, gx)),
      y: Math.max(0, Math.min(this.gridHeight - 1, gy)),
    };
  }

  /**
   * Draw the debug overlay showing the walkable grid.
   * Green = walkable, red = blocked.
   */
  private drawDebug(): void {
    this.clearDebug();

    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(999); // On top of everything

    for (let gy = 0; gy < this.gridHeight; gy++) {
      for (let gx = 0; gx < this.gridWidth; gx++) {
        const walkable = this.grid[gy]?.[gx] ?? false;
        const worldX = gx * CELL_SIZE;
        const worldY = gy * CELL_SIZE;

        if (walkable) {
          this.debugGraphics.fillStyle(0x00ff00, 0.2);
        } else {
          this.debugGraphics.fillStyle(0xff0000, 0.15);
        }
        this.debugGraphics.fillRect(worldX, worldY, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw grid lines
    this.debugGraphics.lineStyle(1, 0xffffff, 0.05);
    for (let gx = 0; gx <= this.gridWidth; gx++) {
      this.debugGraphics.lineBetween(gx * CELL_SIZE, 0, gx * CELL_SIZE, this.areaHeight);
    }
    for (let gy = 0; gy <= this.gridHeight; gy++) {
      this.debugGraphics.lineBetween(0, gy * CELL_SIZE, this.areaWidth, gy * CELL_SIZE);
    }
  }
}
