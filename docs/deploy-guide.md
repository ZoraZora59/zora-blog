# Zora Blog 部署指南（宝塔面板）

> 本文档指导在宝塔面板环境中部署 Zora Blog。

## 前置条件

- 宝塔面板已安装
- 已安装：Nginx、Node.js（v18+）、PostgreSQL、pm2
- 域名已解析到服务器 IP
- SSL 证书已配置（或使用宝塔一键申请）

## 一、数据库准备

### 1.1 创建生产数据库

通过宝塔面板或命令行执行：

```bash
# SSH 登录服务器
ssh aliyun

# 连接 PostgreSQL
su - postgres
psql -p 24991

# 执行初始化脚本
CREATE DATABASE blog_prod;
CREATE USER blog_prod WITH ENCRYPTED PASSWORD '你的强密码';
GRANT ALL PRIVILEGES ON DATABASE blog_prod TO blog_prod;
\c blog_prod
GRANT ALL ON SCHEMA public TO blog_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blog_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO blog_prod;
\q
exit
```

### 1.2 记录数据库连接信息

```
数据库地址: 127.0.0.1
端口: 24991
数据库名: blog_prod
用户名: blog_prod
密码: [你设置的密码]
```

## 二、项目部署

### 2.1 创建部署目录

```bash
mkdir -p /www/wwwroot/zora-blog
cd /www/wwwroot/zora-blog

# 克隆代码
git clone https://github.com/your-username/zora-blog.git repo
```

### 2.2 同步代码

```bash
# 后端
mkdir -p backend
rsync -av repo/backend/ backend/ --exclude node_modules --exclude dist

# 前端
mkdir -p frontend
rsync -av repo/frontend/ frontend/ --exclude node_modules --exclude dist

# 部署配置
mkdir -p deploy
rsync -av repo/deploy/ deploy/
```

### 2.3 配置环境变量

```bash
cd /www/wwwroot/zora-blog/backend
cp ../deploy/.env.production.example .env
```

编辑 `.env` 文件，填入实际值：

```env
DATABASE_URL="postgresql://blog_prod:你的密码@127.0.0.1:24991/blog_prod?schema=public"
JWT_SECRET="随机生成的32位以上字符串"
API_KEY_SALT="随机生成的盐值"
PORT=3001
NODE_ENV=production
SITE_URL="https://www.zorazora.cn"
QINIU_ACCESS_KEY="你的七牛 AK"
QINIU_SECRET_KEY="你的七牛 SK"
QINIU_BUCKET="zora-markdown"
QINIU_ROOT_PREFIX="/zora_blog"
QINIU_PUBLIC_BASE_URL="https://cdn.zorazora.cn"
```

说明：
- `QINIU_BUCKET` 当前项目固定使用 `zora-markdown`
- `QINIU_ROOT_PREFIX` 固定使用 `/zora_blog`
- 生产环境会自动把图片写入 `zora_blog/prod/`
- 非生产环境会自动写入 `zora_blog/non-prod/`
- 七牛空间必须是公开空间，否则前端直接访问图片会返回 `401`

生成随机密钥：
```bash
openssl rand -base64 32
```

### 2.4 安装依赖并构建

```bash
# 后端
cd /www/wwwroot/zora-blog/backend
npm install
npm run build

# 前端
cd /www/wwwroot/zora-blog/frontend
npm install
npm run build
```

### 2.5 数据库迁移

```bash
cd /www/wwwroot/zora-blog/backend
npx prisma migrate deploy
npx prisma db seed  # 创建默认管理员账户
```

### 2.6 迁移历史本地图片

如果线上仍有旧的 `/uploads/*` 图片引用，首次切换到七牛后需要执行一次迁移：

```bash
cd /www/wwwroot/zora-blog/backend

# 先预演，查看哪些记录会被迁移
npm run media:migrate-to-qiniu -- --dry-run

# 确认无误后正式执行
npm run media:migrate-to-qiniu
```

迁移范围：
- 管理员头像 `admins.avatar`
- 文章封面 `articles.coverImage`
- 专题封面 `topics.coverImage`
- 站点 Logo `site_settings.logo`

迁移规则：
- 仅处理值为 `/uploads/*` 或历史站点 `/uploads/*` URL 的记录
- 本地源文件默认从 `backend/uploads/` 读取
- 上传后统一写入七牛 `zora_blog/prod/legacy/`
- 数据库字段会回写为七牛公网 URL

建议：
- 正式执行前先备份数据库
- 在确认页面展示无误前，不要删除服务器上的旧 `backend/uploads/` 文件
- 使用 `deploy/deploy.sh` 部署时，会自动执行正式迁移

### 2.7 启动后端服务

```bash
pm2 start /www/wwwroot/zora-blog/deploy/ecosystem.config.js --env production
pm2 save
```

验证服务：
```bash
pm2 status
curl http://127.0.0.1:3001/
```

## 三、Nginx 配置

### 3.1 宝塔面板配置

1. 进入宝塔面板 → 网站 → 添加站点
2. 域名填写：`www.zorazora.cn` 和 `zorazora.cn`
3. PHP 版本选择：纯静态
4. 创建站点

### 3.2 修改 Nginx 配置

1. 点击站点 → 设置 → 配置文件
2. 替换为 `deploy/nginx.conf` 内容
3. 保存并重载

或通过命令行：
```bash
cp /www/wwwroot/zora-blog/deploy/nginx.conf /www/server/panel/vhost/nginx/www.zorazora.cn.conf
nginx -t && nginx -s reload
```

### 3.3 SSL 证书

在宝塔面板 → 网站 → SSL 中：
- 选择 Let's Encrypt
- 申请/续期证书
- 开启强制 HTTPS

## 四、验证部署

### 4.1 检查服务状态

```bash
# 后端服务
pm2 status

# 端口监听
netstat -tlnp | grep 3001

# 日志查看
pm2 logs zora-blog-backend
```

### 4.2 访问测试

- 前台首页：https://www.zorazora.cn
- 管理后台：https://www.zorazora.cn/admin
- API 健康检查：https://www.zorazora.cn/
- 管理端上传一张测试图片后，确认返回 URL 为 `https://cdn.zorazora.cn/zora_blog/prod/...`

### 4.3 默认管理员

首次部署后使用以下凭证登录：
- 用户名：`admin`
- 密码：见 seed 输出或自行修改数据库

## 五、日常运维

### 5.1 更新部署

```bash
cd /www/wwwroot/zora-blog
./deploy/deploy.sh
```

### 5.2 查看日志

```bash
# 后端日志
pm2 logs zora-blog-backend

# Nginx 日志
tail -f /www/wwwlogs/zora-blog.access.log
tail -f /www/wwwlogs/zora-blog.error.log
```

### 5.3 数据库备份

在宝塔面板 → 计划任务 中添加：
- 任务类型：备份数据库
- 执行周期：每天凌晨 3 点
- 备份到：本地 + 远程存储

### 5.4 监控告警

宝塔面板 → 监控 中可查看：
- CPU 使用率
- 内存使用率
- 磁盘空间
- 可设置告警阈值

## 六、故障排查

### 6.1 502 Bad Gateway

- 检查后端服务是否运行：`pm2 status`
- 检查端口是否监听：`netstat -tlnp | grep 3001`
- 检查防火墙：确保 3001 端口在内部可访问

### 6.2 数据库连接失败

- 检查 PostgreSQL 服务：`systemctl status postgresql`
- 检查连接字符串：`.env` 中的 `DATABASE_URL`
- 检查用户权限：`GRANT` 语句是否执行

### 6.3 前端页面空白

- 检查构建产物：`ls -la /www/wwwroot/zora-blog/frontend/dist`
- 检查 Nginx root 配置
- 检查浏览器控制台错误

### 6.4 七牛图片返回 401 / 无法显示

- 检查 `.env` 中的 `QINIU_PUBLIC_BASE_URL` 是否正确
- 检查七牛空间是否为公开空间
- 检查上传后的 URL 是否落在 `zora_blog/prod/` 目录
- 检查域名 `cdn.zorazora.cn` 是否仍绑定在 `zora-markdown` 空间
- 如为历史资源切换阶段，执行 `npm run media:migrate-to-qiniu -- --dry-run` 确认仍有未迁移记录

---

## 附录：目录结构

```
/www/wwwroot/zora-blog/
├── repo/                    # Git 仓库
├── backend/                 # 后端代码
│   ├── dist/               # 编译产物
│   ├── uploads/            # 历史本地图片（迁移完成前保留）
│   ├── prisma/             # 数据库模型
│   └── .env                # 环境变量
├── frontend/               # 前端代码
│   └── dist/               # 构建产物
└── deploy/                 # 部署配置
    ├── nginx.conf
    ├── ecosystem.config.js
    ├── deploy.sh
    └── .env.production.example
```
