#!/bin/bash

# 服务器状态检查脚本
# Server Status Check Script

PORT=5173
URL="http://localhost:$PORT"

echo "🔍 检查开发服务器状态..."
echo "🔍 Checking development server status..."

# 检查端口是否开放
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 端口 $PORT 正在监听"
    echo "✅ Port $PORT is listening"
    
    # 检查HTTP响应
    if curl -s --connect-timeout 5 $URL > /dev/null; then
        echo "✅ 服务器响应正常"
        echo "✅ Server is responding"
        echo "🌐 访问地址: $URL"
        echo "🌐 Access URL: $URL"
    else
        echo "❌ 服务器无响应"
        echo "❌ Server is not responding"
    fi
else
    echo "❌ 端口 $PORT 未监听"
    echo "❌ Port $PORT is not listening"
    echo "💡 运行以下命令启动服务器:"
    echo "💡 Run the following command to start the server:"
    echo "   npm run dev"
    echo "   或者使用自动重启脚本: ./dev-server.sh"
    echo "   Or use auto-restart script: ./dev-server.sh"
fi