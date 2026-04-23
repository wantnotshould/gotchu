// pages/create/create.js
const STORAGE_KEY = 'LOCAL_TOTP_LIST';

Page({
  data: {
    label: '',
    issuer: '',
    secret: '',
    algorithm: 1, // 1:SHA1, 2:SHA256, 3:SHA512
    digits: 6,
    period: 30,
    algoRange: ['SHA1', 'SHA256', 'SHA512']
  },

  // 输入框双向绑定助手
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  // 改变算法选择
  onAlgoChange(e) {
    this.setData({ algorithm: Number(e.detail.value) + 1 });
  },

  /**
   * 改变周期选择
   */
  onPeriodChange(e) {
    const periods = [30, 60];
    this.setData({
      period: periods[Number(e.detail.value)]
    });
  },

  /**
   * 扫描二维码
   */
  async onScanCode() {
    try {
      const res = await wx.scanCode({ scanType: ['qrCode'] });
      this.parseOtpAuth(res.result);
    } catch (err) {
      console.log('用户取消扫码或扫码失败', err);
    }
  },

  /**
   * 解析 otpauth:// 协议字符串
   * 格式示例: otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
   */
  parseOtpAuth(url) {
    if (!url || !url.startsWith('otpauth://totp/')) {
      wx.showToast({ title: '无效的二维码', icon: 'none' });
      return;
    }

    try {
      const uri = url.split('?')[0];
      const params = url.split('?')[1].split('&');

      // 解析 label (通常在 /totp/ 后面)
      let label = decodeURIComponent(uri.replace('otpauth://totp/', ''));

      const config = {};
      params.forEach(p => {
        const [key, value] = p.split('=');
        config[key.toLowerCase()] = decodeURIComponent(value);
      });

      // 如果 label 包含冒号，拆分出 issuer
      if (label.includes(':')) {
        const parts = label.split(':');
        config.issuer = config.issuer || parts[0].trim();
        label = parts[1].trim();
      }

      this.setData({
        label: label || config.issuer || '',
        issuer: config.issuer || '',
        secret: config.secret || '',
        digits: Number(config.digits) || 6,
        period: Number(config.period) || 30,
        algorithm: config.algorithm === 'SHA256' ? 2 : (config.algorithm === 'SHA512' ? 3 : 1)
      });

      wx.showToast({ title: '解析成功', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '解析协议失败', icon: 'none' });
    }
  },

  /**
   * 保存到本地缓存
   */
  saveItem() {
    const { label, secret, issuer, algorithm, digits, period } = this.data;

    if (!secret || !label) {
      wx.showToast({ title: '请填写名称和密钥', icon: 'none' });
      return;
    }

    // 获取现有数据
    const list = wx.getStorageSync(STORAGE_KEY) || [];

    // 构造新对象
    const newItem = {
      id: Date.now().toString(), // 简单唯一ID
      label,
      issuer,
      secret: secret.replace(/\s/g, ''), // 去除空格
      algorithm: Number(algorithm),
      digits: Number(digits),
      period: Number(period),
      createTime: Date.now()
    };

    // 写入缓存并返回
    list.unshift(newItem);
    try {
      wx.setStorageSync(STORAGE_KEY, list);
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1000,
        success: () => {
          setTimeout(() => wx.navigateBack(), 1000);
        }
      });
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});