// index.js
import TOTP from '../../utils/totp.js';

// const code = TOTP.generate('JBSWY3DPEHPK3PXP', 1, 6, 30);
// const remain = TOTP.getRemainingSeconds(30);
// console.log(`验证码：${code}，剩余：${remain}s`);

const STORAGE_KEY = 'LOCAL_TOTP_LIST';

Page({
	data: {
		loading: false,
		totpList: [],    // 存储在本地的原始数据
		displayList: []  // 渲染层数据
	},

	onShow() {
		this.loadLocalData();
		this.startCountdown();
	},

	onHide() {
		this.clearCountdown();
	},

	onUnload() {
		this.clearCountdown();
	},

	loadLocalData() {
		this.setData({ loading: true });
		try {
			const list = wx.getStorageSync(STORAGE_KEY) || [];
			this.setData({
				totpList: list
			}, () => {
				this.updateDisplayList();
			});
		} catch (e) {
			wx.showToast({ title: '读取本地数据失败', icon: 'none' });
		} finally {
			this.setData({ loading: false });
			wx.stopPullDownRefresh();
		}
	},

	updateDisplayList() {
		const { totpList } = this.data;
		if (!totpList || totpList.length === 0) {
			this.setData({ displayList: [] });
			return;
		}

		try {
			const displayList = totpList.map(item => {
				return {
					...item,
					code: item.secret ? TOTP.generate(item.secret, item.algorithm, item.digits, item.period) : '------',
					countdown: TOTP.getRemainingSeconds(item.period || 30)
				};
			});
			this.setData({ displayList });
		} catch (e) {
			console.error("计算TOTP失败", e);
		}
	},

	async deleteItem(id) {
		try {
			let list = wx.getStorageSync(STORAGE_KEY) || [];
			list = list.filter(item => item.id !== id);
			wx.setStorageSync(STORAGE_KEY, list);
			wx.showToast({ title: '已删除', icon: 'success' });
			this.loadLocalData();
		} catch (e) {
			wx.showToast({ title: '删除失败', icon: 'none' });
		}
	},

	startCountdown() {
		if (this.timer) return;
		this.timer = setInterval(() => this.updateDisplayList(), 1000);
	},

	clearCountdown() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	},

	onPullDownRefresh() {
		this.loadLocalData();
	},

	onItemTap(e) {
		const { id } = e.currentTarget.dataset;
		wx.navigateTo({
			url: `/pages/detail/detail?id=${id}`
		});
	},

	onItemLongPress(e) {
		const { id, label } = e.currentTarget.dataset;
		wx.showModal({
			title: '确认删除',
			content: `确定要删除 "${label || '此项目'}" 吗？`,
			success: (res) => {
				if (res.confirm) {
					this.deleteItem(id);
				}
			}
		});
	},

	onFabTap() {
		wx.navigateTo({
			url: `/pages/create/create`
		});
	}
});
