import { storeBindingsBehavior } from "mobx-miniprogram-bindings";
import { store } from "../store/index";

Component({
  behaviors: [storeBindingsBehavior],

  storeBindings: {
    store,
    fields: ["tabType"]
  },

  lifetimes: {
    attached() {
      const { windowHeight, safeArea } = getApp().globalData.systemInfo;
      const safeAreaInsetBottom = Math.max(
        windowHeight - safeArea.bottom - 10,
        10
      );
      this.setData({ safeAreaInsetBottom });
    }
  },

  data: {
    safeAreaInsetBottom: 10
  },

  methods: {
    switchTab(e) {
      wx.switchTab({ url: e.currentTarget.dataset.path });
    }
  }
});
