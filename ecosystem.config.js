module.exports = {
  apps: [
    {
      name: 'next-doc',
      cwd: './',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 重启策略
      max_memory_restart: '1G',
      autorestart: true,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
