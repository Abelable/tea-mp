import { storeBindingsBehavior } from "mobx-miniprogram-bindings";
import { store } from "../store/index";

Component({
  behaviors: [storeBindingsBehavior],

  storeBindings: {
    store,
    fields: ["tabType"]
  },

  methods: {
    switchTab(e) {
      wx.vibrateShort();
      wx.switchTab({ url: e.currentTarget.dataset.path });
    }
  }
});
