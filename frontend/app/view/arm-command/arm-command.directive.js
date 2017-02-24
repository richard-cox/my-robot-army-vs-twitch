(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('armCommand', armCommand);

  armCommand.$inject = [];

  function armCommand() {
    return {
      controller: ArmCommandController,
      controllerAs: 'armCommandCtrl',
      templateUrl: 'app/view/arm-command/arm-command.html'
    };
  }

  ArmCommandController.$inject = [
    '$http'
  ];

  function ArmCommandController($http) {
    var that = this;

    that.submit = function () {
      that.error = null;
      that.status = 'Sending ...';
      $http.post('http://localhost:4100/api/command', that.form)
        .then(function () {
          that.status = 'Success!';
        })
        .catch(function (error) {
          that.status = 'Failed';
          that.error = error.data || 'Status: ' + error.status;
        });
    };
  }
})();
