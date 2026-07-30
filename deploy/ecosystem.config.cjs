module.exports = {
  apps: [
    {
      name: 'queen-promotoras',
      script: 'index.js',
      cwd: '/var/www/queen-promotoras/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
