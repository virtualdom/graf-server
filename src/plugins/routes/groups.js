const Boom = require('boom');
const Joi = require('joi');

const dbConnect = require('../../helpers/dbConnect');

exports.register = (server, options, next) => {
  if (!options.credentials) return next(new Error('Missing credentials.'));

  server.route({
    method: 'GET',
    path: '/groups',
    config: {
      cors: true,
      handler: (req, reply) => {
        return dbConnect(options.credentials.db)
        .then((client) => {
          return client.collection('grafgroups')
          .find({ members: req.auth.credentials.username }, {_id: 0})
          .toArray();
        })
        .then((groups) => reply({data: groups}))
        .catch(reply);
      },
      auth: 'simple'
    }
  });

  server.route({
    method: 'GET',
    path: '/groups/{groupName}',
    config: {
      cors: true,
      handler: (req, reply) => {
        const groupName = req.params.groupName;

        return dbConnect(options.credentials.db)
        .then((client) => {
          return client.collection('grafgroups')
          .findOne({
            name: groupName,
            members: req.auth.credentials.username
          }, { _id: 0 });
        })
        .then((group) => {
          if (!group) return reply(Boom.notFound(`group ${groupName} not found`));
          return reply(group);
        })
        .catch(reply);
      },
      auth: 'simple'
    }
  });

  server.route({
    method: 'POST',
    path: '/groups',
    config: {
      cors: true,
      handler: (req, reply) => {
        const groupName = req.payload.name;
        const username = req.auth.credentials.username;
        let groups;

        return dbConnect(options.credentials.db)
        .then((client) => {
          groups = client.collection('grafgroups');
          return groups.findOne({ name: groupName });
        })
        .then((group) => {
          if (!group)
            return groups.insert({
              name: groupName,
              members: [ username ]
            });
          else
            return groups.update({
              name: groupName
            }, {
              $addToSet: { members: username }
            });
        })
        .then(() => groups.findOne({ name: groupName }))
        .then(reply)
        .catch(reply);
      },
      auth: 'simple',
      validate: {
        payload: {
          name: Joi.string().lowercase().trim().required()
        }
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'graf-groups',
  version: require('../../../package').version
};
