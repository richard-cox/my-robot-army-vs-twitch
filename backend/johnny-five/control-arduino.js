(function () {
  'use strict';

  var Q = require('q');
  var logger = require('../logger');

  var led = require('./action-library/led');
  var meArm = require('./action-library/me-arm');

  var initialised = false;

  function init(shutdownHook) {
    var five = require('johnny-five');

    var boardReadyPromise = Q.defer();

    var board = new five.Board();
    board.on('ready', function () {

      board.on('message', function (event) {
        logger.debug('Board Message: %s : %s', event.type, event.message);
      });

      boardReadyPromise.resolve();
    });

    // Close via ctrl-c with board repl will high jack the SIGTERM shutdown, ensure we shutdown properly
    board.on('exit', function () {
      shutdownHook();
    });

    return Q.all([led.init(five, board), meArm.init(five, board), boardReadyPromise]).then(function () {
      initialised = true;
    });

  }

  function handleCommand(command) {
    return initialised ? meArm.handleCommand(command) : Q.reject('Arduino controller has not been initialised');
  }

  exports.init = init;
  exports.isInitialized = function () {
    return initialised;
  };
  exports.handleCommand = handleCommand;

})();
