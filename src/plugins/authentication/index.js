const Crypto = require('crypto');

const dbConnect = require('../../helpers/dbConnect');

exports.register = (server, options, next) => {
  if (!options.credentials) return next(new Error('Missing credentials.'));

  server.auth.strategy('simple', 'basic', {
    validateFunc (request, username, password, next) {
      return dbConnect(options.credentials.db)
      .then((client) => {
        const cipher = Crypto.createCipher('aes256', options.credentials.authPassword);

        return client.collection('grafusers')
        .findOne({
          username,
          password: cipher.update(password, 'utf8', 'hex') + cipher.final('hex')
        });
      })
      .then((user) => next(null, !!user, { username }))
      .catch((error) => next(error, false, {}));
    }
  });

  next();
};

exports.register.attributes = {
  name: 'graf-basic-authentication',
  version: require('../../../package').version
};
