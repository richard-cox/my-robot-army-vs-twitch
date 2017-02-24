# my-robot-army-vs-twitch

## Introduction
This project was born out of the awesome [SUSE Hackweek](https://hackweek.suse.com/). 
The rough concept of [this project](https://hackweek.suse.com/15/projects/my-robot-army-vs-twitch/) is to challenge Twitch users 
to draw something interesting with a [Mime](https://mime.co.uk/) [MeArm Robot arm](https://shop.mime.co.uk/collections/frontpage/products/mearm-pocket-sized-robot-arm) 
using chat commands in a twitch feed.
 
This Node.js application is the link between Twitch and the MeArm. Chat comments are read and written via 
[tmi.js](https://github.com/tmijs/tmi.js). The MeArm is connected to a [Arduino Uno](https://www.arduino.cc/en/Main/arduinoBoardUno) 
and commands are pushed to the arm via [Johhny-Five](http://johnny-five.io/).
 
*Pssst - Check out Mime's latest kickstarter project - [MeArm Pi](https://www.kickstarter.com/projects/mime/mearm-pi-build-your-own-raspberry-pi-powered-robot).*
 
## Disclaimers
Some of the code has been rushed, please don't think this is product quality! Also some is a bit overkill, 
could have avoided the whole gulp process and frontend.

## Result
The integration between twitch chat and the arm works great. Users can issue commands to the arm via chat 
and it can wiggle about a bit. However there's a couple of problems which severely impact twitch users artistic output.

1. No full, straight point to point lines can be drawn, only arcs left to right - The three servos
which can be controlled via twitch are the middle (rotates base left/right), left (kind of moves the arm up 
and down) and right (kind of moves the arm backward and forward). Only one command can be executed at a time. 
The 'ish' above relate to the arm moving away from the paper at an angle to the base.. which can lead to the 
pen leaving the paper and the intended line falling short of it's expected destination. To work around this 
would need to do some interesting trigonometry calculations.

2. The pen ink can seep into the paper - The arm's claw manages to hold a marker pen ok but not a biro. When 
 using a marker pen the ink will seep into the paper when the arm is stationary. To work around this the pen
  would need to be more firmly fixed in place (gaffa tape ftw).
  
3. I was unable to unleash this to genuine twitch users due to proxy issues around third party desktop streaming 
apps for twitch. 

All in all though this has been a super fun project. Props go out to the folks and contributors to [Mime](https://mime.co.uk/), 
[Arduino](https://www.arduino.cc/), [Johhny-Five](http://johnny-five.io/) and [tmi.js](https://github.com/tmijs/tmi.js), who 
without which I would probably be stuck doing something much less fun.
 
## Getting Started

### Pre - Reqs

* Twitch account, Twitch Developer Application and Twitch OAuth token (this can be fetched later on with the app also). 
To create the application go [here](https://www.twitch.tv/settings/connections). Set the redirect URL to 
http://localhost:4100 and save the client id somewhere.

* An Arduino Uno

* A Mime MeArm Robot Arm. You can find instructions on setting up the arm to work with an arduino on the MeArm site. 
Pro Tips - Make sure you calibrate the servo's BEFORE you put anything together. Also that the power input is at 
least 2A. I started with 4 AA R6 batteries and struggled before switching to 4 AA LR6 (this might be a noob mistake of mine??) 

### Steps

1. Set up and connect the arm as per MeArm instructions

2. Copy the Configuration
   There's some basic configuration that needs setting up. Copy 
   ```
   <root>/backend/dev-config.json.example
   ```
   to
   ```
   <root>/backend/dev-config.json
   ```
   Update Twitch object

   identity:username - your twitch username

   identity:password - an oauth token containing the chat_login scope. This will authorise the app to fetch and send chat 
   messages to the channel supplied in the configuration. To get one go to http://twitchapps.com/tmi/

   channel: the channel you wish to broadcast the arm to
   
   chatPrefix: Every chat message coming from the app will start with this 

   Note - If you're not ready to run either the arm or twitch side use the 'disableTwitch' and 'disableTwitch' config
   settings

3. Run the App

   For development run (this will run the linter and enable browser sync)
   ```
   gulp
   ```
   from the project root. 

   For non-development run 
   ```
   gulp index
   node backend/server.js
   ```

## Using the app
Check out the log, ensure everything is fine. 
```
1487945227627 Device(s) /dev/ttyACM1  
1487945227639 Connected /dev/ttyACM1  
1487945230901 Repl Initialized  
>> 2017-02-24T14:07:10.923Z - debug: Adding LED func to repl
2017-02-24T14:07:10.929Z - debug: MeArm: Adding MeArm func to repl
[14:07] info: Connecting to irc-ws.chat.twitch.tv on port 443..
[14:07] info: Sending authentication to server..
[14:07] info: Connected to server.
[14:07] info: [#williambabbington] <williambabbington>: Army: Robot army is listening! Enter 'army help' for instructions
2017-02-24T14:07:12.085Z - info: Twitch: Connected. State:  OPEN
2017-02-24T14:07:12.106Z - info: Serving api + frontend (my-robot-army-vs-twitch/frontend) on 4100
```
Notice that the app will send a message to chat to say it's up and running. 

There's a small dev console site (http://localhost:4100, or if running with gulp and to use browser sync http://localhost:4101). 
There you can request an oauth token with additional scope properties. You can also send commands to the arm, bypassing twitch
but still going through the same message parsing process. 
 
Via the command line you can also access the core Johhny-Five servos and Arduino on board LED. Try out some of the following
```
led.on()
led.off()
arm.positions()
arm.calibrate()
arm.middle.min()
arm.middle.max()
arm.left.min()
arm.right.min()
arm.claw.min()
```

## TODO 
There's a number of v2/v3 items to continue with. 

* Automate oauth token process. Avoid c+p into dev_config.json

* Improve twitch help/command text (syntax, twitch conventions and parseing)

* Create a dist folder for frontend?

* SASS the front end up a bit

* Add jsdocs and improve comments

* The help text should be sent over whisper but atm is just a normal say. There's something odd going on with tmi.js + whisper

