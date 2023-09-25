module.exports = {
  apps: [
    {
      name: 'tomomaster-app',
      script: 'index.js',
      // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
      exec_mode: 'cluster_mode',
      instances: 2,
      'listen-timeout': 10000,
      restart_delay: 10000,
      autorestart: true,
      watch: false,
      time: true,
    },
    {
      name: 'tomomaster-crawler',
      script: 'crawl.js',
      exec_mode: 'fork',
      instances: 1,
      restart_delay: 10000,
      autorestart: true,
      watch: false,
      time: true,
    },
  ],
}
