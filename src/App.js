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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // should never happen

    if (!canvasHandler){
      canvasHandler.current = new CanvasHandler(canvas);
    }

    ws.onopen = () => {
      // send a message as soon as the websocket connection is established
      ws.send(
        JSON.stringify({
          messageType: 'hey',
          data: 'Hello peers!',
        })
      );
    };

    ws.onmessage = (e) => {
      const message = JSON.parse(e.data);
      switch (message.messageType) {
        case 'hello':
          console.log('WebSocket says hello');
          break;
        case 'hey':
          console.log('Message from another client:', message.data);
          break;
        case 'error':
          console.error(message);
          break;
        default:
          console.error('Unrecognized message format from server');
      }
    };
  }, []);

  const [color, setColor] = useState(() => randomColor());

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
          <ConnectedUser color="red" name="Example user 1" />
          <ConnectedUser color="blue" name="Example user 2" />
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
