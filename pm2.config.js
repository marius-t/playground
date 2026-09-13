module.exports = {
  apps: [
    {
      name: 'talsource-hide',
      script: './dist/index.js',
      max_memory_restart: '512M'
      // user: 'ubuntu'
    }
  ]
};
