module.exports = {
  apps: [{
    name: 'panel',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/srv/panel',
    env: {
      NODE_ENV: 'production',
      TZ: 'America/Bogota',
    }
  }]
}
