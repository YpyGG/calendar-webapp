@echo off
REM Запуск локального сервера для фронтенда (порт 8080)
REM Требуется Node.js (https://nodejs.org/) и интернет для первой установки http-server

cd /d %~dp0

REM Проверяем, установлен ли http-server глобально
where http-server >nul 2>nul
if %errorlevel%==0 (
    echo Запуск http-server на http://localhost:8080 ...
    http-server . -p 8080
) else (
    echo http-server не найден, будет использован npx для запуска.
    npx http-server . -p 8080
)

pause 