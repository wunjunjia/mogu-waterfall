<template>
  <div>
    <input type="file" accept="image/*" @change="onChange" />
    <button type="button" @click="rotateClick">旋转</button>
    <button type="button" @click="getImgTrim">裁剪</button>
    <div class="container">
      <div class="image-trim" :style="{ width: `${defaultSize}px`, height: `${defaultSize}px` }">
        <canvas id="imageTrimCanvas" :width="defaultSize" :height="defaultSize" />
      </div>
      <div class="image-result">
        <canvas id="imageResultCanvas" :width="defaultSize" :height="defaultSize" />
      </div>
    </div>
    <div class="image-save">
      <canvas id="imageSaveCanvas" :width="defaultSize" :height="defaultSize" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImgTrim',
  data() {
    return {
      defaultSize: 300,
      click: false,
      dragging: false,
      draggingTrim: false,
      borderSize: 8,
      rotate: 0,
      scale: null,
      trimPosition: {
        startX: null,
        startY: null,
        width: null,
        height: null,
      },
      tempPosition: {
        startX: null,
        startY: null,
        width: null,
        height: null,
      },
      movePosition: {
        startX: null,
        startY: null,
      },
      borderOption: null,
      borderArr: [],
      image: null,
      ctx: null,
    };
  },
  methods: {
    initialConfigs() {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      Object.keys(this.trimPosition).forEach((key) => {
        this.trimPosition[key] = null;
      });
      Object.keys(this.tempPosition).forEach((key) => {
        this.tempPosition[key] = null;
      });
      Object.keys(this.movePosition).forEach((key) => {
        this.movePosition[key] = null;
      });
      this.borderArr = [];
      this.borderOption = null;
    },
    mouseDownEvent(e) {
      this.click = true;
      const currentX = e.offsetX * this.ratio;
      const currentY = e.offsetY * this.ratio;
      if (this.borderArr.length) {
        this.ctx.beginPath();
        for (let i = 0; i < this.borderArr.length; i += 1) {
          this.ctx.rect(this.borderArr[i].x, this.borderArr[i].y, this.borderArr[i].width, this.borderArr[i].height);
          if (this.ctx.isPointInPath(currentX, currentY)) {
            switch (this.borderArr[i].index) {
              case 1:
                  this.ctx.canvas.style.cursor = 'move'; break;
              case 2:
                  this.ctx.canvas.style.cursor = 'ns-resize'; break;
              case 3:
                  this.ctx.canvas.style.cursor = 'ew-resize'; break;
              case 4:
                  this.ctx.canvas.style.cursor = 'nwse-resize'; break;
              case 5:
                  this.ctx.canvas.style.cursor = 'nesw-resize'; break;
              default:
                  break;
            }
            this.borderOption = this.borderArr[i].option;
            this.draggingTrim = true;
            break;
          }
        }
        this.ctx.closePath();
      }
      if (this.draggingTrim) {
        this.movePosition.startX = currentX;
        this.movePosition.startY = currentY;
      } else {
        this.trimPosition.startX = currentX;
        this.trimPosition.startY = currentY;
      }
    },
    mouseMoveEvent(e) {
      if (!this.click) return;
      this.dragging = true;
      const currentX = e.offsetX * this.ratio;
      const currentY = e.offsetY * this.ratio;
      if (this.draggingTrim) this.moveTrim(currentX , currentY);
      else {
        const { startX, startY } = this.trimPosition;
        const width = currentX - startX;
        const height = currentY - startY;
        this.drawTrim(startX, startY, width, height);
      }
    },
    mouseUpEvent() {
      this.click = false;
      if (!this.dragging) return;
      const { startX, startY, width, height } = this.tempPosition;
      this.trimPosition.startX = startX;
      this.trimPosition.startY = startY;
      this.trimPosition.width = Math.abs(width);
      this.trimPosition.height = Math.abs(height);
      // 校准裁剪框的坐标
      if (width < 0) this.trimPosition.startX += width;
      if (height < 0) this.trimPosition.startY += height;
      // 保存裁剪框边的坐标
      this.saveBorderArr();
      // 重置
      this.dragging = false;
      this.draggingTrim = false;
      this.ctx.canvas.style.cursor = 'default';
      this.borderOption = null;
    },
    moveTrim(currentX, currentY) {
      const { width, height, startX, startY } = this.trimPosition;
      if (this.borderOption === 1) {
        let x = currentX - this.movePosition.startX + startX;
        let y = currentY - this.movePosition.startY + startY;
        if (x < 0) x = 0;
        else if (x > this.ctx.canvas.width - width) x = this.ctx.canvas.width - width;
        if (y < 0) y = 0;
        else if (y > this.ctx.canvas.height - height) y = this.ctx.canvas.height - height;
        this.drawTrim(x, y, width, height);
      } else {
        const data = this.moveTrimPosition(currentX, currentY, startX, startY, width, height);
        this.drawTrim(data.x, data.y, data.width, data.height);
      }
    },
    moveTrimPosition(currentX, currentY) {
      const { width, height, startX, startY } = this.trimPosition;
      switch (this.borderOption) {
        case 2:
          return {
            x: startX,
            y: currentY - (startY + height) >= 0 ? startY + height : currentY,
            width,
            height: height - (currentY - startY) <= 0 ? 0 : height - (currentY - startY),
          };
        case 3:
          return {
            x: startX,
            y: startY,
            width,
            height: currentY - startY <= 0 ? 0 : currentY - startY,
          };
        case 4:
          return {
            x: currentX - (startX + width) >= 0 ? startX + width : currentX,
            y: startY,
            width: width - (currentX - startX) <= 0 ? 0 : width - (currentX - startX),
            height, 
          };
        case 5:
          return {
            x: startX,
            y: startY,
            width: currentX - startX <= 0 ? 0 : currentX - startX,
            height,
          };
        case 6:
          return {
            x: currentX - (startX + width) >= 0 ? startX + width : currentX,
            y: currentY - (startY + height) >= 0 ? currentY + height : currentY,
            width: width - (currentX - startX) <= 0 ? 0 : width - (currentX - startX),
            height: height - (currentY - startY) <= 0 ? 0 : height - (currentY - startY),
          };
        case 7:
          return {
            x: startX,
            y: startY,
            width: currentX - startX > 0 ? currentX - startX : 0,
            height: currentY - startY > 0 ? currentY - startY : 0,
          };
        case 8: // en
          return {
            x: startX,
            y: currentY - (startY + height) >= 0 ? startY + height : currentY,
            width: currentX - startX > 0 ? currentX - startX : 0,
            height: height - (currentY - startY) <= 0 ? 0 : height - (currentY - startY),
          };
        case 9: // ws
          return {
            x: currentX - (startX + width) >= 0 ? startX + width : currentX,
            y: startY,
            width: width - (currentX - startX) <= 0 ? 0 : width - (currentX - startX),
            height: currentY - startY > 0 ? currentY - startY : 0,
          };
      }
    },
    saveBorderArr() {
      const { startX, startY, width, height } = this.trimPosition;
      const borderSize = this.borderSize;
      const borderArr = this.borderArr;
      const halfBorderSize = this.borderSize / 2;
      // move, n北s南e东w西, index为样式, option为操作
      borderArr[0] = { x: startX + halfBorderSize, y: startY + halfBorderSize, width: width - borderSize, height: height - borderSize, index: 1, option: 1 };
      // n
      borderArr[1] = { x: startX + halfBorderSize, y: startY, width: width - borderSize, height: halfBorderSize, index: 2, option: 2 };
      borderArr[2] = { x: startX - halfBorderSize + width / 2, y: startY - halfBorderSize, width: borderSize, height: halfBorderSize, index: 2, option: 2 };
      // s
      borderArr[3] = { x: startX + halfBorderSize, y: startY - halfBorderSize + height, width: width - borderSize, height: halfBorderSize, index: 2, option: 3 };
      borderArr[4] = { x: startX - halfBorderSize + width / 2, y: startY + height, width: borderSize, height: halfBorderSize, index: 2, option: 3 };
      // w
      borderArr[5] = { x: startX , y: startY + halfBorderSize, width: halfBorderSize, height: height - borderSize, index: 3, option: 4 };
      borderArr[6] = { x: startX - halfBorderSize, y: startY - halfBorderSize + height / 2, width: halfBorderSize, height: borderSize, index: 3, option: 4 };
      // e
      borderArr[7] = { x: startX - halfBorderSize + width, y: startY + halfBorderSize, width: halfBorderSize, height: height - borderSize, index: 3, option: 5 };
      borderArr[8] = { x: startX + width, y: startY - halfBorderSize + height / 2, width: halfBorderSize, height: borderSize, index: 3, option: 5 };
      // nw
      borderArr[9] = { x: startX - halfBorderSize, y: startY - halfBorderSize, width: borderSize, height: borderSize, index: 4, option: 6 };
      // se
      borderArr[10] = { x: startX - halfBorderSize + width, y: startY - halfBorderSize + height, width: borderSize, height: borderSize, index: 4, option: 7 };
      // ne 
      borderArr[11] = { x: startX - halfBorderSize + width, y: startY - halfBorderSize, width: borderSize, height: borderSize, index: 5, option: 8 };
      // sw
      borderArr[12] = { x: startX - halfBorderSize, y: startY - halfBorderSize + height, width: borderSize, height: borderSize, index: 5, option: 9 };
    },
    getPixelRatio(context) {
      const backingStore = context.backingStorePixelRatio ||
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;
      return (window.devicePixelRatio || 1) / backingStore;
    },
    drawTrim(x, y, width, height) {
      this.tempPosition.startX = x;
      this.tempPosition.startY = y;
      this.tempPosition.width = width;
      this.tempPosition.height = height;
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.save();
      // 绘制蒙层
      this.ctx.fillStyle = 'rgba(0, 0, 0, .6)';
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      // 将蒙层凿开
      this.ctx.globalCompositeOperation = 'source-atop';
      this.ctx.clearRect(x, y, width, height);
      // 绘制8个边框像素点并保存坐标信息以及事件参数
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = '#ff0036';
      const halfBorderSize = this.borderSize / 2;
      this.ctx.fillRect(x - halfBorderSize, y - halfBorderSize, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize + width / 2, y - halfBorderSize, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize + width, y - halfBorderSize, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize, y - halfBorderSize + height / 2, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize + width, y - halfBorderSize + height / 2, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize, y - halfBorderSize + height, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize + width / 2, y - halfBorderSize + height, this.borderSize, this.borderSize);
      this.ctx.fillRect(x - halfBorderSize + width, y - halfBorderSize + height, this.borderSize, this.borderSize);
      this.ctx.restore();
      this.ctx.save();
      // 再次使用drawImage将图片绘制到蒙层下方
      this.ctx.globalCompositeOperation = 'destination-over';
      this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
      this.ctx.rotate(this.rotate * Math.PI / 180);
      if (this.rotate % 180 === 0) this.ctx.translate(-this.ctx.canvas.width / 2, -this.ctx.canvas.height / 2);
      else this.ctx.translate(-this.ctx.canvas.height / 2, -this.ctx.canvas.width / 2);
      this.ctx.drawImage(this.image, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.restore();
    },
    getImage(file) {
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const image = new Image();
            image.onload = () => {
              resolve(image);
            }
            image.src = e.target.result; // base64
            image.crossOrigin = 'Anonymous'; //解决跨域问题
          }
        } catch (e) {
          reject(e);
        }
      });
    },
    drawImage(image) {
      this.ctx.clearRect(0, 0, this.ctx.width, this.ctx.height);
      const proportion = image.width / image.height;
      this.scale = proportion > 1 ? this.defaultSize / image.width : this.defaultSize / image.height;
      const width = image.width * this.scale * this.ratio;
      const height = image.height * this.scale * this.ratio;
      this.ctx.canvas.width = width;
      this.ctx.canvas.height = height;
      this.ctx.canvas.style.width = `${width / this.ratio}px`;
      this.ctx.canvas.style.height = `${height / this.ratio}px`;
      this.ctx.drawImage(image, 0, 0, width, height);
    },
    rotateClick() {
      this.initialConfigs();
      this.rotate += 90;
      const { width, height } = this.ctx.canvas;
      this.ctx.canvas.width = height;
      this.ctx.canvas.height = width;
      this.ctx.canvas.style.width = `${height / this.ratio}px`;
      this.ctx.canvas.style.height = `${width / this.ratio}px`;
      this.ctx.save();
      this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
      this.ctx.rotate(this.rotate * Math.PI / 180);
      if (this.rotate % 180 === 0) this.ctx.translate(-this.ctx.canvas.width / 2, -this.ctx.canvas.height / 2);
      else this.ctx.translate(-this.ctx.canvas.height / 2, -this.ctx.canvas.width / 2);
      // 注意这里的宽高取决与图片占默认宽高300的比值，而不是canvas的宽高
      this.ctx.drawImage(this.image, 0, 0, this.image.width * this.scale * this.ratio, this.image.height * this.scale * this.ratio);
      this.ctx.restore();
    },
    restoreData(val) {
      return Math.floor(val / this.scale / this.ratio);
    },
    getImgTrim() {
      // save-canvas
      const saveCanvas = document.querySelector('#imageSaveCanvas');
      const saveCtx = saveCanvas.getContext('2d');
      saveCtx.clearRect(0, 0, saveCanvas.width, saveCanvas.height);
      saveCanvas.width = this.image.width;
      saveCanvas.height = this.image.height;
      saveCanvas.style.width = `${this.image.width / this.ratio}px`;
      saveCanvas.style.height = `${this.image.height / this.ratio}px`;
      saveCtx.save();
      saveCtx.translate(saveCanvas.width / 2, saveCanvas.height / 2);
      saveCtx.rotate(this.rotate * Math.PI / 180);
      if (this.rotate % 180 === 0) saveCtx.translate(-saveCanvas.width / 2, -saveCanvas.height / 2);
      else saveCtx.translate(-saveCanvas.height / 2, -saveCanvas.width / 2);
      saveCtx.drawImage(this.image, 0, 0, saveCanvas.width, saveCanvas.height);
      saveCtx.restore();
      const x = this.trimPosition.startX ? this.restoreData(this.trimPosition.startX) : 0;
      const y = this.trimPosition.startY ? this.restoreData(this.trimPosition.startY) : 0;
      const width = this.trimPosition.width ? this.restoreData(this.trimPosition.width) : saveCanvas.width;
      const height = this.trimPosition.height ? this.restoreData(this.trimPosition.height) : saveCanvas.height;
      const data = saveCtx.getImageData(x, y, width, height);
      // result-canvas
      const resultCanvas = document.querySelector('#imageResultCanvas');
      const resultCtx = resultCanvas.getContext('2d');
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      resultCanvas.width = width;
      resultCanvas.height = height;
      resultCanvas.style.width = `${width / this.ratio}px`;
      resultCanvas.style.height = `${height / this.ratio}px`;
      resultCtx.putImageData(data, 0, 0);
      // 图片上传
      resultCanvas.toBlob((blob) => {
        blob.lastModifiedDate = new Date();
        const fd = new FormData();
        fd.append('image', blob);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3000/api/upload', true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4  && xhr.status === 200) {
            console.log(xhr.responseText);
          }
        }
        xhr.send(fd);
      });
    },
    onChange({ target: { files } }) {
      if (files.length === 0) return;
      this.getImage(files[0])
        .then((image) => {
          this.image = image;
          this.drawImage(image);
        });
    },
  },
  mounted() {
    this.ctx = document.querySelector('#imageTrimCanvas').getContext('2d');
    this.ratio = this.getPixelRatio(this.ctx);
    this.ctx.canvas.addEventListener('mousedown', this.mouseDownEvent);
    this.ctx.canvas.addEventListener('mousemove', this.mouseMoveEvent);
    this.ctx.canvas.addEventListener('mouseup', this.mouseUpEvent);
    this.ctx.canvas.addEventListener('mouseout', this.mouseUpEvent);
  },
  beforeDestory() {
    this.ctx.canvas.removeEventListener('mousedown');
    this.ctx.canvas.removeEventListener('mousemove');
    this.ctx.canvas.removeEventListener('mouseup');
  },
};
</script>

<style scoped>
.container {
  display: flex;
}
.image-trim {
  overflow: hidden;
  position: relative;
  /* 马赛克背景图 */
  background-image: url('https://s10.mogucdn.com/mlcdn/c45406/190723_3afckd96l9h4fh6lcb56117cld176_503x503.jpg');
  background-size: cover;
}
 #imageTrimCanvas {
  cursor: default;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
}
</style>