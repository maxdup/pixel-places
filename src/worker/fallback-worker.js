function FallbackWorker(){

  // Simple fallback that mimics a web worker (except everything is synchronous)

  // (...it's ok Safari, we still love you)

  this.canvasWorker = require('./canvas-worker').default

  this.init = (canvas) =>{
    this.canvasWorker.init(canvas);
  }
  this.postMessage = (event) => {
    this.canvasWorker.run(event.msg, event.value);
  }
  this.exec = (eventName, value) => {
    this.canvasWorker.run(eventName, value);
  }
  return this
}

export default FallbackWorker;
