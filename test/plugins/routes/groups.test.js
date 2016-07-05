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

const userGroup = {
  name: 'usergroup',
  members: [ username ]
};

const anotherUserGroup = {
  name: 'anotherusergroup',
  members: [ username ]
};

const nonUserGroup = {
  name: 'nonusergroup',
  members: [ 'someoneElse' ]
};

describe ('group routes', () => {

  beforeEach(() => {
    return dbConnect(credentials.db)
    .then((connection) => {
      return Bluebird.all([
        connection.collection('grafusers').insert(user),
        connection.collection('grafgroups').insertMany([ userGroup, anotherUserGroup, nonUserGroup ])
      ]);
    })
  });

  describe ('list', () => {

    it ('produces all groups the user belongs to', () => {
      return Server.inject({
        url: '/groups',
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        res.result.data.forEach((group) => {
          expect(group.members).to.contain(username);
        });

        return expect(res.statusCode).to.eql(200);
      });
    });

  });

  describe ('retrieve', () => {

    it ('gets group user belongs to', () => {
      const groupName = 'usergroup';

      return Server.inject({
        url: `/groups/${groupName}`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.name).to.eql(groupName);
        expect(res.result.members).to.contain(username);
        return expect(res.statusCode).to.eql(200);
      });
    });

    it ('fails for nonexistent groups', () => {
      const groupName = 'notARealGroup';

      return Server.inject({
        url: `/groups/${groupName}`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('group notARealGroup not found');
        return expect(res.statusCode).to.eql(404);
      });
    });

    it ('fails for group that does not contain user', () => {
      const groupName = 'nonusergroup';

      return Server.inject({
        url: `/groups/${groupName}`,
        method: 'GET',
        headers: {
          Authorization: header
        }
      })
      .then((res) => {
        expect(res.result.message).to.contain('group nonusergroup not found');
        return expect(res.statusCode).to.eql(404);
      });
    });

  });

  describe ('create', () => {

    it ('joins group if it already exists', () => {
      const groupName = 'nonusergroup';

      return Server.inject({
        url: '/groups',
        method: 'POST',
        headers: {
          Authorization: header
        },
        payload: {
          name: groupName
        }
      })
      .then((res) => {
        expect(res.result.name).to.eql(groupName);
        expect(res.result.members.length).to.be.at.least(2);
        expect(res.result.members).to.contain(username);
        return expect(res.statusCode).to.eql(200);
      });
    });

    it ('creates group if it does not already exist', () => {
      const groupName = 'newusergroup';

      return Server.inject({
        url: '/groups',
        method: 'POST',
        headers: {
          Authorization: header
        },
        payload: {
          name: groupName
        }
      })
      .then((res) => {
        expect(res.result.name).to.eql(groupName);
        expect(res.result.members.length).to.eql(1);
        expect(res.result.members).to.contain(username);
        return expect(res.statusCode).to.eql(200);
      });
    });

    it ('fails if group name is not present', () => {
      return Server.inject({
        url: '/groups',
        method: 'POST',
        headers: {
          Authorization: header
        },
        payload: {}
      })
      .then((res) => {
        expect(res.result.message).to.contain('"name" is required');
        return expect(res.statusCode).to.eql(400);
      });
    });

    it ('trims group name', () => {
      const groupName = '      newusergroup      ';

      return Server.inject({
        url: '/groups',
        method: 'POST',
        headers: {
          Authorization: header
        },
        payload: {
          name: groupName
        }
      })
      .then((res) => {
        expect(res.result.name).to.eql(groupName.trim());
        return expect(res.statusCode).to.eql(200);
      });
    });

    it ('lower cases group name', () => {
      const groupName = 'UsErGrOuP';

      return Server.inject({
        url: '/groups',
        method: 'POST',
        headers: {
          Authorization: header
        },
        payload: {
          name: groupName
        }
      })
      .then((res) => {
        expect(res.result.name).to.eql(groupName.toLowerCase());
        return expect(res.statusCode).to.eql(200);
      });
    });

  });

});
