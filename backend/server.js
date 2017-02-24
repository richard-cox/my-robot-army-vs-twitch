(function () {
  'use strict';

  var express = require('express');
  var app = express();
  var Q = require('q');
  var http = require('http');
  var path = require('path');
  var api = require('./service/api');
  var logger = require('./logger');
  var config = require('./config');

  var ctrlArduino = require('./johnny-five/control-arduino');
  var twitch = require('./twitch');

  var appFolder = path.resolve('./frontend');
  var configFile = path.join(__dirname, './dev-config.json');

  app.use(express.static(appFolder));

  var server = http.createServer(app);

  var port, shuttingDown;

  Q.resolve()
    .then(function () {
      return config.load(configFile);
    })
    .then(function () {
      port = config.get('port', 4100);
      // Connect to the arm
      // init will throw an exception if the board is busy, include in promise chain to catch nicely
      return config.get('disableArduino') ? true : ctrlArduino.init(shutdownHook);
    })
    .then(function () {
      // Connect to twitch chat
      return config.get('disableTwitch') ? true : twitch.connect(function handleArmCommand(command) {
        if (!config.get('disableArduino')) {
          return ctrlArduino.handleCommand(command);
        } else {
          logger.debug('Ignoring command, arduino disabled');
          return Q.resolve();
        }
      });
    })
    .then(function () {
      // Set up the api
      return api.init(app, ctrlArduino);
    })
    .then(function () {
      // Listen
      server.listen(port, function () {
        logger.info('Serving api + frontend (%s) on %s', appFolder, port);
      });
    })
    .catch(function (error) {
      logger.error('Failed to initialise app:', error);
      /* eslint-disable no-process-exit */
      process.exit(1);
      /* eslint-enable no-process-exit */
    });

  function shutdownHook() {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    if (!config.get('disableTwitch')) {
      twitch.disconnect().finally(function () {
        return process.exit(0);
      });
    } else {
      return process.exit(0);
    }
  }

  process.on('exit', shutdownHook);

  // Ctr-C - ish
  process.on('SIGINT', shutdownHook);

  process.on('SIGTERM', shutdownHook);

})();
