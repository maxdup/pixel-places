import React, { useEffect, useRef, useState } from 'react';
import { canvasSize } from './constants';

import { CanvasEventHandler } from './canvas-event-handler';
import { CanvasRenderApi } from './canvas-render-api';
import './App.css';


function randomColor() {
  return `#${[0, 0, 0]
    .map(() => Math.floor(Math.random() * 256).toString(16))
    .join('')}`;
}
function randomName(){
  return 'User ' + Math.floor(Math.random() * (100 - 1) + 1);
}

let websocket;
function getWebSocket() {
  return (websocket =
    websocket || new WebSocket(`ws://${window.location.hostname}:4040`));
}

function App() {
  /**
   * @type {React.RefObject<HTMLCanvasElement>}
   * */
  const canvasRef = useRef(null);
  const websocketRef = useRef(getWebSocket());
  const ws = websocketRef.current;

  let canvasEventHandler = useRef(null);
  let canvasRenderApi = useRef(null);

  const [color, _setColor] = useState(() => {
    let color = localStorage.getItem("color") || randomColor();
    localStorage.setItem("color", color);
    return color;
  });
  const setColor = (color) => {
    canvasEventHandler.current.setUserColor(color);
    localStorage.setItem("color", color);
    _setColor(color);

    ws.send(JSON.stringify({
      messageType: 'userUpdate',
      data: {
        color: color,
      },
    }));
  }

  const [name] = useState(() => {
    let name = localStorage.getItem("name") || randomName();
    localStorage.setItem("name", name);
    return name;
  });

  const [users, setUsers] = useState(() =>  []);

  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return; // should never happen

    if (!canvasRenderApi.current){
      canvasRenderApi.current = new CanvasRenderApi(canvas);

      canvasEventHandler.current = new CanvasEventHandler(canvasRenderApi.current, ws);
      canvasEventHandler.current.setUserColor(color);

      ws.onmessage = (e) => {
        const message = JSON.parse(e.data);

        switch (message.messageType) {
        case 'canvasFrameSignal':
          canvasRenderApi.current.exec('drawFrame', message.data.frame);
          break;
        case 'canvasKeyframeSignal':
        case 'canvasKeyframeResponse':
          canvasRenderApi.current.exec('drawKeyframe', message.data.keyframe);
          break;
        case 'userConnectResponse':
          localStorage.setItem('uid', message.data.uid);
          break;
        case 'usersUpdateSignal':
          setUsers(message.data.users.filter((u) => u.name !== name));
          break;
        case 'errorResponse':
          console.error(message);
          break;
        default:
          console.error('Unrecognized message format from server', message);
        }
      };

      let sendUserConnect = () => {
        ws.send(
          JSON.stringify({
            messageType: 'userConnect',
            data: {
              uid: localStorage.getItem("uid"),
              name: name,
              color: color,
            },
          })
        );
      }

      if (ws.readyState === WebSocket.OPEN){
        sendUserConnect();
      } else {
        ws.onopen = sendUserConnect;
      }
    }

  }, [color, name, setUsers, ws]);



  return (
    <div className="app">
      <header>
        <h1>Pixel paint</h1>
        <div className="color_selection">
          Your color:{' '}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
      </header>
      <main className="main_content">
        <div className="canvas_container">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </div>
        <div>
          <h3 className="connected_users_title">Connected users</h3>
          <ConnectedUser key='you' color={color} name={name + ' (You)'}/>
          {users.map(user => (
            <ConnectedUser key={user.uid} color={user.color} name={user.name} />
          ))}
        </div>
      </main>
    </div>
  );
}

function ConnectedUser({ color, name }) {
  return (
    <div className="connected_user">
      <div className="user_color" style={{ '--user-color': color }} />
      <div>{name}</div>
    </div>
  );
}

export default App;
