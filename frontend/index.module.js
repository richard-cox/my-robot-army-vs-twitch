(function () {
  'use strict';

  var angularModules = [];

  var otherModules = [
    'ui.router',
    'ui.bootstrap',
    'ngSanitize'
  ];

  angular
    .module('my-robot-arm', angularModules.concat(otherModules, ['app']), config);

  config.$inject = [
    '$compileProvider',
    '$logProvider'
  ];

  function config($compileProvider, $logProvider) {

    /**
     * Disabling Debug Data
     *
     * To manually enable debug data, open up a debug console in the browser
     * then call this method directly in this console:
     *
     * ```
     * angular.reloadWithDebugInfo();
     * ```
     *
     * https://docs.angularjs.org/guide/production
     */
    $compileProvider.debugInfoEnabled(false);

    $logProvider.debugEnabled(false);
  }

})();
