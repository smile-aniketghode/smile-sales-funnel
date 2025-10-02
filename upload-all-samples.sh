#!/bin/bash

echo "🚀 Uploading all 5 sample emails to populate demo database..."
echo ""

cd "/Users/aniketghode/development/SMILe Sales Funnel"

for file in samples/*.txt; do
  filename=$(basename "$file")
  echo "📧 Processing: $filename"

  result=$(curl -s -X POST http://localhost:8000/ingestEmail -F "file=@$file")

  tasks=$(echo "$result" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['results']['tasks_created'])" 2>/dev/null || echo "0")
  deals=$(echo "$result" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['results']['deals_created'])" 2>/dev/null || echo "0")
  time=$(echo "$result" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['processing_time_ms'])" 2>/dev/null || echo "0")

  if [ "$tasks" != "0" ] || [ "$deals" != "0" ]; then
    echo "   ✅ Tasks: $tasks, Deals: $deals, Time: ${time}ms"
  else
    echo "   ❌ Failed to process"
  fi

  echo ""
  sleep 2  # Rate limit to avoid overwhelming API
done

echo "✨ Done! Check http://localhost:5173 to see the results"
