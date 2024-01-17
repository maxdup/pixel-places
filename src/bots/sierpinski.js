function SierpinskiBot(canvasEventHandler){

  function getRandomColor() {
    const h = Math.floor(Math.random() * 360); // Random hue value between 0 and 360
    const s = 100;
    const l = 60;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function hslToHex(hsl) {
    const [h, s, l] = hsl.match(/\d+/g);
    const convertedColor = new HSLToHexConverter(h, s, l).convert();
    return convertedColor;
  }

  // Function to convert HSL to HEX
  class HSLToHexConverter {
    constructor(h, s, l) {
      this.h = parseInt(h, 10);
      this.s = parseInt(s, 10);
      this.l = parseInt(l, 10);
    }

    convert() {
      const h = this.h / 360;
      const s = this.s / 100;
      const l = this.l / 100;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = l - c / 2;

      let r, g, b;
      if (h < 1 / 6) {
        [r, g, b] = [c, x, 0];
      } else if (h < 2 / 6) {
        [r, g, b] = [x, c, 0];
      } else if (h < 3 / 6) {
        [r, g, b] = [0, c, x];
      } else if (h < 4 / 6) {
        [r, g, b] = [0, x, c];
      } else if (h < 5 / 6) {
        [r, g, b] = [x, 0, c];
      } else {
        [r, g, b] = [c, 0, x];
      }

      const red = Math.round((r + m) * 255);
      const green = Math.round((g + m) * 255);
      const blue = Math.round((b + m) * 255);

      return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
    }
  }

  function toHex(value) {
    const hex = value.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  // Adjust the parameters as needed
  let startX = Math.floor(Math.random() * 100);
  const startY = 0;
  const initialSize = 256;
  const initialDepth = 6;

  function drawLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;

    let err = dx - dy;

    while (true) {
      toDraw.push([x0,y0]);
      if (x0 === x1 && y0 === y1) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function drawTriangle(x, y, size, depth){

    drawLine(x, y, x+size, y);
    drawLine(x, y, x, y+size);
    drawLine(x+size, y, x, y+size);

    if (depth === 0){ return }

    let newSize = size/2;
    let newDepth = depth -1;

    drawTriangle(x, y, newSize, newDepth);
    drawTriangle(x+newSize, y, newSize, newDepth);
    drawTriangle(x, y+newSize, newSize, newDepth);
  }

  let toDraw = [];

  this.draw = () => {

    let drawPixel = () => {
      let drawN = 25;

      while(drawN > 0){

        if (toDraw.length === 0){
          // new triangle
          drawTriangle(startX, startY, initialSize, initialDepth);
          console.log('new triangle, set color')
          canvasEventHandler.current.setUserColor(hslToHex(getRandomColor()));
          startX--;
          if (startX === 0){
            startX = 128;
          };
        }

        let currentPixel = toDraw.pop();
        if(canvasEventHandler.current.inputPixel(currentPixel[0], currentPixel[1]) !== false){
          drawN--;
        };
      }
    }
    setInterval(drawPixel, 0);
  }

}

export { SierpinskiBot };
