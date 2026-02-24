import { storeBindingsBehavior } from "mobx-miniprogram-bindings";
import { store } from "../../store/index";
import CategoryService from "./utils/categoryService";

const categoryService = new CategoryService();
const { statusBarHeight } = getApp().globalData.systemInfo;

Component({
  behaviors: [storeBindingsBehavior],

  storeBindings: {
    store,
    fields: ["promoterInfo"]
  },

  data: {
    statusBarHeight,
    bannerList: [],
    categoryOptions: [],
    curCategoryIdx: 0,
    goodsLists: [],
    posterInfo: null,
    posterModalVisible: false
  },

  pageLifetimes: {
    show() {
      store.setTabType("category");
    }
  },

  methods: {
    async onLoad() {
      await this.setCategoryOptions();
      this.setGoodsLists(true);
    },

    async setCategoryOptions() {
      const categoryOptions = await categoryService.getCategoryOptions();
      const goodsLists = new Array(categoryOptions.length).fill().map(() => ({
        sortMenuList: [
          { name: "销量", value: "sales_volume", order: "desc" },
          { name: "价格", value: "price", order: "desc" },
          { name: "好评", value: "avg_score", },
          { name: "新品", value: "created_at", }
        ],
        curSortIdx: 0,
        list: [],
        finished: false
      }));
      this.pageList = new Array(categoryOptions.length).fill(0);
      this.setData({ categoryOptions, goodsLists });
    },

    selectCategory(e) {
      const curCategoryIdx = e.currentTarget.dataset.idx;
      this.setData({ curCategoryIdx });
      if (!this.data.goodsLists[curCategoryIdx].list.length) {
        this.setGoodsLists(true);
      }
    },

    selectSort(e) {
      const { curCategoryIdx, goodsLists } = this.data;
      const { index } = e.currentTarget.dataset;
      const { sortMenuList, curSortIdx } = goodsLists[curCategoryIdx];
      if (index === curSortIdx && [2, 3].includes(index)) {
        return;
      }
      if (index === curSortIdx) {
        const { order } = sortMenuList[index];
        this.setData({
          [`goodsLists[${curCategoryIdx}].sortMenuList[${index}].order`]:
            order === "desc" ? "asc" : "desc"
        });
      } else {
        this.setData({ [`goodsLists[${curCategoryIdx}].curSortIdx`]: index });
      }
      this.setGoodsLists(true);
    },

    async setGoodsLists(init = false) {
      const { categoryOptions, curCategoryIdx, goodsLists } = this.data;
      const { sortMenuList, curSortIdx } = goodsLists[curCategoryIdx]
      const limit = 10;
      if (init) {
        this.pageList[curCategoryIdx] = 0;
        this.setData({
          [`goodsLists[${curCategoryIdx}].finished`]: false
        });
      }
      const list =
        (await categoryService.getGoodsList({
          categoryId: categoryOptions[curCategoryIdx].id,
          sort: sortMenuList[curSortIdx].value,
          order: sortMenuList[curSortIdx].order || 'desc',
          page: ++this.pageList[curCategoryIdx],
          limit
        })) || [];
      this.setData({
        [`goodsLists[${curCategoryIdx}].list`]: init
          ? list
          : [...goodsLists[curCategoryIdx].list, ...list]
      });
      if (list.length < limit) {
        this.setData({
          [`goodsLists[${curCategoryIdx}].finished`]: true
        });
      }
    },

    onReachBottom() {
      const { curCategoryIdx, goodsLists } = this.data;
      if (!goodsLists[curCategoryIdx].finished) {
        this.setGoodsLists();
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
      const { scene, param } = e.currentTarget.dataset;
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
    },

    async share() {
      const scene =
        wx.getStorageSync("token") && store.promoterInfo
          ? `${store.promoterInfo.id}`
          : "-";
      const page = "pages/home/index";
      const qrcode = await categoryService.getQRCode(scene, page);
  
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
        ? `${nickname} ${signature || "让时间见证信任"}`
        : "让时间见证信任";
      const path = id
        ? `/pages/home/index?superiorId=${id}`
        : "/pages/home/index";
      const imageUrl =
        "https://static.chengxinxingqiu.cn/mp/home_share_cover.png";
      return { title, imageUrl, path };
    },

    // 分享
    onShareAppMessage() {
      const { id, nickname, signature } = this.data.promoterInfo;
      const title = `${nickname} ${signature || "让时间见证信任"}`;
      const path = `/pages/home/index?superiorId=${id}`;
      const imageUrl =
        "https://static.chengxinxingqiu.cn/mp/home_share_cover.png";
      return { title, imageUrl, path };
    }
  }
});
