/**
 * 任务相关工具函数
 */

/**
 * 优先级映射
 */
export const PRIORITY_MAP = {
	0: '较低',
	1: '普通',
	2: '较高',
	3: '最高'
}

/**
 * 优先级选项（用于下拉框等）
 */
export const PRIORITY_OPTIONS = [
	{ value: 0, text: '较低' },
	{ value: 1, text: '普通' },
	{ value: 2, text: '较高' },
	{ value: 3, text: '最高' }
]

/**
 * 任务状态映射
 */
export const STATUS_MAP = {
	0: '未开始',
	1: '进行中',
	2: '已完成'
}

/**
 * 获取优先级文本
 * @param {number} priority 优先级值
 * @returns {string}
 */
export function getPriorityText(priority) {
	return PRIORITY_MAP[priority] || '普通'
}

/**
 * 获取状态文本
 * @param {number} status 状态值
 * @returns {string}
 */
export function getStatusText(status) {
	return STATUS_MAP[status] || '未开始'
}

/**
 * 格式化截止日期为友好文本
 * @param {Date|number|string} deadline 截止日期
 * @returns {string}
 */
export function formatDeadline(deadline) {
	if (!deadline) return ''
	const date = new Date(deadline)
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const target = new Date(date)
	target.setHours(0, 0, 0, 0)

	const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24))

	if (diffDays < 0) return `已逾期${Math.abs(diffDays)}天`
	if (diffDays === 0) return '今天'
	if (diffDays === 1) return '明天'
	if (diffDays <= 7) return `${diffDays}天后`

	// 超过7天显示具体日期
	const month = date.getMonth() + 1
	const day = date.getDate()
	if (date.getFullYear() === today.getFullYear()) {
		return `${month}月${day}日`
	}
	return `${date.getFullYear()}年${month}月${day}日`
}

/**
 * 判断任务是否已逾期
 * @param {Date|number|string} deadline 截止日期
 * @returns {boolean}
 */
export function isOverdue(deadline) {
	if (!deadline) return false
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const target = new Date(deadline)
	target.setHours(0, 0, 0, 0)
	return target < today
}

/**
 * 根据名字生成头像背景颜色
 * @param {string} name 名字
 * @returns {string} 颜色值
 */
export function getAvatarColor(name) {
	if (!name) return '#42b983'
	const colors = [
		'#f56a00', '#7265e6', '#ffbf00', '#00a2ae',
		'#87d068', '#108ee9', '#722ed1', '#eb2f96'
	]
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash)
	}
	return colors[Math.abs(hash) % colors.length]
}

/**
 * 获取头像显示文本（取名字第一个字符）
 * @param {string} name 名字
 * @returns {string}
 */
export function getAvatarText(name) {
	if (!name) return '?'
	return name.substring(0, 1).toUpperCase()
}

export default {
	PRIORITY_MAP,
	PRIORITY_OPTIONS,
	STATUS_MAP,
	getPriorityText,
	getStatusText,
	formatDeadline,
	isOverdue,
	getAvatarColor,
	getAvatarText
}
