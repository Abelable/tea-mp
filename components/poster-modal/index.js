import { store } from "../../store/index";

let canvas = null;
let ctx = null;

Component({
  properties: {
    info: Object
  },

  lifetimes: {
    async attached() {
      wx.showLoading({ title: "海报生成中..." });
      await this.init();
      await this.createPoster();
      wx.hideLoading();
    }
  },

  methods: {
    init() {
      return new Promise(resolve => {
        this.createSelectorQuery()
          .select("#poster")
          .fields({ node: true, size: true })
          .exec(res => {
            if (res && res.length) {
              canvas = res[0].node;
              const renderWidth = res[0].width;
              const renderHeight = res[0].height;
              ctx = canvas.getContext("2d");

              const dpr = getApp().globalData.systemInfo.pixelRatio;
              canvas.width = renderWidth * dpr;
              canvas.height = renderHeight * dpr;
              ctx.scale(dpr, dpr);
              resolve();
            }
          });
      });
    },

    async createPoster() {
      const { qrcode } = this.properties.info || {};

      await this.roundRect(
        0,
        0,
        275,
        555,
        8,
        `https://static.chengxinxingqiu.cn/mp/home_poster_bg_${
          Math.floor(Math.random() * 3) + 1
        }.png`
      );
      await this.roundRect(
        0,
        4,
        100,
        38,
        0,
        "https://static.chengxinxingqiu.cn/mp/home_poster_logo.png"
      );

      if (store.promoterInfo) {
        this.roundRect(
          165,
          12,
          100,
          30,
          15,
          "",
          null,
          "rgba(255, 255, 255, 0.5)"
        );
        const { avatar, nickname, signature } = store.promoterInfo || {};
        await this.roundRect(
          168,
          15,
          24,
          24,
          12,
          avatar || "https://static.chengxinxingqiu.cn/mp/logo.png"
        );
        this.setText(10, "#000", 195, 26, nickname || "诚信星球", "left");
        this.setText(7, "#6A6F75", 195, 37, signature || "一叶知千岛");
      }

      await this.roundRect(86.5, 345, 100, 100, 50, qrcode);

      wx.canvasToTempFilePath(
        {
          canvas,
          success: res => {
            this.posterUrl = res.tempFilePath;
          }
        },
        this
      );
    },

    setCouponList(couponList, x, y) {
      for (let i = 0; i < couponList.length; i++) {
        const coupon = couponList[i];
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#FF4747";
        const { width } = ctx.measureText(coupon.name);
        this.roundRect(
          x,
          y - 12,
          width + 8,
          16,
          5,
          "",
          null,
          "transparent",
          "#FF4747",
          1
        );
        ctx.fillText(coupon.name, x + 4, y);
        x = x + width + 12;
      }
    },

    setPrice(price, x, y) {
      this.setText(14, "#ff5040", x, y, "¥");

      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#ff5040";
      ctx.fillText(price, x + 10, y);
    },

    /**
     * 绘制圆角矩形
     * @param {Number} x - 矩形的x坐标
     * @param {Number} y - 矩形的y坐标
     * @param {Number} w - 矩形的宽度
     * @param {Number} h - 矩形的高度
     * @param {Number} r - 矩形的圆角半径
     * @param {String} cover - 矩形的封面
     * @param {Object} shadow - 矩形的阴影
     * @param {String} [c = 'transparent'] - 矩形的填充色
     */
    async roundRect(
      x,
      y,
      w,
      h,
      r = 0,
      cover = "",
      shadow = null,
      c = "transparent",
      lineColor,
      lineWidth
    ) {
      ctx.save();
      ctx.beginPath();

      if (shadow) {
        let { x, y, blur, color } = shadow;
        ctx.shadowOffsetX = x;
        ctx.shadowOffsetY = y;
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
      }
      let r1, r2, r3, r4;
      typeof r === "number" ? (r1 = r2 = r3 = r4 = r) : ([r1, r2, r3, r4] = r);

      if (lineColor) {
        ctx.moveTo(x + r1, y);
      } else {
        ctx.moveTo(x, y);
      }

      r2 ? ctx.arcTo(x + w, y, x + w, y + h, r2) : ctx.lineTo(x + w, y);
      r3 ? ctx.arcTo(x + w, y + h, x, y + h, r3) : ctx.lineTo(x + w, y + h);
      r4 ? ctx.arcTo(x, y + h, x, y, r4) : ctx.lineTo(x, y + h);
      r1 ? ctx.arcTo(x, y, x + w, y, r1) : ctx.lineTo(x, y);

      ctx.fillStyle = c;
      if (lineColor) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      ctx.fill();

      if (cover) {
        ctx.clip();
        await this.drawImage(cover, x, y, w, h);
      }
      ctx.restore();
    },

    setText(
      fs,
      color,
      x,
      y,
      c,
      align = "left",
      bold = false,
      fontFamily = "sans-serif"
    ) {
      ctx.font = bold ? `bold ${fs}px ${fontFamily}` : `${fs}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(c, x, y);
      ctx.restore();
    },

    setWrapText(
      fs,
      color,
      x,
      y,
      c,
      lineHeight,
      maxWidth,
      bold = false,
      maxRow = 2,
      fontFamily = "sans-serif"
    ) {
      ctx.font = bold ? `bold ${fs}px ${fontFamily}` : `${fs}px ${fontFamily}`;
      ctx.fillStyle = color;
      let line = "";
      let row = 0;
      for (let i = 0; i < c.length; i++) {
        const tempLine = line + c[i];
        const tempLineWidth = ctx.measureText(tempLine).width;
        if (tempLineWidth > maxWidth && i > 0) {
          row++;
          if (row === maxRow) {
            line = tempLine.slice(0, -2) + "...";
            break;
          } else {
            ctx.fillText(line, x, y);
            line = c[i];
            y += lineHeight;
          }
        } else {
          line = tempLine;
        }
      }
      ctx.fillText(line, x, y);
      ctx.restore();
    },

    drawImage(src, x, y, w, h, mode = "cover") {
      return new Promise(resolve => {
        const image = canvas.createImage();
        image.src = src;
        image.onload = () => {
          switch (mode) {
            case "cover":
              this.drawCoverImage(image, x, y, w, h);
              break;

            case "contain":
              this.drawContainImage(image, x, y, w, h);
              break;

            case "fill":
              ctx.drawImage(image, x, y, w, h);
              break;

            case "none":
              ctx.drawImage(image, x, y, image.width, image.height);
              break;
          }
          resolve();
        };
      });
    },

    drawCoverImage(image, x, y, w, h) {
      const scale = this.calcCoverScale(image.width, image.height, w, h);
      const _w = image.width * scale;
      const _h = image.height * scale;
      const { _x, _y } = this.calcPos(_w, _h, w, h);
      ctx.drawImage(image, x + _x, y + _y, _w, _h);
    },

    drawContainImage() {
      const scale = this.calcContainScale(image.width, image.height, w, h);
      const _w = image.width * scale;
      const _h = image.height * scale;
      const { _x, _y } = this.calcPos(_w, _h, w, h);
      ctx.drawImage(image, x + _x, y + _y, _w, _h);
    },

    /**
     * cover 模式
     * @param {number} w 图片宽度
     * @param {number} h 图片高度
     * @param {number} cw 容器宽度
     * @param {number} ch 容器高度
     * @returns {number} 缩放比
     */
    calcCoverScale(w, h, cw, ch) {
      const scaleW = cw / w;
      const scaleH = ch / h;
      const scale = Math.max(scaleW, scaleH); // 取大值
      return scale;
    },

    /**
     * contain 模式
     * @param {number} w 图片宽度
     * @param {number} h 图片高度
     * @param {number} cw 容器宽度
     * @param {number} ch 容器高度
     * @returns {number} 缩放比
     */
    calcContainScale(w, h, cw, ch) {
      const scaleW = cw / w;
      const scaleH = ch / h;
      const scale = Math.min(scaleW, scaleH); // 取小值
      return scale;
    },

    // 计算让图片居中需要设置的 x，y
    calcPos(w, h, cw, ch) {
      return {
        _x: (cw - w) / 2,
        _y: (ch - h) / 2
      };
    },

    save() {
      wx.getSetting({
        success: res => {
          if (res.authSetting["scope.writePhotosAlbum"] !== false)
            this.saveImageToPhotosAlbum();
          else
            wx.showModal({
              title: "信息授权提示",
              content: "您当前为未授权状态，请到小程序的设置中打开授权",
              showCancel: true,
              cancelText: "取消",
              confirmText: "去设置",
              success: res => {
                if (res.confirm)
                  wx.openSetting({
                    success: () => {
                      this.saveImageToPhotosAlbum();
                    }
                  });
              }
            });
        }
      });
    },

    saveImageToPhotosAlbum() {
      wx.saveImageToPhotosAlbum({
        filePath: this.posterUrl,
        success: () => {
          this.triggerEvent("hide");
          wx.showToast({ title: "成功保存", icon: "none" });
        }
      });
    },

    saveQrcode() {
      const imgSrc = this.properties.info.qrcode.split(",")[1];
      const save = wx.getFileSystemManager();
      const number = Math.random();
      save.writeFile({
        filePath: wx.env.USER_DATA_PATH + "/pic" + number + ".png",
        data: imgSrc,
        encoding: "base64",
        success: () => {
          wx.saveImageToPhotosAlbum({
            filePath: wx.env.USER_DATA_PATH + "/pic" + number + ".png",
            success: () => {
              this.triggerEvent("hide");
              wx.showToast({ title: "保存成功", icon: "none" });
            }
          });
        }
      });
    },

    hide() {
      this.triggerEvent("hide");
    },

    catchtap() {}
  }
});
