module.exports = {
  apps: [
    {
      name: 'zora-blog-backend',
      cwd: '/www/wwwroot/zora-blog/backend',
      script: 'npm',
      args: 'run start:prod',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/www/wwwlogs/zora-blog-backend.error.log',
      out_file: '/www/wwwlogs/zora-blog-backend.out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
