#!/bin/bash

# Comprehensive Test Runner for InvPro360 Backend
# Run with: bash run_tests.sh

set -e

echo "================================="
echo "InvPro360 Backend Test Suite"
echo "================================="
echo ""

# Activate virtual environment
if [ -d "venv/bin" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found"
    exit 1
fi

# Check if pytest is installed
if ! python -c "import pytest" 2>/dev/null; then
    echo "📦 Installing pytest..."
    pip install pytest pytest-django pytest-cov
fi

echo ""
echo "🧪 Running Tests..."
echo "================================="

# Run all tests with coverage
pytest tests/ \
    --verbose \
    --tb=short \
    --color=yes \
    2>&1 | tee test_results.txt

echo ""
echo "================================="
echo "✅ Test Suite Complete"
echo "================================="
echo ""
echo "📊 Results saved to: test_results.txt"
echo ""

