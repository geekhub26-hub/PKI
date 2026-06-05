@echo off
REM Maven wrapper alternative utilisant Docker
REM Exécute Maven dans un conteneur Docker (requiert Docker installé)
SETLOCAL ENABLEDELAYEDEXPANSION
set SCRIPT_DIR=%~dp0
REM Supprime la barre oblique finale
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

docker run --rm -v "%SCRIPT_DIR%:/workspace" -w /workspace maven:3.9.6-eclipse-temurin-21 mvn %*
