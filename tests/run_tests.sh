#!/usr/bin/env bash
set -e
cd /Users/minjaekwon1/Projects/Active/openai-realtime-console
pip3 install httpx pytest -q 2>/dev/null
echo "=== Voice System Tests ==="
python3 -m pytest tests/ -v --tb=short "$@"
