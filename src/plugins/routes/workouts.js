const Joi = require('joi');

const dbConnect = require('../../helpers/dbConnect');

exports.register = (server, options, next) => {
  if (!options.credentials) return next(new Error('Missing credentials.'));

  server.route({
    method: 'GET',
    path: '/workouts/{username}',
    config: {
      cors: true,
      handler: (req, reply) => {
        return dbConnect(options.credentials.db)
        .then((client) => {
          const params = { username: req.params.username };

          if (req.query.start_date || req.query.end_date) {
            params.date = {};

            if (req.query.start_date)
              params.date['$gte'] = req.query.start_date;

            if (req.query.end_date)
              params.date['$lte'] = req.query.end_date;
          }

          return client.collection('grafworkouts').find(params, {_id: 0})
          .count();
        })
        .then((count) => reply({data: count}))
        .catch(reply);
      },
      auth: 'simple',
      validate: {
        query: {
          start_date: Joi.date().optional(),
          end_date: Joi.date().optional()
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/workouts',
    config: {
      cors: true,
      handler: (req, reply) => {
        const connection = dbConnect(options.credentials.db);

        return connection
        .then((client) => {
          return client.collection('grafworkouts').insert({
            username: req.auth.credentials.username,
            date: new Date()
          });
        })
        .then(() => connection)
        .then((client) => {
          const params = { username: req.auth.credentials.username };

          if (req.query.start_date || req.query.end_date) {
            params.date = {};

            if (req.query.start_date)
              params.date['$gte'] = req.query.start_date;

            if (req.query.end_date)
              params.date['$lte'] = req.query.end_date;
          }

          return client.collection('grafworkouts').find(params, {_id: 0})
          .count();
        })
        .then((count) => reply({data: count}))
        .catch(reply);
      },
      auth: 'simple',
      validate: {
        query: {
          start_date: Joi.date().optional(),
          end_date: Joi.date().optional()
        }
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/workouts',
    config: {
      cors: true,
      handler: (req, reply) => {
        let grafworkouts;
        const connection = dbConnect(options.credentials.db);

        return connection
        .then((client) => {
          grafworkouts = client.collection('grafworkouts');

          return grafworkouts.find({
            username: req.auth.credentials.username
          })
          .sort({date: -1})
          .limit(1)
          .toArray();
        })
        .then((workouts) => {
          if (workouts.length === 0) return;

          return grafworkouts.remove({_id: workouts[0]._id})
        })
        .then(() => connection)
        .then((client) => {
          const params = { username: req.auth.credentials.username };

          if (req.query.start_date || req.query.end_date) {
            params.date = {};

            if (req.query.start_date)
              params.date['$gte'] = req.query.start_date;

            if (req.query.end_date)
              params.date['$lte'] = req.query.end_date;
          }

          return client.collection('grafworkouts').find(params, {_id: 0})
          .count();
        })
        .then((count) => reply({data: count}))

        .catch(reply);
      },
      auth: 'simple',
      validate: {
        query: {
          start_date: Joi.date().optional(),
          end_date: Joi.date().optional()
        }
      }
    }
  });

  next();
};

exports.register.attributes = {
  name: 'graf-workouts',
  version: require('../../../package').version
};
