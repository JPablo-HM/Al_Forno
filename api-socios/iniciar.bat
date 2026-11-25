@echo off
REM =====================================================================
REM  API de socios de AL FORNO (PHP) - doble clic para arrancarla
REM  Revisa que PHP tenga pdo_mysql y abre http://localhost:8000
REM  Para detenerla: Ctrl + C o cerrar esta ventana.
REM =====================================================================
cd /d "%~dp0"

php -m | findstr /i "pdo_mysql" >nul
if errorlevel 1 (
  echo.
  echo  Falta activar pdo_mysql en PHP.
  echo  1. Este es su php.ini:
  php --ini | findstr /i "Loaded"
  echo  2. Abralo, busque la linea  ;extension=pdo_mysql  y quite el ";"
  echo  3. Guarde y vuelva a abrir este archivo.
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  echo  Falta el archivo .env: copie .env.example como .env
  pause
  exit /b 1
)

echo  API de socios corriendo en http://localhost:8000   (Ctrl + C para detener)
php -S localhost:8000 index.php
pause
