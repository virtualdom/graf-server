const Bluebird = require('bluebird');
const Crypto = require('crypto');

const dbConnect = require('../../../src/helpers/dbConnect');
const credentials = require('../../../credentials').test;
const Server = require('../../../src/server');

const cipher = Crypto.createCipher('aes256', credentials.authPassword);

const user = {
  username: 'testyMcTestFace',
  password: cipher.update('password123', 'utf8', 'hex') + cipher.final('hex')
};

const header = `Basic ${new Buffer(`${user.username}:password123`, 'utf8').toString('base64')}`;
const fakeHeader = `Basic ${new Buffer('fakeuser:fakepass', 'utf8').toString('base64')}`;

describe ('basic authentication', () => {

  beforeEach(() => {
    return dbConnect(credentials.db)
    .then((connection) => {
      return connection.collection('grafusers').insert(user);
    })
  });

  it ('allows authenticated users', () => {
    return Server.inject({
      url: '/workouts',
      method: 'POST',
      headers: {
        Authorization: header
      }
    })
    .then((res) => {
      return expect(res.statusCode).to.eql(204);
    });
  });

  it ('disallows non-authenticated users', () => {
    return Server.inject({
      url: '/workouts',
      method: 'POST',
      headers: {
        Authorization: fakeHeader
      }
    })
    .then((res) => {
      expect(res.statusCode).to.eql(401);
      expect(res.result.message).to.contain('Bad username or password');
    });
  });

  it ('disallows if no authentication present', () => {
    return Server.inject({
      url: '/workouts',
      method: 'POST'
    })
    .then((res) => {
      expect(res.statusCode).to.eql(401);
      expect(res.result.message).to.contain('Missing authentication');
    });
  });

});
