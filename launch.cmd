@echo off
chcp 65001 >nul
title NanoDiff — Deep Archive & Code Inspector
cd /d "%~dp0"
echo ========================================================
echo   ɴᴀɴᴏᴅɪꜰꜰ — Deep Archive & Code Inspector v1.0.0
echo   Запуск локального сервера...
echo ========================================================
start "" "http://localhost:3000"
.\node_modules\.bin\vite.cmd --port 3000
