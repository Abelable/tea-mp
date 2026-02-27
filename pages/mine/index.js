import { storeBindingsBehavior } from "mobx-miniprogram-bindings";
import { store } from "../../store/index";
import { checkLogin } from "../../utils/index";
import MineService from "./utils/mineService";
import { WEBVIEW_BASE_URL } from "../../config";

const mineService = new MineService();
const { statusBarHeight } = getApp().globalData.systemInfo;

Component({
  behaviors: [storeBindingsBehavior],

  storeBindings: {
    store,
    fields: ["userInfo", "promoterInfo"]
  },

  data: {
    statusBarHeight,
    navBarBgVisible: false,
    dateList: ["今日", "昨日", "本月", "上月"],
    curDateIdx: 0,
    commissionSumInfo: null,
    commissionTimeData: null,
    customerData: {},
    orderStatusList: [
      { en: "pay", zh: "待付款", total: 0 },
      { en: "package", zh: "待发货", total: 0 },
      { en: "ship", zh: "待收货", total: 0 },
      { en: "comment", zh: "待评价", total: 0 },
      { en: "refund", zh: "售后", total: 0 }
    ],
    unreadNotificationCount: 0,
    liveVisible: false,
    authInfoPopupVisible: false,
    authInfoModalVisible: false,
    posterInfo: null,
    posterModalVisible: false
  },

  pageLifetimes: {
    show() {
      store.setTabType("mine");

      this.init();
    }
  },

  methods: {
    onLoad() {
      setTimeout(() => {
        checkLogin(() => {
          const { avatar = "" } = store.userInfo || {};
          if (!avatar || avatar.includes("default_avatar")) {
            this.setData({ authInfoPopupVisible: true });
          }
        }, false);
      }, 500);
    },

    init() {
      checkLogin(async () => {
        const userInfo = await mineService.getUserInfo();

        if (userInfo.level) {
          if (!store.promoterInfo || store.promoterInfo.id !== userInfo.id) {
            store.setPromoterInfo(userInfo);
          }
        }

        if (store.promoterInfo) {
          this.setCommissionSumInfo();
          this.setCommissionTimeData();
          this.setCustomerData();
        }

        this.setLiveVisible();
        this.setOrderListTotals();
        this.setUnreadNotificationCount();
      }, false);
    },

    async setLiveVisible() {
      const liveUserIds = await mineService.getLiveUserIds();
      if (liveUserIds.includes(store.userInfo.id)) {
        this.setData({ liveVisible: true });
      }
    },

    async setCommissionSumInfo() {
      const commissionSumInfo = await mineService.getCommissionSumInfo();
      this.setData({ commissionSumInfo });
    },

    async setCommissionTimeData() {
      const commissionTimeData = await mineService.getCommissionTimeData(
        this.data.curDateIdx + 1
      );
      this.setData({ commissionTimeData });
    },

    async setCustomerData() {
      const customerData = await mineService.getCustomerData();
      this.setData({ customerData });
    },

    async setOrderListTotals() {
      const orderTotals = await mineService.getOrderTotals();
      const { orderStatusList } = this.data;
      orderStatusList[0].total = orderTotals[0];
      orderStatusList[1].total = orderTotals[1];
      orderStatusList[2].total = orderTotals[2];
      orderStatusList[3].total = orderTotals[3];
      orderStatusList[4].total = orderTotals[4];
      this.setData({ orderStatusList });
    },

    async setUnreadNotificationCount() {
      const unreadNotificationCount =
        await mineService.getUnreadNotificationCount();
      this.setData({ unreadNotificationCount });
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

    updateUserInfo() {
      const { avatar = "" } = store.userInfo || {};
      if (!avatar || avatar.includes("default_avatar")) {
        this.setData({ authInfoPopupVisible: true });
      } else {
        this.setData({ authInfoModalVisible: true });
      }
    },

    hideAuthInfoPopup() {
      this.setData({ authInfoPopupVisible: false });
    },

    hideAuthInfoModal() {
      this.setData({ authInfoModalVisible: false });
    },

    selectDate(e) {
      const curDateIdx = e.currentTarget.dataset.index;
      this.setData({ curDateIdx });
      this.setCommissionTimeData();
    },

    withdraw() {
      wx.navigateTo({
        url: "./subpages/account/index"
      });
    },

    navToIntegritySchool() {
      checkLogin(() => {});
    },

    navToOrderCenter(e) {
      checkLogin(() => {
        const { status } = e.currentTarget.dataset;
        if (status === 4) {
          wx.navigateTo({
            url: "./subpages/order-center/subpages/evaluate-orders/index"
          });
        } else {
          wx.navigateTo({
            url: `./subpages/order-center/index?status=${status}`
          });
        }
      });
    },

    navToAddress() {
      checkLogin(() => {
        wx.navigateTo({
          url: "./subpages/address-list/index"
        });
      });
    },

    navToNotification() {
      checkLogin(() => {
        wx.navigateTo({
          url: "./subpages/notification/index"
        });
      });
    },

    navToCoupon() {
      checkLogin(() => {
        wx.navigateTo({
          url: "./subpages/coupon-list/index"
        });
      });
    },

    async navToLive() {
      const statusInfo = await mineService.getRoomStatus();
      if (!statusInfo) {
        wx.navigateTo({
          url: "/pages/subpages/live/create-live/index"
        });
      } else {
        const { status, direction } = statusInfo;
        const url =
          status === 3
            ? "/pages/subpages/live/live-notice/index"
            : `/pages/subpages/live/live-push/${
                direction === 1 ? "vertical" : "horizontal"
              }-screen/index`;
        wx.navigateTo({ url });
      }
    },

    navToCustomer(e) {
      checkLogin(() => {
        wx.navigateTo({
          url: `./subpages/customer/index?type=${e.currentTarget.dataset.type}`
        });
      });
    },

    verify() {
      wx.scanCode({
        success: res => {
          const code = res.result;
          mineService.verify(code, () => {
            wx.showToast({
              title: "核销成功",
              icon: "none"
            });
          });
        }
      });
    },

    navToSetting() {
      checkLogin(() => {
        wx.navigateTo({
          url: "./subpages/setting/index"
        });
      });
    },

    navToTeamData() {
      wx.navigateTo({
        url: `/pages/subpages/common/webview/index?url=${WEBVIEW_BASE_URL}/team`
      });
    },

    navToBalance() {
      wx.navigateTo({
        url: "./subpages/balance/index"
      });
    },

    register() {
      wx.navigateTo({ url: "/pages/subpages/common/register/index" });
    },

    async share() {
      const scene =
        wx.getStorageSync("token") && store.promoterInfo
          ? `${store.promoterInfo.id}`
          : "-";
      const page = "pages/home/index";
      const qrcode = await mineService.getQRCode(scene, page);

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

    // 分享
    onShareAppMessage() {
      if (store.promoterInfo) {
        const { id, nickname, signature } = store.promoterInfo;
        const title = `${nickname} ${signature || "一叶知千岛"}`;
        const path = `/pages/home/index?superiorId=${id}`;
        const imageUrl =
          "https://static.chengxinxingqiu.cn/mp/home_share_cover.png";
        return { title, imageUrl, path };
      }
    }
  }
});
