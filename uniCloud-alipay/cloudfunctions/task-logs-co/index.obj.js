/**
 * task-logs-co 云对象
 *
 * 功能说明：
 * - 任务操作日志管理
 * - 提供日志记录、查询功能
 * - 支持按项目、用户、任务维度查询日志
 *
 * 主要方法：
 * - getAllLogs: 获取所有动态（用于动态页面）
 * - addLog: 记录任务操作日志
 * - getTaskLogs: 获取指定任务的操作日志
 *
 * 权限说明：
 * - 所有接口需要登录（通过 _before 钩子验证 token）
 * - 日志查询仅返回用户有权限访问的项目数据
 *
 * @module task-logs-co
 * @see https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
 */
const uniIdCommon = require('uni-id-common')

async function buildNameMapByIds(db, collectionName, ids, fieldName, fallback = '') {
	const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)))
	if (!uniqueIds.length) {
		return {}
	}

	const res = await db.collection(collectionName)
		.where({
			_id: db.command.in(uniqueIds)
		})
		.field({
			_id: true,
			[fieldName]: true
		})
		.get()

	return (res.data || []).reduce((map, item) => {
		map[item._id] = item[fieldName] || fallback
		return map
	}, {})
}

async function enrichLogs(db, logs, includeProjectName = true) {
	const list = logs || []
	if (!list.length) {
		return []
	}

	const userMap = await buildNameMapByIds(db, 'uni-id-users', list.map(item => item.user_id), 'nickname', '未知用户')
	let projectMap = {}

	if (includeProjectName) {
		projectMap = await buildNameMapByIds(db, 'opendb-projects', list.map(item => item.project_id), 'name', '未知项目')
	}

	return list.map(item => ({
		...item,
		user_nickname: userMap[item.user_id] || '未知用户',
		...(includeProjectName ? {
			project_name: projectMap[item.project_id] || '未知项目'
		} : {})
	}))
}

module.exports = {
	/**
	 * 前置钩子 - 验证用户登录状态
	 *
	 * 功能说明：
	 * - 验证客户端传递的 token 是否有效
	 * - 解析 token 获取用户 ID 存储到 this.userInfo
	 * - 初始化数据库连接
	 *
	 * @throws {Object} TOKEN_INVALID - token 缺失或无效
	 */
	_before: async function() {
		this.db = uniCloud.database()

		const clientInfo = this.getClientInfo()
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo
		})

		const token = this.getUniIdToken()
		if (!token) {
			throw {
				errCode: 'TOKEN_INVALID',
				errMsg: '缺少token'
			}
		}

		const payload = await this.uniIdCommon.checkToken(token)
		if (payload.errCode) {
			throw {
				errCode: payload.errCode,
				errMsg: payload.errMsg || '无效的token'
			}
		}

		this.userInfo = {
			uid: payload.uid
		}
	},

	/**
	 * 获取所有动态（用于动态页面）
	 * @param {Object} params 查询参数
	 * @param {String} [params.project_id] 项目ID（可选，筛选特定项目）
	 * @param {String} [params.user_id] 用户ID（可选，筛选特定用户）
	 * @param {Number} [params.page] 页码，默认1
	 * @param {Number} [params.page_size] 每页条数，默认20
	 */
	async getAllLogs(params = {}) {
		const db = this.db
		const dbCmd = db.command

		try {
			const projectRes = await db.collection('opendb-projects')
				.where(dbCmd.or([
					{ members: dbCmd.all([this.userInfo.uid]) },
					{ managers: dbCmd.all([this.userInfo.uid]) }
				]))
				.field({
					_id: true
				})
				.get()

			const projectIds = (projectRes.data || []).map(item => item._id)

			if (!projectIds.length) {
				return {
					code: 0,
					data: {
						list: [],
						total: 0,
						has_projects: false
					}
				}
			}

			const matchCondition = {
				project_id: dbCmd.in(projectIds)
			}

			if (params.project_id) {
				if (!projectIds.includes(params.project_id)) {
					return {
						code: 403,
						message: '无权访问该项目'
					}
				}
				matchCondition.project_id = params.project_id
			}

			if (params.user_id) {
				matchCondition.user_id = params.user_id
			}

			const page = parseInt(params.page, 10) || 1
			const pageSize = parseInt(params.page_size, 10) || 20
			const skip = (page - 1) * pageSize

			const collection = db.collection('opendb-task-logs')
			const queryResult = await collection.where(matchCondition)
				.field({
					_id: true,
					action_type: true,
					task_id: true,
					project_id: true,
					task_name: true,
					action_detail: true,
					create_time: true,
					user_id: true,
					extra_data: true
				})
				.orderBy('create_time', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get()

			const list = await enrichLogs(db, queryResult.data || [], true)
			const countResult = await collection.where(matchCondition).count()

			return {
				code: 0,
				data: {
					list,
					total: countResult.total,
					has_projects: true
				}
			}
		} catch (e) {
			console.error('获取动态列表失败:', e)
			return {
				code: -1,
				message: e.message || '获取动态列表失败'
			}
		}
	},

	/**
	 * 记录任务日志
	 * @param {Object} params 日志参数
	 * @param {String} params.action_type 动作类型：create, update, delete, complete
	 * @param {String} params.task_id 任务ID
	 * @param {String} params.project_id 项目ID
	 * @param {String} [params.task_name] 任务名称
	 * @param {String} params.action_detail 动作详情
	 * @param {Object} [params.extra_data] 额外数据
	 */
	async addLog(params = {}) {
		if (!params.action_type) {
			return {
				code: -1,
				message: 'action_type 不能为空'
			}
		}

		if (!params.task_id) {
			return {
				code: -1,
				message: 'task_id 不能为空'
			}
		}

		if (!params.project_id) {
			return {
				code: -1,
				message: 'project_id 不能为空'
			}
		}

		if (!params.action_detail) {
			return {
				code: -1,
				message: 'action_detail 不能为空'
			}
		}

		try {
			const logData = {
				action_type: params.action_type,
				task_id: params.task_id,
				project_id: params.project_id,
				task_name: params.task_name || '',
				user_id: this.userInfo.uid,
				action_detail: params.action_detail,
				extra_data: params.extra_data || {},
				create_time: Date.now()
			}

			const res = await this.db.collection('opendb-task-logs').add(logData)

			return {
				code: 0,
				data: {
					id: res.id
				}
			}
		} catch (e) {
			console.error('添加日志失败:', e)
			return {
				code: -1,
				message: e.message || '添加日志失败'
			}
		}
	},

	/**
	 * 获取任务的操作日志
	 * @param {Object} params 查询参数
	 * @param {String} params.task_id 任务ID
	 * @param {Number} [params.page] 页码
	 * @param {Number} [params.page_size] 每页条数
	 */
	async getTaskLogs(params = {}) {
		if (!params.task_id) {
			return {
				code: -1,
				message: 'task_id 不能为空'
			}
		}

		const db = this.db

		try {
			const page = parseInt(params.page, 10) || 1
			const pageSize = parseInt(params.page_size, 10) || 20
			const skip = (page - 1) * pageSize

			const collection = db.collection('opendb-task-logs')
			const result = await collection.where({
				task_id: params.task_id
			})
				.field({
					_id: true,
					action_type: true,
					action_detail: true,
					create_time: true,
					user_id: true,
					extra_data: true,
					task_id: true,
					project_id: true,
					task_name: true
				})
				.orderBy('create_time', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get()

			const list = await enrichLogs(db, result.data || [], false)
			const countResult = await collection.where({
				task_id: params.task_id
			}).count()

			return {
				code: 0,
				data: {
					list,
					total: countResult.total
				}
			}
		} catch (e) {
			console.error('获取任务日志失败:', e)
			return {
				code: -1,
				message: e.message || '获取任务日志失败'
			}
		}
	}
}
