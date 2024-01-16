function CanvasRenderApi(canvas){

  // A simple interface to overcome web worker compatibility issues

  this.worker = null;
  this.canvas = canvas;

  try {
    // We "try" using the Worker API.
    //throw new Error('lol');
    this.worker = new Worker(new URL('./worker/web-worker.js', import.meta.url));
    const offscreenCanvas = canvas.transferControlToOffscreen();
    this.worker.postMessage({msg: 'init',
                             canvas: offscreenCanvas,
                            }, [offscreenCanvas]);
  }
  catch(err) {
    // In the event that the browser doesn't support the Worker API,
    // a fallback is put in place
    try {
      import('./worker/fallback-worker.js').then((FallbackWorker) => {
        this.worker = FallbackWorker.default();
        this.worker.init(canvas);
      });
    } catch (err){
      console.error("Worker didn't initialize because:", err);
    }
  }

  this.exec = (eventName, value) => {
    this.worker.postMessage({msg: eventName, value: value});
  }


}

export { CanvasRenderApi };
