(function () {
  'use strict';

  var winston = require('winston');

  var defaultConfig = {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: true
  };

  module.exports = new winston.Logger({
    transports: [
      new winston.transports.Console(defaultConfig)
    ]
  });
})();
