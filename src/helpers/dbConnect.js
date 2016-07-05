const Bluebird = require('bluebird');
const MongoClient = require('mongodb').MongoClient;

const connections = {};

function MongoClientConnect (dbUrl) {
  return MongoClient.connect(dbUrl)
  .then((connection) => {
    connections[dbUrl] = connection;
    connection.on('close', () => {
      delete connections[dbUrl];
    });

    return connection;
  });
}

function dbConnect (dbUrl, next) {
  return Bluebird.resolve()
  .then(() => {
    if (connections[dbUrl]) return connections[dbUrl];
    else return MongoClientConnect(dbUrl);
  })
  .then((connection) => {
    if (!next || typeof next !== 'function')
      return Bluebird.resolve(connection);
    else return next(null, connection);
  });
};

module.exports = dbConnect;
