-- Zora Blog 生产数据库初始化脚本
-- 在 PostgreSQL 中执行（端口 24991）

-- 创建数据库
CREATE DATABASE blog_prod;

-- 创建专用用户（请修改密码）
CREATE USER blog_prod WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE blog_prod TO blog_prod;

-- 连接到 blog_prod 数据库后执行
\c blog_prod

-- 授权 schema 权限
GRANT ALL ON SCHEMA public TO blog_prod;

-- 允许用户创建表（Prisma 迁移需要）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blog_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blog_prod;
