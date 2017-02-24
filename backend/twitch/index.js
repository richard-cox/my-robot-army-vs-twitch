(function () {
  'use strict';

  var _ = require('lodash');
  var tmi = require('tmi.js');
  var logger = require('../logger');
  var Q = require('q');
  var config = require('../config');

  var client, channel, chatPrefix, tmiClientConfig;

  var helpText = "Robot can be controlled via chat messages. Type 'army help commands' for a full list'. Please note " +
    'only one command is accepted every 5 seconds';
  var welcomeText = "Robot army is listening! Enter 'army help' for instructions";
  var goodbyeText = 'Robot army has left the building';

  var instructionRegEx = /army (command|help) ?(positions|commands|left|right|up|down|forward|backward)? ?([0-9]{1,3})?/gi;

  function parseTwitchMsg(message) {
    //TODO: V2 This whole command process needs improving
    if (!message || !_.isString(message) || message.length === 0 || message.indexOf('army') !== 0) {
      return;
    }
    instructionRegEx.lastIndex = 0;
    var instruction = instructionRegEx.exec(message);

    var command = null;
    if (instruction) {
      switch (instruction[1]) {
        case 'command':
          command = instruction[3] ? {
            type: 'armCommand',
            direction: instruction[2],
            degrees: parseInt(instruction[3], 10)
          } : {
            type: 'armHelp'
          };
          break;
        case 'help':
          var type = 'armHelp';
          switch (instruction[2]) {
            case 'commands':
              type = 'armHelpCommand';
              break;
            case 'positions':
              type = 'armHelpPos';
              break;
          }
          command = {type: type};
          break;
      }
    }
    return command;
  }

  function _wrapJSPromise(jsPromise) {
    // tmi.js uses js promises, we need Q promises
    return Q.when(jsPromise);
  }

  function isConnected() {
    return client && client.readyState() === 'OPEN';
  }

  function say(message) {
    if (isConnected()) {
      return _wrapJSPromise(client.say(channel, chatPrefix + message));
    }
    // Does it do this anyway?
    return Q.reject('Client is not connected');
  }

  // function whisper(username, message) {
  //   return _wrapJSPromise(client.whisper(username, message));
  // }

  function disconnect() {
    return say(goodbyeText).then(function () {
      return _wrapJSPromise(client.disconnect());
    });
  }

  function whisperOrSay(userTo, message) {
    // Cannot whisper self, so for testing purposes just say it
    // TODO: V2 There's some kind of bug in tmi.js, it looks like it's sending the correct generic command (not IRC)
    // yet still the whisper does not reach the user.
    // var userFrom = config.get('twitch.identity.username', '');
    // return userFrom === userTo ? say(userTo + ' ' + message) : whisper(userTo, message);
    return say(userTo + ' - ' + message);
  }

  function _handleChat(handleArmCommand, msgChannel, user, message, self) {
    if (self || channel !== msgChannel) {
      // Ignore messages that the app itself has posted or messages from other channels
      return;
    }

    if (!handleArmCommand) {
      logger.error('No handle command, no point in continuing');
      return;
    }

    var command = parseTwitchMsg(message);
    if (!command) {
      // User has passed in some old junk.
      // TODO: V3 improve feed back for users who pass in not quite junk
      return;
    }
    if (command.type === 'armHelp') {
      whisperOrSay(user['display-name'], helpText).catch(function (error) {
      // say(user.username + ' ' + helpText).catch(function (error) {
        logger.error('Failed to send helpText whisper to ' + user.username, error);
      });
    } else {
      handleArmCommand(command)
        .then(function (result) {
          if (command.type === 'armCommand') {
            var userMessage = user['display-name'] + '\'s \'' + message + '\' was obeyed! New State - ' +
              result.meArmStepSuccess.servoState;
            logger.info(userMessage);
            say(userMessage);
          } else if (command.type === 'armHelpPos' || command.type === 'armHelpCommand') {
            whisperOrSay(user['display-name'], result.message).catch(function (error) {
              logger.error('Failed to send armHelpPos|armHelpCommand whisper to ' + user.username, error);
            });
          }
        })
        .catch(function (error) {
          if (command.type.indexOf('armHelp') === 0) {
            logger.error('Unable to process information request from twitch', error);
          } else {
            var userMessage = '';
            if (error.meArmStepThrottled) {
              logger.debug('Throttled request', error);
            } else if (error.meArmStepInvalid) {
              userMessage = user['display-name'] + '\'s ' + message + ' was not obeyed. Invalid Position: ' +
                error.meArmStepInvalid.invalidStep + '. Current State - ' + error.meArmStepInvalid.servoState;
              say(userMessage);
              logger.error(userMessage, error);
            }
          }
        });
    }
  }

  function connect(handleArmCommand) {
    var existingClientPromise = Q.resolve();
    if (client) {
      if (isConnected()) {
        return Q.resolve();
      } else {
        existingClientPromise = disconnect().catch(function (error) {
          // Swallow error. We're probably in a broken state but the newly created client will handle
          logger.error('Failed to reconnect to client', error);
        });
      }
    }

    return existingClientPromise.then(function () {

      tmiClientConfig = config.get('tmiClient');
      if (!tmiClientConfig) {
        return Q.reject('Missing tmi options in config');
      }

      var identity = config.get('twitch.identity', {});
      if (identity) {
        if (!identity.username || !identity.password) {
          return Q.reject('Missing twitch identity username or password config');
        }

        tmiClientConfig.identity = identity;
      }

      channel = config.get('twitch.channel');
      if (channel) {
        tmiClientConfig.channels = [channel];
      } else {
        return Q.reject('Missing twitch channel config');
      }

      chatPrefix = config.get('twitch.chatPrefix', '');

      client = new tmi.client(tmiClientConfig);

      client.on('chat', _.partial(_handleChat, handleArmCommand));
      client.on('connected', function () {
        say(welcomeText);
      });

      // Connect the client to the server..
      return _wrapJSPromise(client.connect())
        .then(function () {
          logger.info('Twitch: Connected. State: ', client.readyState());
        })
        .catch(function (error) {
          logger.error('Twitch: Failed to connect to twitch: ', error);
          return Q.reject(error);
        });
    });

  }

  exports.connect = connect;
  exports.disconnect = disconnect;
  exports.isConnected = isConnected;
  exports.say = say;
  exports.parseTwitchMsg = parseTwitchMsg;
})();
