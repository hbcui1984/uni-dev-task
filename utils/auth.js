/**
 * 用户认证相关工具函数
 */

const USER_INFO_KEY = 'uni-id-pages-userInfo'

/**
 * 获取当前用户信息
 * @returns {Object} 用户信息对象，包含 _id, nickname 等字段
 */
export function getCurrentUser() {
	return uni.getStorageSync(USER_INFO_KEY) || {}
}

/**
 * 获取当前用户ID
 * @returns {string} 用户ID，未登录返回空字符串
 */
export function getCurrentUserId() {
	const userInfo = getCurrentUser()
	return userInfo._id || ''
}

/**
 * 获取当前用户昵称
 * @returns {string} 用户昵称
 */
export function getCurrentUserNickname() {
	const userInfo = getCurrentUser()
	return userInfo.nickname || ''
}

/**
 * 判断用户是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
	return !!getCurrentUserId()
}

/**
 * 检查当前用户是否是指定项目的管理员
 * @param {Array} managers 项目管理员ID数组
 * @returns {boolean}
 */
export function isProjectManager(managers) {
	if (!managers || !Array.isArray(managers)) {
		return false
	}
	const userId = getCurrentUserId()
	return userId && managers.includes(userId)
}

export default {
	getCurrentUser,
	getCurrentUserId,
	getCurrentUserNickname,
	isLoggedIn,
	isProjectManager
}
