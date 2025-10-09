@echo off
REM =========================================
REM Launch script for Expo + TypeScript project
REM =========================================

REM Step 1: Install dependencies if missing
IF NOT EXIST "node_modules" (
    echo 🔧 Installing dependencies...
    call npm install
)

REM Step 2: Install Expo if not present
echo 🔧 Ensuring Expo is installed...
call npm install expo --save

REM Step 3: Fix tsconfig.json safely
echo 🔧 Fixing tsconfig.json path...
call powershell -NoProfile -Command ^
    "if (Test-Path 'tsconfig.json') { (Get-Content 'tsconfig.json') -replace 'expo/tsconfig.base', 'expo/tsconfig.base.json' | Set-Content 'tsconfig.json' }"

REM Step 4: Start Expo app
echo 🚀 Starting Expo app...
call npx expo start

REM Step 5: Keep the console open
pause
