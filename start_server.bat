@echo off
chcp 65001 >nul
title OJT Tracker - Server & Device Access Manager
cls
echo =====================================================================
echo                OJT TRACKER - LOCAL & NETWORK ACCESS
echo =====================================================================
echo.

:: Get Local IP address
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.*0.0.0.0"') do (
    set LOCAL_IP=%%a
)

:: Fallback if not found via route
if "%LOCAL_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
        set LOCAL_IP=%%a
        goto ip_found
    )
)
:ip_found
set LOCAL_IP=%LOCAL_IP: =%

echo [STATUS] Your Local Network IP: %LOCAL_IP%
echo.
echo ---------------------------------------------------------------------
echo  DEVICE ACCESS URLS:
echo ---------------------------------------------------------------------
echo  This PC:         http://localhost/OJT-Tracker/
if not "%LOCAL_IP%"=="" (
echo  Other Devices:   http://%LOCAL_IP%/OJT-Tracker/
echo  (Connect your phone or other device to the same Wi-Fi network)
)
echo.
echo ---------------------------------------------------------------------
echo  SECURITY NOTICE:
echo ---------------------------------------------------------------------
echo  * SQLite Database is secured inside database/ with .htaccess
echo  * Direct database downloads over HTTP are BLOCKED (403 Forbidden)
echo  * Passwords use strong bcrypt hashing
echo ---------------------------------------------------------------------
echo.

:: Check if port 80 is listening (XAMPP Apache)
netstat -ano | findstr ":80 " >nul
if %errorlevel% equ 0 (
    echo [OK] XAMPP Apache is currently RUNNING on Port 80.
    echo      You can now open the link above on any device.
    echo.
    echo Press any key to open the dashboard in your default browser...
    pause >nul
    start http://localhost/OJT-Tracker/
    exit /b
)

:: If Apache is not running, offer PHP built-in server on port 8000
echo [INFO] XAMPP Apache is NOT detected on port 80.
echo        You can start PHP's built-in standalone web server now!
echo.
echo Starting Standalone PHP Server on 0.0.0.0:8000...
echo Access via:
echo   This PC:        http://localhost:8000/
if not "%LOCAL_IP%"=="" (
echo   Other Devices:  http://%LOCAL_IP%:8000/
)
echo.
echo Press Ctrl+C to stop the server when done.
echo.
start http://localhost:8000/
php -S 0.0.0.0:8000
