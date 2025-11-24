#!/bin/bash
# 启动后端服务

cd "$(dirname "$0")/backend"

echo "启动价值流模拟器后端服务..."
echo "API文档: http://localhost:8000/docs"
echo ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

