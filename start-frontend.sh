#!/bin/bash
# 启动前端服务

cd "$(dirname "$0")/frontend"

echo "启动价值流模拟器前端应用..."
echo "访问地址: http://localhost:5173"
echo ""

npm run dev

