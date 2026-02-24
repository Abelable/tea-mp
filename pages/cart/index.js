import { store } from "../../store/index";
import { checkLogin } from "../../utils/index";
import BaseService from "../../services/baseService";

const baseService = new BaseService();
const { statusBarHeight } = getApp().globalData.systemInfo;

Component({
  data: {
    statusBarHeight,
    cartList: [],
    newYearCartList: [],
    recommendGoodsList: [],
    finished: false,
    isSelectAll: false,
    totalPrice: 0,
    selectedCount: 0,
    deleteBtnVisible: false,
    goodsInfo: null,
    cartInfo: null,
    specPopupVisible: false
  },

  pageLifetimes: {
      show() {
        store.setTabType("cart");

        // checkLogin(this.init);
      }
    },

  methods: {
    async init() {
      await this.setCartList();
      this.setRecommendGoodsList(true);
    },
  
    async setCartList() {
      const list = (await baseService.getCartList()) || [];
      const cartList = [];
      const newYearCartList = [];
      list.forEach(item => {
        if (item.isNewYearGift) {
          newYearCartList.push({
            ...item,
            checked: false
          });
        } else {
          cartList.push({
            ...item,
            checked: false
          });
        }
      });
      this.setData({ cartList, newYearCartList });
    },
  
    async setRecommendGoodsList(init = false) {
      if (init) {
        this.page = 0;
        this.setData({ finished: false });
      }
      const { cartList, recommendGoodsList } = this.data;
      const goodsIds = cartList.map(({ goodsId }) => goodsId);
      const categoryIds = Array.from(
        new Set(cartList.reduce((a, c) => [...a, ...(c.categoryIds || [])], []))
      );
  
      const list = await baseService.getRecommedGoodsList(
        goodsIds,
        categoryIds,
        ++this.page
      );
      this.setData({
        recommendGoodsList: init ? list : [...recommendGoodsList, ...list]
      });
      if (!list.length) {
        this.setData({ finished: true });
      }
    },
  
    async toggleNewYearGoodsChecked(e) {
      const { index } = e.currentTarget.dataset;
      let { newYearCartList, cartList, deleteBtnVisible } = this.data;
      let goodsCheckStatus = newYearCartList[index].checked;
      newYearCartList[index].checked = !goodsCheckStatus;
      let unCheckedIndex = cartList.findIndex(item => {
        if (deleteBtnVisible || (!deleteBtnVisible && item.status === 1))
          return item.checked === false;
      });
      let newYearUnCheckedIndex = newYearCartList.findIndex(item => {
        if (deleteBtnVisible || (!deleteBtnVisible && item.status === 1))
          return item.checked === false;
      });
      const isSelectAll = unCheckedIndex === -1 && newYearUnCheckedIndex === -1;
      this.setData({ newYearCartList, isSelectAll }, () => {
        this.acount();
      });
    },
  
    /**
     * 切换商品列表选中状态
     */
    async toggleGoodsChecked(e) {
      const { index } = e.currentTarget.dataset;
      let { cartList, newYearCartList, deleteBtnVisible } = this.data;
      let goodsCheckStatus = cartList[index].checked;
      cartList[index].checked = !goodsCheckStatus;
      let unCheckedIndex = cartList.findIndex(item => {
        if (deleteBtnVisible || (!deleteBtnVisible && item.status === 1))
          return item.checked === false;
      });
      let newYearUnCheckedIndex = newYearCartList.findIndex(item => {
        if (deleteBtnVisible || (!deleteBtnVisible && item.status === 1))
          return item.checked === false;
      });
      const isSelectAll = unCheckedIndex === -1 && newYearUnCheckedIndex === -1;
      this.setData({ cartList, isSelectAll }, () => {
        this.acount();
      });
    },
  
    /**
     * 切换全选状态
     */
    toggleAllChecked() {
      let { cartList, newYearCartList, isSelectAll, deleteBtnVisible } =
        this.data;
      if (deleteBtnVisible) {
        cartList.map(item => {
          item.checked = !isSelectAll;
        });
        newYearCartList.map(item => {
          item.checked = !isSelectAll;
        });
        this.setData({ cartList, newYearCartList }, () => {
          this.acount();
        });
      } else {
        cartList.map(item => {
          if (item.status === 1) item.checked = !isSelectAll;
        });
        newYearCartList.map(item => {
          if (item.status === 1) item.checked = !isSelectAll;
        });
        this.setData({ cartList, newYearCartList }, () => {
          this.acount();
        });
      }
    },
  
    async newYearCountChange(e) {
      const { cartIndex } = e.currentTarget.dataset;
      const { id, goodsId, selectedSkuIndex } =
        this.data.newYearCartList[cartIndex];
      baseService.editCart(id, goodsId, selectedSkuIndex, e.detail, () => {
        this.setData(
          {
            [`newYearCartList[${cartIndex}].number`]: e.detail
          },
          () => {
            this.acount();
          }
        );
      });
    },
  
    async countChange(e) {
      const { cartIndex } = e.currentTarget.dataset;
      const { id, goodsId, selectedSkuIndex } = this.data.cartList[cartIndex];
      baseService.editCart(id, goodsId, selectedSkuIndex, e.detail, () => {
        this.setData(
          {
            [`cartList[${cartIndex}].number`]: e.detail
          },
          () => {
            this.acount();
          }
        );
      });
    },
  
    deleteGoodsList() {
      this.data.selectedCount &&
        wx.showModal({
          title: "提示",
          content: "确定删除这些商品吗？",
          showCancel: true,
          success: res => {
            if (res.confirm) {
              baseService.deleteCartList(this.selectedCartIdArr, () => {
                this.init();
              });
            }
          }
        });
    },
  
    async deleteNewYearGoods(e) {
      const { id, index } = e.currentTarget.dataset;
      const { position, instance } = e.detail;
      if (position === "right") {
        wx.showModal({
          title: "提示",
          content: "确定删除该商品吗？",
          showCancel: true,
          success: res => {
            if (res.confirm) {
              baseService.deleteCartList([id], () => {
                const newYearCartList = this.data.newYearCartList;
                newYearCartList.splice(index, 1);
                this.setData({ newYearCartList });
                this.init();
                this.acount();
                instance.close();
              });
            } else {
              instance.close();
            }
          }
        });
      }
    },
  
    async deleteGoods(e) {
      const { id, index } = e.currentTarget.dataset;
      const { position, instance } = e.detail;
      if (position === "right") {
        wx.showModal({
          title: "提示",
          content: "确定删除该商品吗？",
          showCancel: true,
          success: res => {
            if (res.confirm) {
              baseService.deleteCartList([id], () => {
                const cartList = this.data.cartList;
                cartList.splice(index, 1);
                this.setData({ cartList });
                this.init();
                this.acount();
                instance.close();
              });
            } else {
              instance.close();
            }
          }
        });
      }
    },
  
    async showSpecPopup(e) {
      const { info: cartInfo, cartIndex, goodsIndex } = e.currentTarget.dataset;
      const goodsInfo = await baseService.getGoodsInfo(cartInfo.goodsId);
      this.setData({
        cartInfo,
        goodsInfo,
        specPopupVisible: true
      });
      this.editingCartIndex = cartIndex;
      this.editingGoodsIndex = goodsIndex;
    },
  
    editSpecSuccess(e) {
      const curCartInfo = this.data.cartList[this.editingCartIndex];
      this.setData(
        {
          [`cartList[${this.editingCartIndex}]`]: {
            ...curCartInfo,
            ...e.detail.cartInfo
          },
          specPopupVisible: false
        },
        () => {
          this.acount();
        }
      );
    },
  
    hideSpecPopup() {
      this.setData({ specPopupVisible: false });
    },
  
    toggleDeleteBtnVisible() {
      this.setData({
        deleteBtnVisible: !this.data.deleteBtnVisible
      });
    },
  
    acount() {
      this.totalCount = 0;
      let selectedCount = 0;
      let totalPrice = 0;
      this.selectedCartIdArr = [];
  
      const { newYearCartList, cartList, deleteBtnVisible } = this.data;
  
      if (deleteBtnVisible) {
        newYearCartList.forEach(item => {
          if (item.checked) {
            this.selectedCartIdArr.push(item.id);
            selectedCount += item.number;
          }
          this.totalCount += item.number;
        });
        cartList.forEach(item => {
          if (item.checked) {
            this.selectedCartIdArr.push(item.id);
            selectedCount += item.number;
          }
          this.totalCount += item.number;
        });
        this.setData({
          selectedCount,
          isSelectAll: selectedCount && selectedCount === this.totalCount
        });
      } else {
        newYearCartList.forEach(item => {
          if (item.status === 1 && item.checked) {
            this.selectedCartIdArr.push(item.id);
            selectedCount += item.number;
            totalPrice += item.number * item.price;
          }
          this.totalCount += item.number;
        });
        cartList.forEach(item => {
          if (item.status === 1 && item.checked) {
            this.selectedCartIdArr.push(item.id);
            selectedCount += item.number;
            totalPrice += item.number * item.price;
          }
          this.totalCount += item.number;
        });
        this.setData({
          selectedCount,
          totalPrice,
          isSelectAll: selectedCount && selectedCount === this.totalCount
        });
      }
    },
  
    submit() {
      if (this.data.selectedCount) {
        wx.navigateTo({
          url: `/pages/home/subpages/order-check/index?cartGoodsIds=${JSON.stringify(
            this.selectedCartIdArr
          )}`
        });
      }
    },
  
    onReachBottom() {
      this.setRecommendGoodsList();
    },
  
    onPullDownRefresh() {
      this.init();
      wx.stopPullDownRefresh();
    },
  
    showGoodsDetail(e) {
      wx.navigateTo({
        url: `/pages/home/subpages/goods-detail/index?id=${e.currentTarget.dataset.id}`
      });
    },
  
    catchtap() {}
  },
});
