
const WORKER_MSGS = {
  drawKeyframe: 0,
  drawFrame: 1,
  drawPixel: 2,
}


function CanvasWorker(){

  // Worker class to handle canvas drawing operations

  this.init = (canvas) => {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // Draw a single pixel
  let drawPixel = (x, y, color) => {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 1, 1);
  }

  // Draw a partial frame update
  let drawFrame = (frame) => {
    Object.keys(frame).forEach((color)=>{
      this.ctx.fillStyle = color;
      for (let i = 0; i < frame[color].length/2; i++){
        this.ctx.fillRect(frame[color][i*2], frame[color][i*2+1], 1, 1);
      }
    });
  }

  // Draw a complete keyframe
  let drawKeyframe = (keyframe) => {
    for (let x = 0; x < keyframe.length; x++){
      for (let y = 0; y < keyframe[x].length; y++){
        drawPixel(x, y, keyframe[x][y]);
      }
    }
  }
  this.run = (eventName, value) => {
    switch(WORKER_MSGS[eventName]){
    case WORKER_MSGS['drawKeyframe']:
      drawKeyframe(value);
      break;
    case WORKER_MSGS['drawFrame']:
      drawFrame(value);
      break;
    case WORKER_MSGS['drawPixel']:
      drawPixel(value);
      break;
    default:
      break;
    }
  }

}

let canvasWorker = new CanvasWorker();

export default canvasWorker;
