(function () {
  'use strict';

  var logger = require('../../logger');
  var five = require('johnny-five');
  var board = new five.Board();

  board.on('ready', function () {
    logger.debug('Ready event. Repl instance auto-initialized!');

    var led = new five.Led(13);

    this.repl.inject({
      // Allow limited on/off control access to the
      // Led instance from the REPL.
      on: function () {
        led.on();
      },
      off: function () {
        led.off();
      }
    });
  });
})();
