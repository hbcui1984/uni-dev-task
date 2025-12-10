/**
 * 响应式布局工具函数
 */

// 屏幕宽度断点常量
export const BREAKPOINTS = {
	MOBILE: 768,    // 移动端
	TABLET: 800,    // 平板/窄屏PC
	DESKTOP: 1200   // 宽屏PC
}

/**
 * 获取当前屏幕宽度
 * @returns {number} 屏幕宽度（像素）
 */
export function getWindowWidth() {
	const systemInfo = uni.getSystemInfoSync()
	return systemInfo.windowWidth
}

/**
 * 判断是否为宽屏（>=800px）
 * 适用于 PC 端与移动端布局切换
 * @returns {boolean}
 */
export function isWideScreen() {
	return getWindowWidth() >= BREAKPOINTS.TABLET
}

/**
 * 判断是否为移动端（<768px）
 * @returns {boolean}
 */
export function isMobile() {
	return getWindowWidth() < BREAKPOINTS.MOBILE
}

/**
 * 判断是否为桌面端（>=1200px）
 * @returns {boolean}
 */
export function isDesktop() {
	return getWindowWidth() >= BREAKPOINTS.DESKTOP
}

/**
 * 创建响应式计算属性 mixin
 * 可在组件中使用 mixins: [responsiveMixin] 引入
 */
export const responsiveMixin = {
	computed: {
		isWideScreen() {
			return isWideScreen()
		},
		isMobile() {
			return isMobile()
		},
		isDesktop() {
			return isDesktop()
		}
	}
}

export default {
	BREAKPOINTS,
	getWindowWidth,
	isWideScreen,
	isMobile,
	isDesktop,
	responsiveMixin
}
