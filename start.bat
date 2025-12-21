@echo off
REM Comic Generator Startup Script for Windows

echo 🎨 漫画分镜生成器启动脚本
echo ================================

REM Check if uv is installed
uv --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 uv，请先安装 uv
    echo 💡 Windows PowerShell 安装: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    pause
    exit /b 1
)

REM Sync dependencies
echo 📦 检查并安装依赖...
cd backend
call uv sync
if errorlevel 1 (
    echo ❌ 依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

REM Start backend server
echo 🚀 启动后端服务...
start "Comic Backend" cmd /k "cd backend && uv run app.py"

timeout /t 2 /nobreak >nul

REM Start frontend server
echo 🚀 启动前端服务...
start "Comic Frontend" cmd /k "python -m http.server 8000"

echo.
echo ================================
echo ✨ 服务已全部启动！
echo 🌐 请在浏览器中打开: http://localhost:8000
echo.
echo 📍 后端地址: http://localhost:5003
echo 📍 前端地址: http://localhost:8000
echo.
echo 关闭命令行窗口即可停止服务
echo ================================
pause
