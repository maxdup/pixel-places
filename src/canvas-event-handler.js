import { canvasSize } from './constants';

function CanvasEventHandler(canvasRenderApi, ws){

  // Class tasked with capturing and validating canvas events

  let mouseDown = false;
  let userColor = null;

  this.setUserColor = (color) => {
    userColor = color;
  }

  let userInputPixel = (globalX, globalY) => {
    let rect = canvasRenderApi.canvas.getBoundingClientRect();
    let localX = globalX - Math.round(rect.left);
    let localY = globalY - Math.round(rect.top);

    // Validate coords are inside the canvas
    if ( localX > 0 &&
         localY > 0 &&
         localX < canvasSize.width &&
         localY < canvasSize.height){

      canvasRenderApi.exec('drawPixel', {
        x: localX,
        y: localY,
        color: userColor
      });

      ws.send(JSON.stringify({
        messageType: 'pixelUpdate',
        data: {
          x: localX,
          y: localY,
        }
      }));
    }
  }

  // mousedown event
  let mouseDownHandler = (event) => {
    if (event.target !== canvasRenderApi.canvas){ return }

    mouseDown = true;
    userInputPixel(event.x, event.y);
  }

  // mouseup event
  let mouseUpHandler = (event) => {

    mouseDown = false;
    userInputPixel(event.x, event.y);
  }

  // mousemove event
  let mouseMoveHandler = (event) => {
    if (!mouseDown) { return }

    userInputPixel(event.x, event.y);
  }

  canvasRenderApi.canvas.addEventListener('mousedown', mouseDownHandler);
  canvasRenderApi.canvas.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
}

export { CanvasEventHandler };
