<!--
 * 项目成员管理页面
 *
 * 功能说明：
 * - 查看项目所有成员列表
 * - 小团队场景下由管理员直接添加成员，邀请码入口暂不开放
 * - 管理员可设置/取消其他成员的管理员权限
 * - 管理员可移除项目成员
 * - 支持成员搜索
 *
 * 路由：/pages/opendb-projects/member?id={projectId}
 * 权限：仅项目管理员可访问完整功能
-->
<template>
	<view class="page-container">
		<!-- 自定义导航栏 -->
		<CustomNavBar :title="projectName" subtitle="项目成员管理" />

		<!-- 搜索栏和统计 -->
		<view class="search-section">
			<!-- 统计信息卡片 -->
			<view class="stats-card">
				<view class="stat-item">
					<text class="stat-label">总用户</text>
					<text class="stat-value">{{ users.length }}</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-label">已加入</text>
					<text class="stat-value primary">{{ joinedCount }}</text>
				</view>
			</view>

			<!-- 搜索框 -->
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input
					class="search-input"
					v-model="searchKeyword"
					placeholder="搜索成员名称"
					placeholder-class="search-placeholder"
				/>
				<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
			</view>
		</view>

		<!-- 成员列表 -->
		<view class="member-list">
			<view
				v-for="(item, index) in filteredUsers"
				:key="item._id"
				class="member-card"
				:class="{ 'member-active': item.join_project }"
			>
				<!-- 用户头像和信息 -->
				<view class="member-main">
					<view class="member-avatar">
						<text class="avatar-text">{{ getAvatarText(item.nickname) }}</text>
					</view>
					<view class="member-info">
						<view class="member-name-row">
							<text class="member-name">{{ item.nickname }}</text>
							<view v-if="item.role_in_project" class="role-badge" :class="getRoleBadgeClass(item.role_in_project)">
								<text class="role-text">{{ item.role_in_project }}</text>
							</view>
						</view>
						<text class="member-id">ID: {{ item._id.slice(-8) }}</text>
					</view>
				</view>

				<!-- 开关 -->
				<view class="member-action">
					<switch
						:checked="item.join_project"
						@change="switchChange($event, item._id)"
						color="#42b983"
						class="member-switch"
					/>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="filteredUsers.length === 0" class="empty-state">
				<text class="empty-icon">👥</text>
				<text class="empty-text">{{ searchKeyword ? '未找到匹配的成员' : '暂无用户数据' }}</text>
			</view>
		</view>

	</view>
</template>

<script>
	import CustomNavBar from '@/components/CustomNavBar/CustomNavBar.vue'
	import { getAvatarText } from '@/utils/task.js'

	export default {
		components: {
			CustomNavBar
		},
		data() {
			return {
				users: [],
				members: [],
				project_id: '',
				projectName: '',
				searchKeyword: '',
				loading: false,
				inviteCode: '',
				inviteCodeExpires: null
			}
		},
		computed: {
			// 过滤后的用户列表
			filteredUsers() {
				if (!this.searchKeyword) {
					return this.users
				}
				return this.users.filter(user =>
					user.nickname && user.nickname.toLowerCase().includes(this.searchKeyword.toLowerCase())
				)
			},
			// 已加入项目的人数（管理员 + 成员）
			joinedCount() {
				return this.users.filter(u => u.join_project).length
			},
			// 预留：后续若恢复邀请码入口，继续沿用当前 H5/小程序文案输出。
			inviteLink() {
				if (!this.inviteCode) return ''
				// #ifdef H5
				const baseUrl = window.location.origin + window.location.pathname
				return `${baseUrl}#/pages/opendb-projects/join?code=${this.inviteCode}`
				// #endif
				// #ifndef H5
				return `邀请码：${this.inviteCode}`
				// #endif
			}
		},
		onLoad(e) {
			this.project_id = e.id
			this.projectName = e.name ? decodeURIComponent(e.name) : '项目'
		},
		onReady() {
			this.loadData()
		},
		methods: {
			// 加载数据
			async loadData() {
				this.loading = true
				try {
					const projectCo = uniCloud.importObject('project-co')
					const result = await projectCo.getAllUsersWithMemberStatus(this.project_id)
					if (result.errCode) {
						throw new Error(result.errMsg || '加载失败')
					}
					this.users = result.userList || []
					this.members = result.members || []
				} catch (e) {
					console.error("加载数据失败:", e)
					uni.showToast({
						title: e.message || '加载失败',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			},

			// 开关切换
			switchChange(e, uid) {
				const isChecked = e.detail.value

				// 更新 users 数组中对应用户的状态
				const user = this.users.find(u => u._id === uid)
				if (user) {
					user.join_project = isChecked
					// 如果是添加成员，设置角色为成员；如果是移除，清空角色（除非是管理员）
					if (isChecked) {
						if (!user.role_in_project) {
							user.role_in_project = '成员'
						}
					} else {
						// 管理员不能通过开关移除
						if (user.role_in_project !== '管理员') {
							user.role_in_project = null
						}
					}
				}

				if (isChecked) {
					// 添加成员
					if (!this.members.includes(uid)) {
						this.members.push(uid)
					}
				} else {
					// 移除成员
					const index = this.members.indexOf(uid)
					if (index > -1) {
						this.members.splice(index, 1)
					}
				}

				// 更新数据库
				uniCloud.database().collection('opendb-projects').doc(this.project_id).update({
					members: this.members
				}).then(() => {
					uni.showToast({
						title: isChecked ? '已添加成员' : '已移除成员',
						icon: 'success',
						duration: 1500
					})
					// 通知父页面刷新数据
					this.getOpenerEventChannel().emit('refreshData')
				}).catch(err => {
					console.error("更新失败:", err)
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
					// 回滚操作
					this.loadData()
				})
			},

			// 获取头像文字
			getAvatarText,

			// 获取角色徽章样式类
			getRoleBadgeClass(role) {
				return role === '管理员' ? 'role-badge-admin' : 'role-badge-member'
			},

			// 清除搜索
			clearSearch() {
				this.searchKeyword = ''
			},

			// 预留：小团队场景以管理员直接加成员为主，邀请码入口暂不开放。
			showInvitePopup() {
				this.loadInviteCode()
				uni.showToast({
					title: '暂未开放邀请码邀请',
					icon: 'none'
				})
			},

			// 预留：邀请码弹窗关闭逻辑，当前未开放入口。
			closeInvitePopup() {
				return
			},

			// 预留：后续若开放自助加入项目，可继续复用现有邀请码读取逻辑。
			loadInviteCode() {
				uniCloud.database().collection('opendb-projects')
					.doc(this.project_id)
					.field('invite_code,invite_code_expires')
					.get()
					.then(res => {
						if (res.result.data && res.result.data.length > 0) {
							const project = res.result.data[0]
							const now = Date.now()
							// 检查邀请码是否过期
							if (project.invite_code && project.invite_code_expires && project.invite_code_expires > now) {
								this.inviteCode = project.invite_code
								this.inviteCodeExpires = project.invite_code_expires
							} else {
								this.inviteCode = ''
								this.inviteCodeExpires = null
							}
						}
					})
					.catch(err => {
						console.error('加载邀请码失败:', err)
					})
			},

			// 预留：后续若开放自助加入项目，可继续复用现有邀请码生成逻辑。
			generateInviteCode() {
				// 生成6位随机邀请码
				const code = Math.random().toString(36).substring(2, 8).toUpperCase()
				// 有效期48小时
				const expires = Date.now() + 48 * 60 * 60 * 1000

				uniCloud.database().collection('opendb-projects')
					.doc(this.project_id)
					.update({
						invite_code: code,
						invite_code_expires: expires
					})
					.then(() => {
						this.inviteCode = code
						this.inviteCodeExpires = expires
						uni.showToast({
							title: '邀请码生成成功',
							icon: 'success'
						})
					})
					.catch(err => {
						console.error('生成邀请码失败:', err)
						uni.showToast({
							title: '生成失败',
							icon: 'none'
						})
					})
			},

			// 预留：邀请码复制逻辑，当前未开放入口。
			copyInviteCode() {
				uni.setClipboardData({
					data: this.inviteCode,
					success: () => {
						uni.showToast({
							title: '邀请码已复制',
							icon: 'success'
						})
					}
				})
			},

			// 预留：邀请链接复制逻辑，当前未开放入口。
			copyInviteLink() {
				uni.setClipboardData({
					data: this.inviteLink,
					success: () => {
						uni.showToast({
							title: '邀请链接已复制',
							icon: 'success'
						})
					}
				})
			}
		}
	}
</script>

<style scoped>
.page-container {
	min-height: 100vh;
	background-color: var(--color-bg-page);
}

/* ===== 内容容器限宽 ===== */
.search-section,
.member-list {
	max-width: 800px;
	margin-left: auto;
	margin-right: auto;
}

/* ===== 搜索栏和统计 ===== */
.search-section {
	padding: var(--spacing-base);
	background-color: var(--color-bg-page);
}

/* 统计信息卡片 */
.stats-card {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-xl);
	background-color: var(--color-white);
	border-radius: var(--radius-md);
	padding: var(--spacing-sm) var(--spacing-xl);
	margin-bottom: var(--spacing-md);
	box-shadow: var(--shadow-sm);
}

.stat-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: var(--spacing-xs);
}

.stat-label {
	font-size: var(--font-size-sm);
	color: var(--color-text-secondary);
	font-weight: var(--font-weight-medium);
}

.stat-value {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--color-text-primary);
	line-height: 1.2;
}

.stat-value.primary {
	color: var(--color-primary);
}

.stat-divider {
	width: 1px;
	height: 20px;
	background-color: var(--color-border);
}

.search-box {
	display: flex;
	align-items: center;
	background-color: var(--color-white);
	border-radius: var(--radius-lg);
	padding: var(--spacing-sm) var(--spacing-base);
	box-shadow: var(--shadow-sm);
	transition: var(--transition-base);
}

.search-box:focus-within {
	box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.search-icon {
	font-size: var(--font-size-lg);
	margin-right: var(--spacing-sm);
}

.search-input {
	flex: 1;
	font-size: var(--font-size-base);
	color: var(--color-text-primary);
	border: none;
}

.search-placeholder {
	color: var(--color-text-tertiary);
}

.clear-icon {
	font-size: var(--font-size-lg);
	color: var(--color-text-tertiary);
	padding: 0 var(--spacing-xs);
	cursor: pointer;
}

/* ===== 成员列表 ===== */
.member-list {
	padding: 0 var(--spacing-base) var(--spacing-xxl);
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--spacing-md);
}

/* PC端双列布局 */
@media (min-width: 640px) {
	.member-list {
		grid-template-columns: repeat(2, 1fr);
	}
}

.member-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: var(--color-white);
	border-radius: var(--radius-md);
	padding: var(--spacing-base);
	box-shadow: var(--shadow-sm);
	transition: var(--transition-base);
	border: 2px solid transparent;
}

.member-card:active {
	transform: scale(0.98);
}

.member-card.member-active {
	border-color: var(--color-primary);
	background-color: var(--color-bg-hover);
}

.member-main {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.member-avatar {
	width: 48px;
	height: 48px;
	border-radius: var(--radius-full);
	background: linear-gradient(135deg, #42b983, #5fd89f);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: var(--spacing-md);
	flex-shrink: 0;
	box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
}

.avatar-text {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--color-white);
}

.member-info {
	flex: 1;
	min-width: 0;
}

.member-name-row {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	margin-bottom: 4px;
}

.member-name {
	font-size: var(--font-size-md);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
}

.role-badge {
	padding: 2px 8px;
	border-radius: var(--radius-full);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-medium);
}

.role-badge-admin {
	background-color: #fef3e6;
	color: #c87619;
}

.role-badge-member {
	background-color: var(--color-bg-active);
	color: var(--color-primary-dark);
}

.role-text {
	font-size: var(--font-size-xs);
}

.member-id {
	font-size: var(--font-size-xs);
	color: var(--color-text-secondary);
}

.member-action {
	flex-shrink: 0;
	margin-left: var(--spacing-md);
}

.member-switch {
	transform: scale(0.9);
}


/* ===== 空状态 ===== */
.empty-state {
	grid-column: 1 / -1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-xxxl) var(--spacing-base);
}

.empty-icon {
	font-size: 64px;
	margin-bottom: var(--spacing-base);
	opacity: 0.5;
}

.empty-text {
	font-size: var(--font-size-base);
	color: var(--color-text-secondary);
}

/* ===== 响应式优化 ===== */
@media (max-width: 375px) {
	.stat-value {
		font-size: var(--font-size-xxl);
	}

	.member-avatar {
		width: 40px;
		height: 40px;
	}

	.avatar-text {
		font-size: var(--font-size-base);
	}
}

</style>

<!-- 非 scoped 样式，用于覆盖 switch 组件颜色 -->
<style>
/* H5 平台 switch 选中颜色 */
.uni-switch-input.uni-switch-input-checked {
	background-color: #42b983 !important;
	border-color: #42b983 !important;
}
</style>
