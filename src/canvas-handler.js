import { canvasSize } from './constants';

function CanvasHandler(canvas, ws){

  this.canvas = canvas;
  const ctx = canvas.getContext('2d');

  const canvasPosition = {left: null, top: null};

  let userColor = null;

  this.setUserColor = (color) => {
    userColor = color;
  }

  // Draw a single pixel
  this.drawPixel = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  // Draw a partial frame update
  this.drawFrame = (frame) => {
    Object.keys(frame).forEach((color)=>{
      ctx.fillStyle = color;
      for (let i = 0; i < frame[color].length/2; i++){
        ctx.fillRect(frame[color][i*2], frame[color][i*2+1], 1, 1);
      }
    });
  }

  // Draw a complete keyframe
  this.drawKeyframe = (keyframe) => {
    for (let x = 0; x < keyframe.length; x++){
      for (let y = 0; y < keyframe[x].length; y++){
        this.drawPixel(x, y, keyframe[x][y]);
      }
    }
  }

  let initialize = () => {
    // Establish the local coordinate system,
    // The current CSS results in decimal values
    // so I'm rounding down to deal in integers
    let rect = canvas.getBoundingClientRect();
    canvasPosition.left = Math.round(rect.left);
    canvasPosition.top = Math.round(rect.top);
  }
  initialize();

  let mouseDown = false;

  let userInputPixel = (globalX, globalY) => {

    let localX = globalX - canvasPosition.left;
    let localY = globalY - canvasPosition.top;

    // Validate coords are inside the canvas
    if (localX < canvasSize.width &&
        localY < canvasSize.height){

      this.drawPixel(localX, localY, userColor);

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
    if (event.target !== this.canvas){ return }

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

  this.canvas.addEventListener('mousedown', mouseDownHandler);
  this.canvas.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);

}

export { CanvasHandler };
