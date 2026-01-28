#!/bin/bash
# Display Ralph progress status

PRD_FILE="prd.json"
PROGRESS_FILE="progress.txt"

echo "═══════════════════════════════════════════════════════════════"
echo "  THE SMALLEST AMBASSADOR - Ralph Progress"
echo "═══════════════════════════════════════════════════════════════"

# Get project name
PROJECT=$(jq -r '.project' "$PRD_FILE" 2>/dev/null || echo "Unknown")
BRANCH=$(jq -r '.branchName' "$PRD_FILE" 2>/dev/null || echo "Unknown")
echo "  Project: $PROJECT"
echo "  Branch:  $BRANCH"
echo "───────────────────────────────────────────────────────────────"

# Count stories
TOTAL=$(jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo 0)
PASSED=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo 0)
REMAINING=$((TOTAL - PASSED))

# Find current (first non-passing) story
CURRENT=$(jq -r '.userStories[] | select(.passes == false) | "\(.id): \(.title)"' "$PRD_FILE" 2>/dev/null | head -1)

echo "  Progress: $PASSED / $TOTAL stories complete"
echo ""

# Progress bar
PCT=$((PASSED * 100 / TOTAL))
FILLED=$((PCT / 5))
EMPTY=$((20 - FILLED))
BAR=$(printf '█%.0s' $(seq 1 $FILLED 2>/dev/null) 2>/dev/null)$(printf '░%.0s' $(seq 1 $EMPTY 2>/dev/null) 2>/dev/null)
echo "  [$BAR] $PCT%"
echo ""

if [ -n "$CURRENT" ]; then
    echo "  ▶ CURRENT: $CURRENT"
else
    echo "  ✓ ALL STORIES COMPLETE!"
fi

echo "───────────────────────────────────────────────────────────────"

# Show recent progress entries
echo "  Recent Progress:"
tail -20 "$PROGRESS_FILE" 2>/dev/null | grep "^##" | tail -3 | while read line; do
    echo "    $line"
done

echo "═══════════════════════════════════════════════════════════════"
