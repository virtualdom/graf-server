const dbConnect = require('../../src/helpers/dbConnect');
const dbURL = require('../../credentials').test.db;

describe ('dbConnect', () => {

  let dbConnection;

  it ('successfully connects to the database', () => {
    return dbConnect(dbURL, (err, connection) => {
      expect(err).to.be.null;
      expect(connection).to.not.be.null;
      dbConnection = connection;
    });
  });

  it ('utilizes previous connections', () => {
    return dbConnect(dbURL, (err, connection) => {
      expect(err).to.be.null;
      expect(connection).to.equal(dbConnection);
    });
  });

  it ('returns a promise when no callback is provided', () => {
    return expect(dbConnect(dbURL).then).to.not.be.undefined;
  });

});
