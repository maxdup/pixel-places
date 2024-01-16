import React, { useEffect, useRef, useState } from 'react';
import { canvasSize } from './constants';
import { CanvasHandler } from './canvas-handler';
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

  let canvasHandler = useRef(null);

  const [color, _setColor] = useState(() => {
    let color = localStorage.getItem("color");
    if (!color){
      color = randomColor();
      localStorage.setItem("color", color);
    }
    return color;
  });
  const setColor = (color) => {
    canvasHandler.current.setColor(color);
    localStorage.setItem("color", color);
    _setColor(color);

    ws.send(JSON.stringify({
      messageType: 'userUpdate',
      data: {
        color: color,
      },
    }));
  }

  const [name, _setName] = useState(() => {
    let name = localStorage.getItem("name");
    if (!name){
      name = randomName();
      localStorage.setItem("name", name);
    }
    return name;
  });

  const [users, _setUsers] = useState(() =>  []);
  const setUsers = (users) => {
    let filteredUsers = users.filter((u) => u.name != name);
    _setUsers(filteredUsers);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // should never happen

    if (!canvasHandler.current){
      canvasHandler.current = new CanvasHandler(canvas);
      canvasHandler.current.setColor(color);

      ws.onopen = () => {
        // send a message as soon as the websocket connection is established
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
      };
    }

    ws.onmessage = (e) => {
      const message = JSON.parse(e.data);
      switch (message.messageType) {
      case 'userConnectResponse':
        localStorage.setItem('uid', message.data.uid);
        break;
      case 'usersUpdateSignal':
        setUsers(message.data.users);
        break;
      case 'errorResponse':
        console.error(message);
        break;
      default:
        console.error('Unrecognized message format from server', message);
      }
    };
    }, []);



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
