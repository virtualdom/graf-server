const Crypto = require('crypto');

const dbConnect = require('../../../src/helpers/dbConnect');
const credentials = require('../../../credentials').test;
const Server = require('../../../src/server');

const cipher = Crypto.createCipher('aes256', credentials.authPassword);

const username = 'testymctestface';
const password = 'password123';
const header = `Basic ${new Buffer(`${username}:${password}`, 'utf8').toString('base64')}`;
const user = {
  username,
  password: cipher.update(password, 'utf8', 'hex') + cipher.final('hex')
};

describe ('user routes', () => {

  beforeEach(() => {
    return dbConnect(credentials.db)
    .then((connection) => {
      return connection.collection('grafusers').insert(user);
    })
  });

  describe ('retrieve', () => {

    it ('succeeds on true username lookup', () => {
      return Server.inject({
        url: `/users/${username}`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        return expect(res.statusCode).to.eql(204);
      });
    });

    it ('fails on unsuccessful username lookup', () => {
      return Server.inject({
        url: '/users/fakeyMcFakePants',
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.error).to.contain('Not Found');
        return expect(res.statusCode).to.eql(404);
      });
    });

  });

  describe ('create', () => {

    it ('succeeds with valid input', () => {
      return Server.inject({
        url: '/users',
        method: 'POST',
        payload: {
          username: 'NewUser',
          password: 'NewPassword123'
        }
      })
      .then((res) => {
        return expect(res.statusCode).to.eql(204);
      });
    });

    it ('requires username payload input', () => {
      return Server.inject({
        url: '/users',
        method: 'POST',
        payload: {
          password: 'NewPassword123'
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('"username" is required');
        return expect(res.statusCode).to.eql(400);
      });
    });

    it ('requires password payload input', () => {
      return Server.inject({
        url: '/users',
        method: 'POST',
        payload: {
          username: 'NewUser'
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('"password" is required');
        return expect(res.statusCode).to.eql(400);
      });
    });

    it ('fails if user already exists', () => {
      return Server.inject({
        url: '/users',
        method: 'POST',
        payload: {
          username,
          password
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('user already exists');
        return expect(res.statusCode).to.eql(409);
      });
    });

    it ('is case-insensitive for usernames', () => {
      let upperCaseUsername = 'UsErNaMe';

      return Server.inject({
        url: '/users',
        method: 'POST',
        payload: {
          username: upperCaseUsername,
          password: 'ButThisIsFine'
        }
      })
      .then((res) => {
        expect(res.statusCode).to.eql(204);

        return dbConnect(credentials.db)
      })
      .then((connection) => {
        return connection.collection('grafusers').findOne({ username: upperCaseUsername.toLowerCase() });
      })
      .then((user) => {
        expect(user).to.not.be.null;
        return expect(user.username).to.eql('username');
      });
    });

    it ('trims whitespace for usernames',() => {
      let spaceyUsername = '      username      ';

      return Server.inject({
        url: '/users',
        method: 'POST',
        payload: {
          username: spaceyUsername,
          password: 'ButThisIsFine'
        }
      })
      .then((res) => {
        expect(res.statusCode).to.eql(204);

        return dbConnect(credentials.db)
      })
      .then((connection) => {
        return connection.collection('grafusers').findOne({ username: spaceyUsername.trim() });
      })
      .then((user) => {
        expect(user).to.not.be.null;
        return expect(user.username).to.eql('username');
      });

    });

  });

});
