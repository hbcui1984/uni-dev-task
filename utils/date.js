/**
 * 日期格式化工具函数
 */

/**
 * 数字补零
 * @param {number} num
 * @returns {string}
 */
function padZero(num) {
	return num < 10 ? `0${num}` : `${num}`
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|number|string} date
 * @returns {string}
 */
export function formatDate(date) {
	if (!date) return ''
	const d = new Date(date)
	const year = d.getFullYear()
	const month = padZero(d.getMonth() + 1)
	const day = padZero(d.getDate())
	return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 * @param {Date|number|string} date
 * @returns {string}
 */
export function formatDateTime(date) {
	if (!date) return ''
	const d = new Date(date)
	const year = d.getFullYear()
	const month = padZero(d.getMonth() + 1)
	const day = padZero(d.getDate())
	const hours = padZero(d.getHours())
	const minutes = padZero(d.getMinutes())
	return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 格式化为中文日期 M月D日
 * @param {Date|number|string} date
 * @returns {string}
 */
export function formatDateCN(date) {
	if (!date) return ''
	const d = new Date(date)
	return `${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * 格式化为中文日期时间 M月D日 HH:mm
 * @param {Date|number|string} date
 * @returns {string}
 */
export function formatDateTimeCN(date) {
	if (!date) return ''
	const d = new Date(date)
	const month = d.getMonth() + 1
	const day = d.getDate()
	const hours = padZero(d.getHours())
	const minutes = padZero(d.getMinutes())
	return `${month}月${day}日 ${hours}:${minutes}`
}

/**
 * 格式化为时间 HH:mm
 * @param {Date|number|string} date
 * @returns {string}
 */
export function formatTime(date) {
	if (!date) return ''
	const d = new Date(date)
	const hours = padZero(d.getHours())
	const minutes = padZero(d.getMinutes())
	return `${hours}:${minutes}`
}

/**
 * 格式化为友好的日期标签（今天、昨天、周X、M月D日、YYYY年M月D日）
 * @param {string} dateStr - YYYY-MM-DD 格式的日期字符串
 * @returns {string}
 */
export function formatDateLabel(dateStr) {
	if (!dateStr) return ''
	const date = new Date(dateStr)
	const today = new Date()
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)

	const todayStr = today.toISOString().split('T')[0]
	const yesterdayStr = yesterday.toISOString().split('T')[0]

	if (dateStr === todayStr) {
		return '今天'
	} else if (dateStr === yesterdayStr) {
		return '昨天'
	} else {
		// 判断是否本周
		const weekAgo = new Date(today)
		weekAgo.setDate(weekAgo.getDate() - 7)
		if (date > weekAgo) {
			const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
			return days[date.getDay()]
		}

		// 判断是否今年
		if (date.getFullYear() === today.getFullYear()) {
			return `${date.getMonth() + 1}月${date.getDate()}日`
		}

		return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
	}
}

export default {
	formatDate,
	formatDateTime,
	formatDateCN,
	formatDateTimeCN,
	formatTime,
	formatDateLabel
}
