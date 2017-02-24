(function () {
  'use strict';

  var Q = require('q');
  var logger = require('../../logger');
  var _ = require('lodash');

  var middleServo, leftServo, rightServo, clawServo;

  var lastCommandTimestamp = 0;
  var animationMs = 500;
  var throttleMs = 5000;

  var meArmLogPrefix = 'MeArm: ';

  var helpCommandsText = "'arm command left|right <degree>' - moves base left or right. " +
    "'arm command up|down <degree>' - moves arm roughly up or down. " +
    "'arm command forward|backward <degree>' - moves arm roughly forward or backwards. " +
    'The claw cannot be moved from within twitch';

  var middleServoOptions = {
    pin: 11,
    startAt: 100,
    range: [30, 170],
    label: 'Left/Right Servo'
  };
  var leftServoOptions = {
    pin: 10,
    invert: true,
    startAt: 95,
    range: [70, 140],
    label: 'Up/Down Servo'
  };
  var rightServoOptions = {
    pin: 9,
    startAt: 130,
    range: [100, 140],
    label: 'Forward/Backward Servo'
  };
  var clawServoOptions = {
    pin: 6,
    startAt: 35,
    range: [35, 170],
    label: 'Claw Servo'
  };
  var servoOptions = [middleServoOptions, leftServoOptions, rightServoOptions, clawServoOptions];

  function _log(func, message) {
    func(meArmLogPrefix + message);
  }

  function _servoPosition(servo) {
    var servoConfig = _.find(servoOptions, {pin: servo.pin}) || {label: 'Unknown'};
    return servoConfig.label + ' - ' + servoState(servo);
  }

  function _logPosition(servo, additional) {
    _log(logger.debug, _servoPosition(servo) + '. ' + (additional || ''));
  }

  function servoState(servo) {
    return 'Pos: ' + servo.position + '. Range: ' + JSON.stringify(servo.range);
  }

  function _step(servo, degree) {
    if (!servo) {
      return Q.reject('No servo supplied or servo is null');
    }

    servo.stop();

    var invalidPosError = false;

    _logPosition(servo, 'Deg Change: ' + degree);
    var newVal = servo.position + degree;
    if (servo.range[0] > newVal || newVal > servo.range[1]) {
      _log(logger.warn, 'Invalid Position. Currently \'' + servo.position + '\'. Rejected \'' + newVal + '\'');
      invalidPosError = {
        meArmStepInvalid: {
          servoState: servoState(servo),
          invalidStep: newVal
        }
      };
    }

    function move(newVal) {
      _log(logger.info, 'Moving to degree: ' + newVal);
      servo.to(newVal, animationMs);

      // TODO: V2 handle error case... maybe have a timer here? What could cause the move event to not complete?
      var movePromise = Q.defer();

      servo.once('move:complete', function () {
        _log(logger.debug, 'Move Finished');
        _logPosition(servo);
        movePromise.resolve({
          servo: servo,
          meArmStepSuccess: {
            servoState: servoState(servo),
            validStep: newVal
          }
        });
        movePromise = null;
      });

      return movePromise.promise;
    }

    return invalidPosError ? Q.reject(invalidPosError) : move(newVal);
  }

  function _throttledStep(servo, degree) {
    var now = new Date().getTime();
    if (lastCommandTimestamp + throttleMs <= new Date().getTime()) {
      lastCommandTimestamp = now;
      return _step(servo, degree);
    }
    return Q.reject({meArmStepThrottled: true});
  }

  function init(five, board) {
    var deferred = Q.defer();

    board.on('ready', function () {
      _log(logger.debug, 'Adding MeArm func to repl');

      middleServo = new five.Servo(middleServoOptions);
      leftServo = new five.Servo(leftServoOptions);
      rightServo = new five.Servo(rightServoOptions);
      clawServo = new five.Servo(clawServoOptions);

      board.repl.inject({
        arm: {
          middle: middleServo,
          left: leftServo,
          right: rightServo,
          claw: clawServo,
          calibrate: function () {
            middleServo.to(middleServoOptions.startAt);
            leftServo.to(leftServoOptions.startAt);
            rightServo.to(rightServoOptions.startAt);
            clawServo.to(clawServoOptions.startAt);
          },
          positions: function () {
            _logPosition(middleServo);
            _logPosition(leftServo);
            _logPosition(rightServo);
            _logPosition(clawServo);
          },
          customStep: {
            middle: function (degree) {
              _step(middleServo, degree);
            },
            left: function (degree) {
              _step(leftServo, degree);
            },
            right: function (degree) {
              _step(rightServo, degree);
            },
            claw: function (degree) {
              _step(clawServo, degree);
            }
          }
        }
      });

      deferred.resolve();
    });

    return deferred.promise;
  }

  function handleCommand(command) {
    if (command.type === 'armCommand') {
      switch (command.direction) {
        case 'left':
          return _throttledStep(middleServo, command.degrees * -1);
        case 'right':
          return _throttledStep(middleServo, command.degrees);
        case 'up':
          return _throttledStep(leftServo, command.degrees);
        case 'down':
          return _throttledStep(leftServo, command.degrees * -1);
        case 'forward':
          return _throttledStep(rightServo, command.degrees);
        case 'backward':
          return _throttledStep(rightServo, command.degrees * -1);
        default:
          return Q.reject('Unrecognised direction: ', command.direction);
      }
    } else if (command.type === 'armHelpPos') {
      return Q.resolve({
        message: _servoPosition(middleServo) + '. ' + _servoPosition(leftServo) + '. ' + _servoPosition(rightServo) +
        '. ' + _servoPosition(clawServo)
      });
    } else if (command.type === 'armHelpCommand') {
      return Q.resolve({
        message: helpCommandsText
      });
    } else {
      return Q.reject('Unrecognised type: ', command.type);
    }
  }

  exports.init = init;
  exports.handleCommand = handleCommand;
})();
