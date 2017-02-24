(function () {
  'use strict';

  var Q = require('q');
  var logger = require('../../logger');

  var actions = {};

  exports.init = init;
  exports.actions = actions;

  function init(five, board) {
    var deferred = Q.defer();
    board.on('ready', function () {
      logger.debug('Adding LED func to repl');

      var led = new five.Led(13);
      actions = {
        on: function () {
          // Swallow output
          led.on();
        },
        off: function () {
          // Swallow output
          led.off();
        }
      };

      this.repl.inject({
        led: actions
      });

      deferred.resolve();
    });
    return deferred.promise;
  }

})();
