/* eslint-disable  no-sync */
(function () {
  'use strict';

  var fs = require('fs');
  var Q = require('q');
  var _ = require('lodash');

  function fileExists(filePath) {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  }

  var config = {};

  function load(configFilePath) {
    if (!fileExists(configFilePath)) {
      return Q.reject('Failed to load config file at path \'' + configFilePath + '\': (does not exist)');
    }
    try {
      var stConfig = fs.readFileSync(configFilePath).toString();
      config = JSON.parse(stConfig);
    } catch (error) {
      return Q.reject('Failed to load config file at path \'' + configFilePath + '\': ' + error);
    }
  }

  function get(propertyPath, missing) {
    return _.get(config, propertyPath, missing);
  }

  exports.load = load;
  exports.get = get;
})();
