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

# 数据分析（M9）
ANALYTICS_SALT="openssl rand -hex 32 生成的 64 位随机串"
ANALYTICS_PV_RETENTION_DAYS=90
MAXMIND_DB_PATH="./data/GeoLite2-City.mmdb"
ANALYTICS_AGGREGATE_CRON="*/5 * * * *"
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
- 申请证书时同时勾选 `www.zorazora.cn` 和 `zorazora.cn`
- 如果使用通配符证书，必须额外包含 `zorazora.cn`；`*.zorazora.cn` 不能匹配根域名
- 申请/续期证书
- 开启强制 HTTPS
- 建议将根域名 `zorazora.cn` 301 跳转到 `https://www.zorazora.cn`

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
# 后端日志（pm2 实时输出）
pm2 logs zora-blog-backend

# 后端日志文件（已落盘，便于历史检索）
tail -f /www/wwwlogs/zora-blog-backend.out.log     # 访问日志 + 业务 warn
tail -f /www/wwwlogs/zora-blog-backend.error.log   # 未捕获错误 + console.error

# Nginx 日志
tail -f /www/wwwlogs/zora-blog.access.log
tail -f /www/wwwlogs/zora-blog.error.log
```

应用层日志格式（[`backend/src/middleware/logger.ts`](../backend/src/middleware/logger.ts) 输出）：

```
GET /api/articles -> 200 (248ms)
POST /api/auth/login -> 401 (5ms)
```

### 5.3 日志轮转（pm2-logrotate）

pm2 默认不做日志轮转，文件会无限增长。**首次部署后执行一次**：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M       # 单文件最大 10MB
pm2 set pm2-logrotate:retain 7           # 保留最近 7 个文件
pm2 set pm2-logrotate:compress true      # 老文件 gzip 压缩
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # 每天 0 点强制轮转一次
```

验证：

```bash
pm2 conf pm2-logrotate           # 查看当前配置
ls -lh /www/wwwlogs/zora-blog-backend.*   # 一段时间后应能看到带日期后缀的归档文件
```

> **本里程碑暂未实现**：进程存活监控、数据库备份。后续按需另立任务。

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

### 6.4 数据分析看板没有地理数据

- 检查 `backend/data/GeoLite2-City.mmdb` 是否存在：`ls -lh backend/data/`
- 缺失时执行：
  ```bash
  cd /www/wwwroot/zora-blog
  MAXMIND_LICENSE_KEY=你的KEY ./repo/scripts/update-geoip.sh
  ```
- 检查文件大小是否 ≥ 70MB（小于这个值通常是下载失败）
- 重启 backend：`pm2 restart zora-blog-backend`，启动日志应能看到 `[geoip] MaxMind GeoLite2 已加载`
- 文件超过 45 天未更新会在部署时给出警告，建议每月手动跑一次 `update-geoip.sh`

### 6.5 七牛图片返回 401 / 无法显示

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
