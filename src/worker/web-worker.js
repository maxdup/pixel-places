this.canvasWorker = require('./canvas-worker').default

/* eslint-disable */
self.onmessage = (event) => {
  if (event.data.msg === 'init'){
    this.canvasWorker.init(event.data.canvas);
  } else {
    this.canvasWorker.run(event.data.msg,
                          event.data.value);
  }
}
