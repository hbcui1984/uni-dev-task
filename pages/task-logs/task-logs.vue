<!--
 * 项目动态页面
 *
 * 功能说明：
 * - 展示项目相关的操作动态记录
 * - 支持按项目、成员筛选动态
 * - 动态按日期分组显示
 * - 显示任务创建、完成、修改等操作记录
 * - 支持上拉加载更多
 *
 * 路由：/pages/task-logs/task-logs?project_id={projectId}
-->
<template>
	<view class="task-logs">
		<!-- 原生导航栏下的筛选胶囊 -->
		<view class="chip-filter-bar" v-if="hasProjects">
			<view
				class="filter-chip"
				:class="{ 'filter-chip--active': selectedProjectId }"
				@click="openProjectFilter"
			>
				<text class="filter-chip__text">{{ selectedProjectLabel }}</text>
				<uni-icons type="bottom" size="10" :color="selectedProjectId ? '#42b983' : '#6c757d'"></uni-icons>
			</view>
			<view
				class="filter-chip"
				:class="{ 'filter-chip--active': selectedMemberId }"
				@click="openMemberFilter"
			>
				<text class="filter-chip__text">{{ selectedMemberLabel }}</text>
				<uni-icons type="bottom" size="10" :color="selectedMemberId ? '#42b983' : '#6c757d'"></uni-icons>
			</view>
		</view>

		<!-- 动态列表 -->
		<uni-list class="logs-list">
			<!-- 加载中 -->
			<template v-if="loading && page === 1">
				<uni-list-item>
					<template v-slot:body>
						<view class="loading">加载中...</view>
					</template>
				</uni-list-item>
			</template>

			<!-- 暂无数据 -->
			<template v-else-if="logs.length === 0">
				<uni-list-item>
					<template v-slot:body>
						<view class="empty">
							<text v-if="!hasProjects">您还没有参与任何项目，无法查看动态</text>
							<text v-else>暂无动态</text>
						</view>
					</template>
				</uni-list-item>
			</template>

			<!-- 动态列表 -->
			<template v-else>
				<block v-for="(group, date) in groupedLogs" :key="date">
					<!-- 日期分割线 -->
					<view class="date-divider">
						<text class="date-text">{{formatDate(date)}}</text>
					</view>

					<!-- 当天的动态列表 -->
					<uni-list-item v-for="log in group" :key="log._id" clickable @click="goToTaskDetail(log)">
						<template v-slot:header>
							<view class="log-avatar">
								<uni-icons :type="getActionIcon(log.action_type)" size="18" color="#666"></uni-icons>
							</view>
						</template>
						<template v-slot:body>
							<view class="log-content">
								<view class="log-user">
									{{log.user_nickname || '未知用户'}}
								</view>
								<view class="log-detail" v-html="formatDetail(log.action_detail)"></view>
								<view class="log-project" v-if="!selectedProjectId">
									项目：{{log.project_name || '未知项目'}}
								</view>
								<view class="log-time">{{formatTime(log.create_time)}}</view>
							</view>
						</template>
					</uni-list-item>
				</block>
			</template>
		</uni-list>

		<!-- 加载更多（首次加载时不显示） -->
		<view class="load-more-wrapper" v-if="logs.length > 0" @click="loadMore">
			<uni-load-more :status="loadMoreStatus" :content-text="contentText" />
		</view>

		<!-- 筛选底部面板（项目/成员共用） -->
		<uni-popup ref="filter-picker" type="bottom" background-color="#fff">
			<view class="picker-panel">
				<view class="picker-header">
					<text class="picker-title">{{ pickerType === 'project' ? '筛选项目' : '筛选成员' }}</text>
					<view class="picker-close" @click="closeFilterPicker">
						<uni-icons type="closeempty" size="20" color="#999"></uni-icons>
					</view>
				</view>
				<scroll-view scroll-y class="picker-scroll">
					<view
						v-for="item in currentPickerOptions"
						:key="item.value"
						class="picker-item"
						:class="{ 'picker-item--selected': currentPickerValue === item.value }"
						@click="selectFilterOption(item)"
					>
						<text class="picker-item__text">{{ item.text }}</text>
						<uni-icons
							v-if="currentPickerValue === item.value"
							type="checkmarkempty"
							size="18"
							color="#42b983"
						></uni-icons>
					</view>
				</scroll-view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import { formatDateLabel, formatTime } from '@/utils/date.js'
	import { getCurrentUserId } from '@/utils/auth.js'

	export default {
		data() {
			return {
				// 筛选条件
				selectedProjectId: '',
				selectedMemberId: '',
				projectOptions: [],
				memberOptions: [],

				// 加载状态
				loading: false,
				loadMoreStatus: 'more',
				contentText: {
					contentdown: '上拉加载更多',
					contentrefresh: '加载中...',
					contentnomore: '没有更多数据了'
				},

				// 数据列表
				logs: [],
				total: 0,
				page: 1,
				pageSize: 20,

				// 是否有项目权限
				hasProjects: true,

				// 用户信息
				userId: '',

				// 筛选面板
				pickerType: 'project' // 'project' | 'member'
			}
		},
		computed: {
			selectedProjectLabel() {
				if (!this.selectedProjectId) return '全部项目'
				const option = this.projectOptions.find(p => p.value === this.selectedProjectId)
				return option ? option.text : '全部项目'
			},
			selectedMemberLabel() {
				if (!this.selectedMemberId) return '全部成员'
				const option = this.memberOptions.find(m => m.value === this.selectedMemberId)
				return option ? option.text : '全部成员'
			},
			currentPickerOptions() {
				return this.pickerType === 'project' ? this.projectOptions : this.memberOptions
			},
			currentPickerValue() {
				return this.pickerType === 'project' ? this.selectedProjectId : this.selectedMemberId
			},
			groupedLogs() {
				if (!this.logs || this.logs.length === 0) return {}

				// 按天分组
				return this.logs.reduce((groups, log) => {
					const date = new Date(log.create_time).toISOString().split('T')[0]
					if (!groups[date]) {
						groups[date] = []
					}
					groups[date].push(log)
					return groups
				}, {})
			}
		},
		onLoad(options) {
			// 获取用户ID
			this.userId = getCurrentUserId()

			// 如果传入了项目ID，设置为选中的项目
			if (options.project_id) {
				this.selectedProjectId = options.project_id
			}

			// 初始化数据
			this.init()
		},
		onShow() {
			// 通知顶部导航更新当前路径
			uni.$emit('routeChange')
		},
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			// 初始化
			async init() {
				await this.getProjects()
				await this.loadMembers()
				await this.loadLogs(true)
			},

			// 加载动态列表
			async loadLogs(clear = false) {
				if (this.loading) return

				// 如果是清空重新加载，重置页码
				if (clear) {
					this.page = 1
					this.logs = []
				}

				this.loading = true
				this.loadMoreStatus = 'loading'

				try {
					const taskLogsCo = uniCloud.importObject('task-logs-co', {
						customUI: true // 禁用自动 loading，使用页面自带的加载状态
					})
					const res = await taskLogsCo.getAllLogs({
						project_id: this.selectedProjectId || undefined,
						user_id: this.selectedMemberId || undefined,
						page: this.page,
						page_size: this.pageSize
					})

					if (res.code === 0) {
						const { list, total, has_projects } = res.data

						if (clear) {
							this.logs = list
						} else {
							this.logs = [...this.logs, ...list]
						}

						this.total = total
						this.hasProjects = has_projects

						// 更新加载更多状态
						if (this.logs.length >= total) {
							this.loadMoreStatus = 'noMore'
						} else {
							this.loadMoreStatus = 'more'
						}
					} else {
						uni.showToast({
							title: res.message || '加载失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('加载动态失败:', e)
					uni.showToast({
						title: '加载动态失败',
						icon: 'none'
					})
				} finally {
					this.loading = false
					uni.stopPullDownRefresh()
				}
			},

			// 获取项目列表
			async getProjects() {
				try {
					const db = uniCloud.database()
					const dbCmd = db.command
					const query = db.collection('opendb-projects')
						.where(dbCmd.or([
							{
								members: this.userId
							},
							{
								managers: this.userId
							}
						]))
						.field('_id,name')

					const { result } = await query.get()

					this.projectOptions = [{
							value: '',
							text: '全部项目'
						},
						...result.data.map(project => ({
							value: project._id,
							text: project.name
						}))
					]
				} catch (e) {
					console.error('获取项目列表失败:', e)
					uni.showToast({
						title: '获取项目列表失败',
						icon: 'none'
					})
				}
			},

			// 加载成员列表
			async loadMembers() {
				try {
					const db = uniCloud.database()
					const dbCmd = db.command

					// 获取有权限的项目ID列表
					const projectIds = this.projectOptions
						.filter(p => p.value !== '')
						.map(p => p.value)

					if (projectIds.length === 0) {
						this.memberOptions = [{ value: '', text: '全部成员' }]
						return
					}

					// 获取所有项目的成员
					const { result } = await db.collection('opendb-projects')
						.where({
							_id: dbCmd.in(projectIds)
						})
						.field('members,managers')
						.get()

					// 收集所有成员ID（去重）
					const memberIds = new Set()
					result.data.forEach(project => {
						const members = Array.isArray(project.members) ? project.members : []
						const managers = Array.isArray(project.managers) ? project.managers : []
						members.forEach(id => memberIds.add(id))
						managers.forEach(id => memberIds.add(id))
					})

					if (memberIds.size > 0) {
						// 获取成员详细信息
						const { result: usersResult } = await db.collection('uni-id-users')
							.where({
								_id: dbCmd.in([...memberIds])
							})
							.field('_id,nickname')
							.get()

						this.memberOptions = [
							{ value: '', text: '全部成员' },
							...usersResult.data.map(user => ({
								value: user._id,
								text: user.nickname || '未命名用户'
							}))
						]
					} else {
						this.memberOptions = [{ value: '', text: '全部成员' }]
					}
				} catch (e) {
					console.error('获取成员列表失败:', e)
					this.memberOptions = [{ value: '', text: '全部成员' }]
				}
			},

			// 项目筛选胶囊点击
			openProjectFilter() {
				this.pickerType = 'project'
				this.$refs['filter-picker'].open()
			},

			// 成员筛选胶囊点击
			openMemberFilter() {
				this.pickerType = 'member'
				this.$refs['filter-picker'].open()
			},

			// 选中筛选项
			selectFilterOption(item) {
				if (this.pickerType === 'project') {
					this.selectedProjectId = item.value
				} else {
					this.selectedMemberId = item.value
				}
				this.$refs['filter-picker'].close()
				this.loadLogs(true)
			},

			// 关闭筛选面板
			closeFilterPicker() {
				this.$refs['filter-picker'].close()
			},

			// 项目选择变更
			handleProjectChange(value) {
				this.selectedProjectId = value
				this.loadLogs(true)
			},

			// 成员选择变更
			handleMemberChange(value) {
				this.selectedMemberId = value
				this.loadLogs(true)
			},

			// 下拉刷新
			onPullDownRefresh() {
				this.loadLogs(true)
			},

			// 上拉加载更多
			loadMore() {
				if (this.loadMoreStatus !== 'noMore' && !this.loading) {
					this.page++
					this.loadLogs(false)
				}
			},

			// 格式化日期
			formatDate: formatDateLabel,

			// 格式化时间
			formatTime,

			// 获取动作图标
			getActionIcon(actionType) {
				const iconMap = {
					create: 'plusempty',
					update: 'compose',
					delete: 'trash',
					complete: 'checkmarkempty'
				}
				return iconMap[actionType] || 'info'
			},

			// 跳转到任务详情
			goToTaskDetail(log) {
				if (!log.task_id) {
					uni.showToast({
						title: '该任务已被删除',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: `/pages/opendb-task/detail?id=${log.task_id}&pid=${log.project_id}`
				})
			},

			// 格式化详情文本（处理换行）
			formatDetail(detail) {
				if (!detail) return ''
				// 将换行符转换为 <br>，并转义 HTML
				return detail
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/\n/g, '<br>')
			}
		}
	}
</script>

<style lang="scss">
	page {
		background: linear-gradient(to bottom, #fafdfb, #f7f8fa);
		min-height: 100vh;
	}

	.task-logs {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px;
		min-height: 100vh;
		box-sizing: border-box;

		@media screen and (max-width: 767px) {
			padding: 16px;
		}

		@media screen and (min-width: 768px) {
			padding: 32px 48px;
		}

		@media screen and (min-width: 1200px) {
			padding: 40px 64px;
		}

		.chip-filter-bar {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			margin-bottom: 12px;
			padding: 2px 0;
		}

		.filter-chip {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 6px 12px;
			border-radius: 16px;
			background-color: #f7f8fa;
			border: 1px solid #e9ecef;
			transition: all 0.2s ease;
		}

		.filter-chip:active {
			opacity: 0.75;
		}

		.filter-chip--active {
			background-color: #e6fcf5;
			border-color: #42b983;
		}

		.filter-chip__text {
			font-size: 13px;
			color: #6c757d;
			max-width: 90px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.filter-chip--active .filter-chip__text {
			color: #42b983;
		}

		.logs-list {
			background-color: #ffffff;
			border-radius: 12px;
			box-shadow: 0 2px 8px rgba(66, 185, 131, 0.08);
			overflow: hidden;

			@media screen and (min-width: 768px) {
				border-radius: 14px;
			}

			.loading,
			.empty {
				text-align: center;
				color: #adb5bd;
				padding: 48px 20px;
				font-size: 15px;
			}

			.date-divider {
				padding: 12px 20px;
				background: linear-gradient(135deg, #42b983 0%, #359568 100%);
				position: sticky;
				top: 0;
				z-index: 10;

				.date-text {
					font-size: 14px;
					font-weight: 600;
					color: #ffffff;
					letter-spacing: 0.5px;
				}

				@media screen and (min-width: 768px) {
					padding: 14px 24px;

					.date-text {
						font-size: 15px;
					}
				}
			}

			.log-content {
				.log-user {
					font-weight: 600;
					margin-bottom: 6px;
					color: #42b983;
					font-size: 15px;

					@media screen and (min-width: 768px) {
						font-size: 16px;
					}
				}

				.log-detail {
					color: #2c3e50;
					margin-bottom: 6px;
					line-height: 1.6;
					font-size: 14px;

					@media screen and (min-width: 768px) {
						font-size: 15px;
					}
				}

				.log-project {
					color: #6c757d;
					font-size: 13px;
					margin-bottom: 4px;

					@media screen and (min-width: 768px) {
						font-size: 14px;
					}
				}

				.log-time {
					color: #adb5bd;
					font-size: 12px;

					@media screen and (min-width: 768px) {
						font-size: 13px;
					}
				}
			}

			.log-avatar {
				width: 36px;
				height: 36px;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(135deg, #e6fcf5 0%, #d1f7e8 100%);
				border-radius: 50%;
				margin-right: 12px;

				@media screen and (min-width: 768px) {
					width: 40px;
					height: 40px;
					margin-right: 16px;
				}
			}
		}

		/* uni-load-more 优化 */
		.load-more-wrapper {
			cursor: pointer;
			padding: 16px 0;
		}
	}
</style>

<style lang="scss">
	/* ===== 筛选底部面板 ===== */
	.picker-panel {
		border-radius: 16px 16px 0 0;
		overflow: hidden;
		background-color: #fff;
	}

	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #f0f0f0;
	}

	.picker-title {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
	}

	.picker-close {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.picker-close:active {
		background-color: #f0f0f0;
	}

	.picker-scroll {
		max-height: 50vh;
	}

	.picker-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #f7f8fa;
	}

	.picker-item:active {
		background-color: #f7f8fa;
	}

	.picker-item--selected {
		background-color: #f0fdf7;
	}

	.picker-item__text {
		font-size: 15px;
		color: #2c3e50;
	}

	.picker-item--selected .picker-item__text {
		color: #42b983;
		font-weight: 500;
	}
	/* 确保下拉菜单在日期分隔线之上 */
	.task-logs .uni-select__selector {
		z-index: 100 !important;
	}

	/* 优化下拉框样式 */
	.task-logs .uni-stat__select {
		min-width: 100px !important;
		max-width: 200px !important;
	}

	/* uni-list-item 优化 */
	.task-logs .uni-list-item {
		transition: background-color 0.2s ease;
		border-bottom: 1px solid #e9ecef;
		cursor: pointer;
		background-color: #ffffff;
	}

	.task-logs .uni-list-item:last-child {
		border-bottom: none;
	}

	.task-logs .uni-list-item:hover {
		background-color: #e6fcf5 !important;
	}

	.task-logs .uni-list-item:active {
		background-color: #d1f7e8 !important;
	}

	/* 确保 uni-list 不会影响子元素的背景色 */
	.task-logs .uni-list {
		background-color: transparent;
	}

	.task-logs .uni-list--border:after {
		display: none;
	}

	/* uni-load-more 优化 */
	.task-logs .uni-load-more {
		padding: 8px 24px;
	}

	.task-logs .uni-load-more__text {
		color: #42b983;
		font-size: 14px;
	}
</style>
