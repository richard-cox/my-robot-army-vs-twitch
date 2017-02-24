(function () {
  'use strict';

  exports.init = init;

  var express = require('express');
  var bodyParser = require('body-parser');
  var Q = require('q');
  var logger = require('../logger');

  var twitch = require('../twitch');

  function init(parentApp, ctrlArduino) {
    var apiApp = express();

    apiApp.disable('etag');

    // Disable caching of API responses
    apiApp.use(function (req, res, next) {
      res.set({
        'Cache-control': 'no-cache',
        Pragma: 'no-cache',
        Expires: 0
      });
      next();
    });

    var apiRouter = express.Router();
    apiRouter.use(bodyParser.json());

    apiRouter.post('/command', function (request, response) {
      var commandStr = request.body.command;

      logger.debug('API: Received command: ', commandStr);

      var command = twitch.parseTwitchMsg(commandStr);
      if (!command) {
        response.status(400).send('Not a valid army command');
        return;
      }

      ctrlArduino.handleCommand(command)
        .then(function () {
          response.status(200).send('Command successfully executed');
        })
        .catch(function (error) {
          response.status(503).send('Command failed: ' + JSON.stringify(error));
        });
    });

    apiRouter.get('/oauth', function () {
      // TODO: V3 It would be good to automate the oauth process, side-stepping the manually task to copy + paste the
      // token to config. This would mean restarting the twitch client. Also would then be restricted to localhost..
      // no https in place.
    });

    apiApp.use(apiRouter);
    parentApp.use('/api', apiApp);

    return Q.resolve();

  }

})();
