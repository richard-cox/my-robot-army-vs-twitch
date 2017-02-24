(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('twitchOauth', twithOauth);

  twithOauth.$inject = [];

  function twithOauth() {
    return {
      controller: TwitchOauthController,
      controllerAs: 'twitchOauthCtrl',
      templateUrl: 'app/view/twitch-oauth/twitch-oauth.html'
    };
  }

  TwitchOauthController.$inject = [
    '$location',
    '$window'
  ];

  function TwitchOauthController($location, $window) {
    var that = this;

    that.status = '';
    that.scope = 'chat_login';
    // Default value of my own client id
    that.clientId = 'z4lrfveexs6xkai321t3ue60bg2vlj';
    // Something odd going on with $location.search, possibly something to do with redirect
    var regEx = /((\w*)=([^&]*))/g;
    var match = regEx.exec($location.absUrl());
    while (match !== null) {
      that.tokenResult = that.tokenResult || {};
      _.set(that.tokenResult, match[2], decodeURIComponent(match[3].replace(/\+/g, '%20')));
      match = regEx.exec($location.absUrl());
    }

    // Both the twitch oauth client and request have to contain the same url, including the port number. This means for
    // when using browser sync on 4101 we get redirected back to 4000. Bit of a pain, but no quick work around
    var redirectUrl = 'http://localhost:4100';

    that.fetch = function () {

      var url = 'https://api.twitch.tv/kraken/oauth2/authorize?response_type=token' +
        '&client_id=' + that.clientId +
        '&redirect_uri=' + redirectUrl +
        '&scope=' + that.scope;
      $window.location.replace(url);

      // +'&state=' + state;
    };
  }
})();
