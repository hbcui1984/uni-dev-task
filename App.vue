<script>
	import {
		mapActions,
		mapMutations
	} from 'vuex'
	import {
		version
	} from './package.json'
	import {
		uniAdminCacheKey
	} from './store/constants.js'
	import uploadFileForExtStorage from "@/js_sdk/ext-storage/uploadFileForExtStorage.js"
	export default {
		created() {
			this.clear = undefined
		},
		methods: {
			...mapMutations('app', ['SET_THEME']),
			...mapActions({
				init: 'app/init'
			}),
			clearPlatform() {
				const keysOfPlatform = uni.getStorageInfoSync().keys.filter(key => key.indexOf('platform') > -1)
				keysOfPlatform.length && keysOfPlatform.forEach(key => uni.removeStorageSync(key))
			}
		},
		onPageNotFound(msg) {
			uni.redirectTo({
				url: '/pages/error/404'
			})
		},
		onLaunch: function() {
			// #ifdef H5
			console.log(
				`%c uni-task %c v${version} `,
				'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
				'background:#42b983 ;padding: 1px; border-radius: 0 3px 3px 0;  color: #fff; font-weight: bold;'
			)
			// #endif
			// #ifdef H5
			// 此处为强制用户必须登录才能访问其他页面，如果需要部分页面不登录也能访问，需要在此过滤这些页面不执行下面的代码或直接注释掉此代码
			// let uni_id_token_expired = uni.getStorageSync("uni_id_token_expired");
			// if (!uni_id_token_expired || uni_id_token_expired < Date.now()) {
			// 	uni.reLaunch({
			// 		url: config.login.url
			// 	})
			// }
			// #endif
			// 线上示例使用
			// console.log('%c uni-app官方团队诚邀优秀前端工程师加盟，一起打造更卓越的uni-app & uniCloud，欢迎投递简历到 hr2013@dcloud.io', 'color: red');
			console.log('App Launch')
			if (this.$uniIdPagesStore.store.hasLogin) {
				this.init()
			}

			// 登录成功回调
			uni.$on('uni-id-pages-login-success', () => {
				this.init()
			})

			// theme
			this.SET_THEME(uni.getStorageSync(uniAdminCacheKey.theme) || 'default')

			// 设置 uniCloud.uploadFile 默认上传的云存储供应商
			uploadFileForExtStorage.init({
				provider: "unicloud", // provider代表默认上传到哪，可选项 "unicloud" 内置存储; "extStorage" 扩展存储;
				domain: "cdn.example.com", //【重要】这里需要改成你开通扩展存储时绑定的自定义域名）
				fileID2fileURL: true, // 将fileID转成fileURL，方便兼容老项目
				// 获取上传参数的函数
				uploadFileOptions: async (event) => {
					// ext-storage-co 是你自己写的云对象，参考代码：https://doc.dcloud.net.cn/uniCloud/ext-storage/dev.html#getuploadfileoptions
					const uniCloudStorageExtCo = uniCloud.importObject("ext-storage-co");
					return await uniCloudStorageExtCo.getUploadFileOptions(event);
				}
			});
		},
		onShow: function() {
			console.log('App Show')
			this.clear = setInterval(() => this.clearPlatform(), 15 * 60 * 1000)
		},
		onHide: function() {
			console.log('App Hide')
			this.clear && clearInterval(this.clear)
		}
	}
</script>

<style lang="scss">
	@import '@/common/uni.css';
	@import '@/common/theme.scss';
	@import '@/common/global.scss';
	@import '@/common/uni-task.css';

	/* 全局按钮绿色主题 */
	button[type="primary"] {
		background-color: #42b983 !important;
		border-color: #42b983 !important;
		color: #ffffff !important;
	}

	button[type="primary"]:hover {
		background-color: #359568 !important;
		box-shadow: 0 4px 14px rgba(66, 185, 131, 0.3) !important;
		transform: translateY(-2px) !important;
	}

	button[type="primary"]:active {
		background-color: #2a7a53 !important;
		transform: translateY(0) !important;
	}

	button[type="primary"][plain] {
		background-color: transparent !important;
		color: #42b983 !important;
		border: 1px solid #42b983 !important;
	}

	button[type="primary"][plain]:hover {
		background-color: #f0fdf7 !important;
		border-color: #359568 !important;
		color: #359568 !important;
	}

	/* 默认按钮样式优化 */
	button[type="default"] {
		transition: all 0.25s ease !important;
	}

	button[type="default"]:hover {
		background-color: #f0fdf7 !important;
		border-color: #42b983 !important;
		color: #42b983 !important;
	}

	/* ===== 全局主题色覆盖（将蓝色改为绿色） ===== */

	/* Picker 选择器 */
	.uni-picker-container .uni-picker-highlight,
	.uni-picker__container .uni-picker__highlight {
		border-color: rgba(66, 185, 131, 0.3) !important;
	}

	.uni-picker-view-indicator {
		border-color: rgba(66, 185, 131, 0.3) !important;
	}

	.uni-picker-action-confirm,
	.uni-picker__action-confirm,
	.uni-system-choose-area a:last-child,
	.uni-picker-action.uni-picker-action-confirm {
		color: #42b983 !important;
	}

	.uni-picker-item-selected,
	.picker-item-selected {
		color: #42b983 !important;
	}

	.uni-picker-view-wrapper .uni-picker-view-indicator {
		border-color: rgba(66, 185, 131, 0.2) !important;
	}

	/* uni-data-select 下拉选中项 */
	.uni-stat-select-item-active,
	.uni-select__selector-item.active,
	.uni-select__selector-item:hover {
		color: #42b983 !important;
		background-color: #f0fdf7 !important;
	}

	/* uni-data-picker 选中项样式 */
	.uni-data-pickerview .selected-item-active {
		border-bottom-color: #42b983 !important;
	}

	.uni-data-pickerview .selected-item-text {
		color: #42b983 !important;
	}

	.uni-data-pickerview .check {
		border-color: #42b983 !important;
	}

	.uni-data-pickerview .item:hover {
		background-color: #f0fdf7 !important;
	}

	.uni-data-pickerview .item.active,
	.uni-data-pickerview .item.selected {
		background-color: #f0fdf7 !important;
		color: #42b983 !important;
	}

	/* uni-datetime-picker 日期选择器 */
	.uni-datetime-picker .uni-date-changed,
	.uni-datetime-picker .uni-date-btn--ok {
		color: #42b983 !important;
	}

	.uni-calendar-item--checked,
	.uni-calendar-item--isDay {
		background-color: #42b983 !important;
	}

	.uni-datetime-picker-btn-text {
		color: #42b983 !important;
	}

	/* uni-data-checkbox 复选框 */
	.uni-data-checkbox .checklist-box.is--checked {
		border-color: #42b983 !important;
	}

	.uni-data-checkbox .checklist-box.is--checked .checkbox__inner {
		background-color: #42b983 !important;
		border-color: #42b983 !important;
	}

	.uni-data-checkbox .checklist-text.is--checked {
		color: #42b983 !important;
	}

	/* 原生 checkbox 组件统一为 Vue 绿 */
	checkbox {
		--HOVER-BD-COLOR: #359568 !important;
	}

	checkbox .uni-checkbox-input {
		border-color: #42b983 !important;
		border-width: 2px !important;
		transition: all 0.2s ease;
	}

	checkbox .uni-checkbox-input:hover {
		border-color: #359568 !important;
		background-color: #e6fcf5 !important;
	}

	checkbox .uni-checkbox-input.uni-checkbox-input-checked {
		background-color: #42b983 !important;
		border-color: #42b983 !important;
	}

	checkbox .uni-checkbox-input.uni-checkbox-input-checked:hover {
		background-color: #359568 !important;
		border-color: #359568 !important;
	}

	/* checkbox 对勾颜色 */
	checkbox .uni-checkbox-input svg {
		color: #42b983 !important;
		fill: #42b983 !important;
	}

	checkbox .uni-checkbox-input.uni-checkbox-input-checked svg {
		color: #fff !important;
		fill: #fff !important;
	}

	/* radio 组件统一为 Vue 绿 */
	radio {
		--HOVER-BD-COLOR: #359568 !important;
	}

	radio .uni-radio-input {
		border-color: #42b983 !important;
		border-width: 2px !important;
	}

	radio .uni-radio-input:hover {
		border-color: #359568 !important;
		background-color: #e6fcf5 !important;
	}

	radio .uni-radio-input.uni-radio-input-checked {
		background-color: #42b983 !important;
		border-color: #42b983 !important;
	}

	/* switch 组件统一为 Vue 绿 */
	switch .uni-switch-input.uni-switch-input-checked,
	uni-switch .uni-switch-input.uni-switch-input-checked {
		background-color: #42b983 !important;
		border-color: #42b983 !important;
	}

	switch .uni-checkbox-input svg,
	uni-switch .uni-checkbox-input svg {
		color: #42b983 !important;
		fill: #42b983 !important;
	}

	/* 进度条 */
	.uni-progress-bar {
		background-color: #42b983 !important;
	}

	/* 滑块 */
	slider .uni-slider-handle-wrapper .uni-slider-handle,
	uni-slider .uni-slider-handle-wrapper .uni-slider-handle {
		background-color: #42b983 !important;
	}

	slider .uni-slider-track,
	uni-slider .uni-slider-track {
		background-color: #42b983 !important;
	}

	/* uni-popup 弹窗 */
	.uni-popup-dialog__btn--default-confirm,
	.uni-popup__btn--primary {
		color: #42b983 !important;
	}

	/* 链接文字颜色 */
	.uni-link,
	a.uni-link {
		color: #42b983 !important;
	}

	/* 通用选中状态 */
	.is-checked,
	.is-active,
	.is-selected {
		color: #42b983 !important;
		border-color: #42b983 !important;
	}

	/* ===== H5 原生 picker 组件样式 ===== */
	/* picker 选中行高亮文字颜色 */
	.uni-picker-view-content .uni-picker-view-mask-bottom,
	.uni-picker-view-content .uni-picker-view-mask-top {
		background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4)) !important;
	}

	/* picker-view 选中指示器 */
	uni-picker-view .uni-picker-view-indicator,
	.uni-picker-view-indicator {
		border-top-color: rgba(66, 185, 131, 0.3) !important;
		border-bottom-color: rgba(66, 185, 131, 0.3) !important;
	}

	/* picker 弹窗中选中项的文字颜色 */
	uni-picker-view-column .uni-picker-view-column {
		color: #333 !important;
	}

	/* H5 picker 选择器选中项 */
	.uni-system-picker-wrapper .uni-system-picker-item.selected,
	.uni-picker__wrapper .uni-picker__item.selected,
	.uni-picker-view-column .selected {
		color: #42b983 !important;
	}

	/* 系统 picker 确认按钮 */
	.uni-system-picker-action-btn,
	.uni-picker-action-confirm,
	.uni-picker__action-confirm,
	.uni-system-picker-action .confirm {
		color: #42b983 !important;
	}

	/* uni-app H5 picker 弹窗样式 */
	uni-picker .uni-picker-action-confirm,
	uni-picker .uni-picker-action.uni-picker-action-confirm {
		color: #42b983 !important;
	}

	/* picker-view 中当前选中项 */
	uni-picker-view-column > div > div[style*="color"],
	.uni-picker-view-column > div > div {
		color: inherit !important;
	}

	/* 选中行的样式 - 通过 indicator 区域内的文字变色 */
	.uni-picker-view-wrapper .uni-picker-view-group .uni-picker-view-content > div {
		transition: color 0.2s;
	}
</style>