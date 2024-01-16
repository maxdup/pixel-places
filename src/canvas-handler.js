import { canvasSize } from './constants';

function CanvasHandler(canvas){

  this.canvas = canvas;
  const ctx = canvas.getContext('2d');

  const canvasPosition = {left: null, top: null};

  this.setColor = (newColor) => {
    ctx.fillStyle = newColor;
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

  // Draw pixel
  let drawPixel = (globalX, globalY) => {

    let localX = globalX - canvasPosition.left;
    let localY = globalY - canvasPosition.top;

    // Validate coords are inside the canvas
    if (localX < canvasSize.width &&
        localY < canvasSize.height){
      ctx.fillRect(localX, localY, 1, 1);
    }
  }

  // mousedown event
  let mouseDownHandler = (event) => {
    if (event.target !== this.canvas){ return }

    mouseDown = true;
    drawPixel(event.x, event.y);
  }

  // mouseup event
  let mouseUpHandler = (event) => {

    mouseDown = false;
    drawPixel(event.x, event.y);
  }

  // mousemove event
  let mouseMoveHandler = (event) => {
    if (!mouseDown) { return }

    drawPixel(event.x, event.y);
  }

  this.canvas.addEventListener('mousedown', mouseDownHandler);
  this.canvas.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);

}

export { CanvasHandler };
