const Boom = require('boom');
const Crypto = require('crypto');
const Joi = require('joi');

const dbConnect = require('../../helpers/dbConnect');

exports.register = (server, options, next) => {
  if (!options.credentials) return next(new Error('Missing credentials.'));

  server.route({
    method: 'GET',
    path: '/users/{username}',
    config: {
      cors: true,
      handler: (req, reply) => {
        const cipher = Crypto.createCipher('aes256', options.credentials.authPassword);
        const username = req.params.username;

        return dbConnect(options.credentials.db)
        .then((client) => client.collection('grafusers').findOne({ username }))
        .then((user) => {
          if (!user) return reply(Boom.notFound());
          return reply().code(204);
        })
        .catch(reply);
      },
      auth: 'simple'
    }
  });

  server.route({
    method: 'POST',
    path: '/users',
    config: {
      cors: true,
      handler: (req, reply) => {
        const cipher = Crypto.createCipher('aes256', options.credentials.authPassword);
        const username = req.payload.username;
        let users;

        return dbConnect(options.credentials.db)
        .then((client) => {
          users = client.collection('grafusers');
          return users.findOne({ username });
        })
        .then((user) => {
          if (user) throw Boom.conflict('user already exists');

          return users.insert({
            username,
            password: cipher.update(req.payload.password, 'utf8', 'hex') + cipher.final('hex')
          });
        })
        .then(() => reply().code(204))
        .catch(reply);
      },
      validate: {
        payload: {
          username: Joi.string().lowercase().trim().required(),
          password: Joi.string().required()
        }
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'graf-users',
  version: require('../../../package').version
};
