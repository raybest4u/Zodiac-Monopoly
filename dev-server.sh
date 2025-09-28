#!/bin/bash

# 十二生肖大富翁开发服务器自动重启脚本
# Zodiac Monopoly Dev Server Auto-restart Script

echo "🎮 启动十二生肖大富翁开发服务器..."
echo "🎮 Starting Zodiac Monopoly Development Server..."

# 无限循环，确保服务器持续运行
while true; do
    echo "📡 启动开发服务器 ($(date))"
    echo "📡 Starting dev server ($(date))"
    
    # 启动开发服务器
    npm run dev
    
    # 如果服务器退出，等待3秒后重启
    echo "⚠️  服务器已停止，3秒后自动重启..."
    echo "⚠️  Server stopped, restarting in 3 seconds..."
    sleep 3
done