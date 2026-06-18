@echo off
chcp 65001 >nul
echo ========================================
echo   旅游规划系统 - 后端服务启动脚本
echo ========================================
echo.

cd backend

echo [1/3] 检查Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Node.js,请先安装Node.js
    pause
    exit /b 1
)
echo ✅ Node.js已安装

echo.
echo [2/3] 安装依赖...
if not exist node_modules (
    echo 正在安装npm依赖包...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [3/3] 检查环境变量配置...
if not exist .env (
    echo ⚠️  警告: 未找到.env文件
    echo 请复制.env.example为.env并填写配置
    echo.
    echo 按任意键继续使用默认配置(可能无法正常运行)...
    pause >nul
) else (
    echo ✅ .env配置文件已存在
)

echo.
echo ========================================
echo   启动服务器...
echo ========================================
echo.
echo 服务器地址: http://localhost:3000
echo API文档: http://localhost:3000/health
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm run dev
