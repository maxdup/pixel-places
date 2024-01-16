const express = require('express');
const path = require('path');
const app = express();

const canvasSize = {
  // Note: Couldn't import from src/constants, not too worried about it
  width: 300,
  height: 200
};

const { WebSocketServer } = require('ws');

app.use(express.static(path.join(__dirname, 'build')));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);

const wsServer = new WebSocketServer({ port: 4040 });

const colorRegex = new RegExp("/^#?([a-f0-9]{6}|[a-f0-9]{3})$/");
colorRegex.compile();


const snapshot = new Array(canvasSize.height).fill('#FFFFFF').map(() =>
  new Array(canvasSize.width).fill('#FFFFFF'));
let activeUsers = [];


wsServer.on('connection', (ws) => {

  console.log('WS client connected.');

  let currentUser = null;

  let respondFailure = (message) => {
    // Catch all error
    // Note: underdeveloped
    ws.send(
      JSON.stringify({
        messageType: 'errorResponse',
        data: 'Client sent an unrecognized message format',
        originalMessage: message,
      })
    );
  }

  let signalUsers = () => {
    for (const client of wsServer.clients) {
      client.send(
        JSON.stringify({
          messageType: 'usersUpdateSignal',
          data: {
            users: activeUsers
          },
        })
      );
    }
  }

  let userUpdateHandler = (message) => {
    // a user update is attempted, validate incoming data and
    // save user info
    // returns success status (boolean)

    if (!currentUser ||
        !message.data.color ||
        !colorRegex.test(message.data.color)){
      return false;
    }
    currentUser.color = message.data.color;
    return true;
  }

  let userConnectHandler = (message) => {
    // a user connection is attempted, validate incoming data and
    // save user info
    // returns success status (boolean)

    if (!message.data.name || // Note: I would normally sanitize name
        !message.data.color ||
        !colorRegex.test(message.data.color)){
      return false;
    }

    let user = activeUsers.find((u) => u.uid == message.data.uid );
    if (user){
      user.name = message.data.name;
      user.color = message.data.color;
    } else {
      user = {
        name: message.data.name,
        color: message.data.color,
        uid: message.data.uid || Date.now(), // Note: I would normally use a better UID solution
      }
      activeUsers.push(user);
    }
    currentUser = user;

    ws.send(
      JSON.stringify({
        messageType: 'userConnectResponse',
        data: currentUser
      })
    );

    return true;
  }

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());

    console.log('received message', message);

    if (!message.messageType){ return }

    switch(message.messageType){

    case 'userUpdate':
      userUpdateHandler(message) ? signalUsers() : respondFailure(message);
      break;

    case 'userConnect':
      userConnectHandler(message) ? signalUsers() : respondFailure(message);
      break;

    default:
      respondFailure(message);
    }
  });

  ws.on('close', () => {
    if (currentUser) {
      const index = activeUsers.indexOf(currentUser);
      if (index > -1){
        activeUsers.splice(index, 1);
        signalUsers();
      }
    }
    console.log('WS client disconnected.');
  });

  ws.onerror = console.error;
});
