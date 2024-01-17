const express = require('express');
const path = require('path');
const app = express();

const canvasSize = {
  // Note: Couldn't import from src/constants, not too worried about it
  width: 300,
  height: 200
};

const MAX_TICK_RATE = 24;

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


const snapshot = new Array(canvasSize.width).fill('#FFFFFF').map(() =>
  new Array(canvasSize.height).fill('#FFFFFF'));

let updatedPixels = {};

let activeUsers = [];

let signal = (messageType, data) => {
  // A signal notifies all users
  for (const client of wsServer.clients) {
    client.send(
      JSON.stringify({
        messageType: messageType,
        data: data,
      })
    );
  }
}


let signalUsers = () => {
  signal('usersUpdateSignal', { users: activeUsers });
}

let signalCanvasKeyframe = () => {
  signal('canvasKeyframeSignal', { keyframe: snapshot });
}

let signalCanvasFrame = () => {
  signal('canvasFrameSignal', { frame: updatedPixels });
}

let respond = (ws, messageType, data) => {
  // A response follows a specific incoming message
  ws.send(
    JSON.stringify({
      messageType: messageType,
      data: data
    })
  );
}

let respondCanvasKeyframe = (ws) => {
  respond(ws, 'canvasKeyframeResponse', {
    keyframe: snapshot,
  })
}

let respondUserInfo = (ws, currentUser) => {
  respond(ws, 'userConnectResponse', currentUser);
}

let respondFailure = (ws, message) => {
  // Catch all error
  // Note: underdeveloped
  respond(ws, 'errorResponse', {
    error: 'Client sent an unrecognized message format',
    originalMessage: message
  });
}


let userUpdateHandler = (message, sessionState) => {
  // a user update is attempted, validate incoming data and
  // save user info
  // returns success status (boolean)

  if (!sessionState.currentUser ||
      !message.data.color ||
      !colorRegex.test(message.data.color)){
    return false;
  }
  sessionState.currentUser.color = message.data.color;
  return true;
}


let userConnectHandler = (message, sessionState) => {
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
  sessionState.currentUser = user;

  return true;
}

let pixelUpdateHandler = (message, sessionState) => {
  // a pixel update is attempted, validate imcoming data and
  if (!sessionState.currentUser){
    return false
  }
  if (message.data.x < 0 || message.data.y < 0||
      message.data.x >= canvasSize.width ||
      message.data.y >= canvasSize.height){
    return false;
  }

  snapshot[message.data.x][message.data.y] = sessionState.currentUser.color;

  if (!updatedPixels[sessionState.currentUser.color]){
    updatedPixels[sessionState.currentUser.color] = [];
  }
  updatedPixels[sessionState.currentUser.color].push(message.data.x, message.data.y);

  return true;
}



wsServer.on('connection', (ws) => {

  console.log('WS client connected.');

  let sessionState = {
    currentUser: null,
  }

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());

    //console.log('received message', message);

    if (!message.messageType){ return }

    switch(message.messageType){

    case 'userUpdate':
      userUpdateHandler(message, sessionState) ?
        signalUsers() : respondFailure(ws, message);
      break;

    case 'userConnect':
      userConnectHandler(message, sessionState) ?
        (signalUsers(), respondUserInfo(ws, sessionState.currentUser), respondCanvasKeyframe(ws)) : respondFailure(ws, message);
      break;

    case 'pixelUpdate':
      pixelUpdateHandler(message, sessionState) || respondFailure(ws, message);
      break;

    default:
      respondFailure(ws, message);
    }
  });

  ws.on('close', () => {
    if (sessionState.currentUser) {
      const index = activeUsers.indexOf(sessionState.currentUser);
      if (index > -1){
        activeUsers.splice(index, 1);
        signalUsers();
      }
    }
    console.log('WS client disconnected.');
  });

  ws.onerror = console.error;
});

setInterval(() => {
  if (Object.keys(updatedPixels).length > 0){
    signalCanvasFrame();
    updatedPixels = {};
  }
}, 1000 / MAX_TICK_RATE);
