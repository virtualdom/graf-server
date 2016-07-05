const Basic = require('hapi-auth-basic');
const Hapi = require('hapi');

const credentials = require('../credentials')[process.env.ENV || 'test'];

const server = new Hapi.Server({
  connections: {
    router: {
      stripTrailingSlash: true
    }
  }
});

server.connection({port: process.env.PORT || 80});

server.register([
  Basic,
  { register: require('./plugins/authentication'), options: { credentials } },
  { register: require('./plugins/routes/workouts'), options: { credentials } },
  { register: require('./plugins/routes/users'), options: { credentials } },
  { register: require('./plugins/routes/groups'), options: { credentials } }
], (err) => {
  if (err) throw (err);
});

module.exports = server;
