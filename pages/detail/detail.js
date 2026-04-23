// pages/detail/detail.js
const STORAGE_KEY = 'LOCAL_TOTP_LIST';

Page({
  data: {
    id: '',
    item: null,
    showSecret: false, // 是否显示明文密钥
    algoRange: ['SHA1', 'SHA256', 'SHA512']
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.getItemDetail(options.id);
    }
  },

  /**
   * 获取详情
   */
  getItemDetail(id) {
    const list = wx.getStorageSync(STORAGE_KEY) || [];
    const item = list.find(i => i.id === id);
    if (item) {
      this.setData({ item });
    } else {
      wx.showToast({ title: '项目不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  /**
   * 切换密钥显示状态
   */
  toggleSecret() {
    this.setData({ showSecret: !this.data.showSecret });
  },

  /**
   * 输入框双向绑定
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`item.${field}`]: e.detail.value
    });
  },

  /**
   * 更新数据并保存
   */
  saveUpdate() {
    const { item } = this.data;
    if (!item.label || !item.secret) {
      wx.showToast({ title: '名称和密钥不能为空', icon: 'none' });
      return;
    }

    let list = wx.getStorageSync(STORAGE_KEY) || [];
    const index = list.findIndex(i => i.id === item.id);

    if (index !== -1) {
      list[index] = { ...item, secret: item.secret.replace(/\s/g, '') };
      try {
        wx.setStorageSync(STORAGE_KEY, list);
        wx.showToast({
          title: '修改成功',
          icon: 'success',
          success: () => {
            setTimeout(() => wx.navigateBack(), 1000);
          }
        });
      } catch (e) {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  },

  /**
   * 删除当前项
   */
  deleteItem() {
    wx.showModal({
      title: '删除确认',
      content: '确定要永久删除这个验证码吗？',
      success: (res) => {
        if (res.confirm) {
          let list = wx.getStorageSync(STORAGE_KEY) || [];
          list = list.filter(i => i.id !== this.data.id);
          wx.setStorageSync(STORAGE_KEY, list);
          wx.navigateBack();
        }
      }
    });
  }
});