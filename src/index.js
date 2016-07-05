const server = require('./server.js');

server.start(() => {
  process.on('SIGTERM', () => {
    server.stop({timeout: 5 * 1000}, () => {
      process.exit(0);
    });
  });

  console.log('Sever started!');
});
