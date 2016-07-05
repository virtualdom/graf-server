const Bluebird = require('bluebird');

const dbConnect = require('../src/helpers/dbConnect');
const dbURL = require('../credentials').test.db;

function ClearDatabase () {
  return dbConnect(dbURL)
  .then((connection) => {
    return Bluebird.all([
      connection.collection('grafusers').deleteMany({}),
      connection.collection('grafworkouts').deleteMany({}),
      connection.collection('grafgroups').deleteMany({})
    ]);
  });
}

beforeEach(ClearDatabase);
after(ClearDatabase);
