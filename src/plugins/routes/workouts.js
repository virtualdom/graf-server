const Joi = require('joi');

const dbConnect = require('../../helpers/dbConnect');

exports.register = (server, options, next) => {
  if (!options.credentials) return next(new Error('Missing credentials.'));

  server.route({
    method: 'GET',
    path: '/workouts/{username}',
    config: {
      handler: (req, reply) => {
        return dbConnect(options.credentials.db)
        .then((client) => {
          return client.collection('grafworkouts').find({
            username: req.params.username,
            date: {
              $lte: req.query.end_date,
              $gte: req.query.start_date
            }
          }, {_id: 0})
          .count();
        })
        .then((count) => reply({data: count}))
        .catch(reply);
      },
      auth: 'simple',
      validate: {
        query: {
          start_date: Joi.date().required(),
          end_date: Joi.date().min(Joi.ref('start_date')).required()
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/workouts',
    config: {
      handler: (req, reply) => {
        return dbConnect(options.credentials.db)
        .then((client) => {
          return client.collection('grafworkouts').insert({
            username: req.auth.credentials.username,
            date: new Date()
          });
        })
        .then(() => reply().code(204))
        .catch(reply);
      },
      auth: 'simple'
    }
  });

  server.route({
    method: 'DELETE',
    path: '/workouts',
    config: {
      handler: (req, reply) => {
        let grafworkouts;

        return dbConnect(options.credentials.db)
        .then((client) => {
          grafworkouts = client.collection('grafworkouts');

          return grafworkouts.find({
            username: req.auth.credentials.username
          })
          .sort({date: -1})
          .limit(1)
          .toArray();
        })
        .then((workout) => grafworkouts.remove({_id: workout[0]._id}))
        .then(() => reply().code(204))
        .catch(reply);
      },
      auth: 'simple'
    }
  });

  next();
};

exports.register.attributes = {
  name: 'graf-workouts',
  version: require('../../../package').version
};
