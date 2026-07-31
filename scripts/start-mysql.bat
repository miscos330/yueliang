@echo off
chcp 65001 >nul
title 月亮通讯 - MySQL
echo 正在启动 MySQL 8.4  (localhost:3306, 数据库: yueliang)
echo 关闭本窗口即停止 MySQL。
echo ------------------------------------------------------------
"E:\mysql-8.4.3-winx64\bin\mysqld" --datadir=E:\mysql-8.4.3-winx64\data --console
