Component({
  properties: {
    info: Object
  },

  data: {
    goodsList: [
      { cover: "https://static.tiddler.cn/temp/tea.png" },
      { cover: "https://static.tiddler.cn/temp/tea.png" }
    ],
    curDot: 0
  },

  methods: {
    goodsChange(event) {
      this.setData({
        curDot: event.detail.current
      });
    },

    linkTo() {
      const { scene, param } = this.properties.info || {};
      if (scene) {
        switch (scene) {
          case 1:
            wx.navigateTo({
              url: `/pages/subpages/common/webview/index?url=${param}`
            });
            break;

          case 2:
            wx.navigateTo({
              url: `/pages/home/subpages/goods-detail/index?id=${param}`
            });
            break;
        }
      }
      this.hide();
    },

    catchtap() {}
  }
});
