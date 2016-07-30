const Bluebird = require('bluebird');
const Crypto = require('crypto');
const Moment = require('moment');

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

const oldWorkout = { username, date: new Date('1-1-2001') };
const newWorkout = { username, date: new Date('5-5-2005') };

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

    it ('fetches a count of workouts', () => {
      return Server.inject({
        url: `/workouts/${username}`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.data).to.eql(2);
        return expect(res.statusCode).to.eql(200);
      });
    });

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
        expect(res.statusCode).to.eql(200);
        expect(res.result.data).to.eql(3);
      });
    });

    it ('increments workout count and fetches between date range', () => {
      return Server.inject({
        url: `/workouts?start_date=1-1-2002&end_date=${(new Moment()).add(1, 'day').format('M-D-YYYY')}`,
        method: 'POST',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.statusCode).to.eql(200);
        expect(res.result.data).to.eql(2);
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
        expect(res.statusCode).to.eql(200);
        expect(res.result.data).to.eql(1);
      });
    });

    it ('decrements workout count and fetches between date range', () => {
      return Server.inject({
        url: `/workouts?start_date=1-1-1999&end_date=${(new Moment()).add(1, 'day').format('M-D-YYYY')}`,
        method: 'DELETE',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.statusCode).to.eql(200);
        expect(res.result.data).to.eql(1);
      });
    });

  });

});
