const Bluebird = require('bluebird');
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

const oldWorkout = { username, date: new Date('1/1/2001') };
const newWorkout = { username, date: new Date('5/5/2005') };

describe ('workout routes', () => {

  beforeEach(() => {
    return dbConnect(credentials.db)
    .then((connection) => {
      return Bluebird.all([
        connection.collection('grafusers').insert(user),
        connection.collection('grafworkouts').insertMany([ oldWorkout, newWorkout ])
      ]);
    })
  });

  describe ('list', () => {

    it ('fetches a count of workouts between date range', () => {
      return Server.inject({
        url: `/workouts/${username}?start_date=4-4-2004&end_date=6-6-2006`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.data).to.eql(1);
        return expect(res.statusCode).to.eql(200);
      });
    });

    it ('requires start date', () => {
      return Server.inject({
        url: `/workouts/${username}?end_date=6-6-2006`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('"start_date" is required');
        return expect(res.statusCode).to.eql(400);
      });
    });

    it ('requires end date', () => {
      return Server.inject({
        url: `/workouts/${username}?start_date=6-6-2006`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('"end_date" is required');
        return expect(res.statusCode).to.eql(400);
      });
    });

  });

  describe ('create', () => {

    it ('increments workout count', () => {
      return Server.inject({
        url: '/workouts',
        method: 'POST',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.statusCode).to.eql(204);

        return Server.inject({
          url: `/workouts/${username}?start_date=1-1-1999&end_date=${(new Date).getTime()}`,
          method: 'GET',
          headers: {
            Authorization: header
          }
        })
      })
      .then((res) => {
        expect(res.result.data).to.eql(3);
      });
    });

  });

  describe ('delete', () => {

    it ('decrements workout count', () => {
      return Server.inject({
        url: '/workouts',
        method: 'DELETE',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.statusCode).to.eql(204);

        return Server.inject({
          url: `/workouts/${username}?start_date=1-1-1999&end_date=${(new Date).getTime()}`,
          method: 'GET',
          headers: {
            Authorization: header
          }
        })
      })
      .then((res) => {
        expect(res.result.data).to.eql(1);
      });
    });

  });

});
