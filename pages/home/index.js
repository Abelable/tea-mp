import { storeBindingsBehavior } from "mobx-miniprogram-bindings";
import { store } from "../../store/index";
import HomeService from "./utils/homeService";
import { WEBVIEW_BASE_URL } from "../../config";

const homeService = new HomeService();
const { statusBarHeight } = getApp().globalData.systemInfo;

Component({
  behaviors: [storeBindingsBehavior],

  storeBindings: {
    store,
    fields: ["promoterInfo", "userInfo"]
  },

  data: {
    liveVisible: false, // todo 用于前期提交审核隐藏部分功能，后期需要删除
    statusBarHeight,
    navBarBgVisible: false,
    themeZoneList: [],
    menuList: [],
    curMenuIdx: 0,
    bannerList: [
      {
        bg: "https://static.tiddler.cn/temp/f_bg.png",
        text: "https://static.tiddler.cn/temp/f_text.png"
      },
      {
        bg: "https://static.tiddler.cn/temp/s_bg.png",
        text: "https://static.tiddler.cn/temp/s_text.png"
      },
      {
        bg: "https://static.tiddler.cn/temp/qixi_bg.png",
        text: "https://static.tiddler.cn/temp/qixi_text.png"
      },
      {
        bg: "https://static.tiddler.cn/temp/c_bg.png",
        text: "https://static.tiddler.cn/temp/c_text.png"
      }
    ],
    middleBannerList: [],
    liveList: [],
    curDot: 0,
    activityGoodsLists: [[], [], []],
    hometownList: [
      { cover: "neimeng", name: "内蒙", desc: "辽阔草原风" },
      { cover: "hangzhou", name: "杭州", desc: "西湖映古今" },
      { cover: "wuhan", name: "武汉", desc: "江城烟雨浓" }
    ],
    goodsList: [],
    finished: false,
    adInfo: null,
    adModalVisible: false,
    posterInfo: null,
    posterModalVisible: false
  },

  pageLifetimes: {
    show() {
      store.setTabType("home");
    }
  },

  methods: {
    onLoad(options) {
      // todo 用于前期提交审核隐藏部分功能，后期需要删除
      const { envVersion } = wx.getAccountInfoSync().miniProgram || {};
      if (envVersion === "release") {
        this.setData({ liveVisible: true });
      }

      const { superiorId = "", scene = "" } = options || {};
      const decodedScene = scene ? decodeURIComponent(scene) : "";
      this.superiorId = superiorId || decodedScene.split("-")[0];

      getApp().onLaunched(async () => {
        if (this.superiorId && !store.promoterInfo) {
          wx.setStorageSync("superiorId", this.superiorId);
          const superiorInfo = await homeService.getSuperiorInfo(
            this.superiorId
          );
          store.setPromoterInfo(superiorInfo);
        }
      });

      this.setAdInfo();
      this.init();
    },

    async init() {
      wx.showLoading({ title: "加载中..." });
      // await this.setBannerList();
      await this.setThemeZoneList();
      await this.setMiddleBannerList();
      await this.setLiveList();
      await this.setMenuList();
      await this.setActivityGoodsList();
      this.setGoodsList(true);
    },

    async setThemeZoneList() {
      const themeZoneList = (await homeService.getThemeZoneList()) || [];
      this.setData({ themeZoneList });
    },

    selectMenu(e) {
      const curMenuIdx = e.currentTarget.dataset.index;
      this.setData({ curMenuIdx });
      if (!this.data.activityGoodsLists[curMenuIdx].length) {
        this.setActivityGoodsList();
      }
    },

    async setMenuList() {
      const menuList = (await homeService.getActivityTagOptions()) || [];
      this.setData({ menuList });
    },

    async setActivityGoodsList() {
      const { menuList, curMenuIdx } = this.data;
      const goodsList =
        (await homeService.getActivityList(menuList[curMenuIdx].id)) || [];
      this.setData({ [`activityGoodsLists[${curMenuIdx}]`]: goodsList });
    },

    async setGoodsList(init = false) {
      const limit = 10;
      if (init) {
        this.page = 0;
        this.setData({
          finished: false
        });
      }
      const { goodsList } = this.data;
      const list =
        (await homeService.getGoodsList({
          categoryId: 0,
          page: ++this.page,
          limit
        })) || [];
      this.setData({
        goodsList: init ? list : [...goodsList, ...list]
      });
      if (list.length < limit) {
        this.setData({
          finished: true
        });
      }
    },

    async setAdInfo() {
      const adInfo = await homeService.getAdInfo();
      if (adInfo) {
        this.setData({ adInfo, adModalVisible: true });
      }
    },

    async setBannerList() {
      const bannerList = await homeService.getBannerList();
      this.setData({ bannerList });
    },

    async setMiddleBannerList() {
      const middleBannerList = await homeService.getBannerList(2);
      this.setData({ middleBannerList });
    },

    async setLiveList() {
      const { list: liveList } = await homeService.getLiveList({
        page: 1,
        limit: 3
      });
      this.setData({ liveList });
    },

    subscribe(e) {
      const { id } = e.currentTarget.dataset;
      if (id !== store.userInfo.id) {
        checkLogin(() => {
          liveService.subscribeAnchor(id, () => {
            wx.showToast({
              title: "预约成功",
              icon: "none"
            });
          });
        });
      }
    },

    bannerChange(event) {
      this.setData({
        curDot: event.detail.current
      });
    },

    onReachBottom() {
      this.setGoodsList();
    },

    onPullDownRefresh() {
      this.init();
      wx.stopPullDownRefresh();
    },

    onPageScroll(e) {
      if (e.scrollTop >= 10) {
        if (!this.data.navBarBgVisible) {
          this.setData({ navBarBgVisible: true });
        }
      } else {
        if (this.data.navBarBgVisible) {
          this.setData({ navBarBgVisible: false });
        }
      }
    },

    checkPromoterInfo() {
      wx.navigateTo({
        url: "/pages/subpages/common/promoter/index"
      });
    },

    search() {
      wx.navigateTo({
        url: "/pages/subpages/common/search/index"
      });
    },

    linkTo(e) {
      const { scene, param } = e.currentTarget.dataset || {};
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
    },

    navToHometown(e) {
      const { name = "" } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `./subpages/hometown/index?name=${name}`
      });
    },

    checkLimitedTimeActivity() {
      wx.navigateTo({
        url: `/pages/subpages/common/webview/index?url=${WEBVIEW_BASE_URL}/activity/limited_time_recruit`
      });
    },

    checkMoreLive() {
      wx.navigateTo({
        url: "/pages/subpages/live/live-list/index"
      });
    },

    linkToLive(e) {
      const { id, anchorInfo, status, direction } =
        e.currentTarget.dataset.info;
      let url;
      if (anchorInfo.id === store.userInfo.id) {
        url =
          status === 3
            ? "/pages/subpages/live/live-notice/index"
            : `/pages/subpages/live/live-push/${
                direction === 1 ? "vertical" : "horizontal"
              }-screen/index`;
      } else {
        url = `/pages/subpages/live/live-play/index?id=${id}`;
      }
      wx.navigateTo({ url });
    },

    checkThemeZone(e) {
      const { scene, param } = e.currentTarget.dataset || {};
      if (scene) {
        switch (scene) {
          case 1:
            wx.navigateTo({
              url: `/pages/subpages/home/theme-zone/index?id=${param}`
            });
            break;

          case 2:
            wx.navigateTo({
              url: `/pages/subpages/common/webview/index?url=${param}`
            });
            break;

          case 3:
            wx.navigateTo({
              url: param,
              fail: () => {
                wx.switchTab({
                  url: param
                });
              }
            });
            break;
        }
      }
    },

    hideAdModal() {
      this.setData({
        adModalVisible: false
      });
    },

    async share() {
      const scene =
        wx.getStorageSync("token") && store.promoterInfo
          ? `${store.promoterInfo.id}`
          : "-";
      const page = "pages/home/index";
      const qrcode = await homeService.getQRCode(scene, page);

      this.setData({
        posterModalVisible: true,
        posterInfo: { qrcode }
      });
    },

    hidePosterModal() {
      this.setData({
        posterModalVisible: false
      });
    },

    // 分享
    onShareAppMessage() {
      const { id, nickname, signature } = store.promoterInfo || {};
      const title = nickname
        ? `${nickname} ${signature || "一叶知千岛"}`
        : "一叶知千岛";
      const path = id
        ? `/pages/home/index?superiorId=${id}`
        : "/pages/home/index";
      const imageUrl =
        "https://static.chengxinxingqiu.cn/mp/home_share_cover.png";
      return { title, imageUrl, path };
    },

    onShareTimeline() {
      const { id, nickname, signature } = store.promoterInfo || {};
      const title = nickname
        ? `${nickname} ${signature || "一叶知千岛"}`
        : "一叶知千岛";
      const query = id ? `superiorId=${id}` : "";
      const imageUrl =
        "https://static.chengxinxingqiu.cn/mp/home_share_cover.png";
      return { query, title, imageUrl };
    }
  }
});
