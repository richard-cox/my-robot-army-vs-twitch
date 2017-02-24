(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('application', application);

  application.$inject = [
  ];

  function application() {
    return {
      controller: ApplicationController,
      controllerAs: 'applicationCtrl',
      templateUrl: 'app/view/application.html'
    };
  }

  ApplicationController.$inject = [
  ];

  function ApplicationController() {

  }

})();
