@echo off
title 3D Highway Speed Racer - Turbo Overdrive
echo ============================================================
echo         TURBO OVERDRIVE 3D - HIGHWAY SPEED RACER
echo ============================================================
echo.
echo Memulai server game lokal dan membuka browser...
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js terdeteksi.
    echo Membuka browser di http://localhost:8000 ...
    start http://localhost:8000
    node server.js
    if %errorlevel% neq 0 (
        echo.
        echo Terjadi masalah saat menjalankan server.
        pause
    )
    goto end
)

where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python terdeteksi. Membuka browser di http://localhost:8000 ...
    start http://localhost:8000
    python -m http.server 8000
    if %errorlevel% neq 0 (
        echo.
        echo Terjadi masalah saat menjalankan server.
        pause
    )
    goto end
)

echo [PERINGATAN] Node.js atau Python tidak ditemukan pada PATH sistem.
echo Silakan install Node.js (https://nodejs.org) atau Python untuk menjalankan game ini.
pause

:end

