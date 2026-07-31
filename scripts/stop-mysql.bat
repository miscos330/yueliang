@echo off
chcp 65001 >nul
echo 正在停止 MySQL ...
"E:\mysql-8.4.3-winx64\bin\mysqladmin" -u root -pyueliang shutdown
echo MySQL 已停止。
pause
