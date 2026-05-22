@REM Licensed to the Apache Software Foundation (ASF)
@echo off

@setlocal

set WRAPPER_JAR="%~dp0.mvn\wrapper\maven-wrapper.jar"

@REM Find java.exe
if defined JAVA_HOME (
    set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
) else (
    set "JAVA_EXE=java.exe"
)

"%JAVA_EXE%" ^
  "-Dmaven.multiModuleProjectDirectory=%~dp0." ^
  -classpath %WRAPPER_JAR% ^
  org.apache.maven.wrapper.MavenWrapperMain ^
  %*

if ERRORLEVEL 1 exit /B 1
