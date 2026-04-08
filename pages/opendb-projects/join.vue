<!--
 * 加入项目页面
 *
 * 功能说明：
 * - 通过邀请码加入项目
 * - 支持直接输入邀请码或通过邀请链接访问
 * - 验证邀请码有效性（48小时有效期）
 * - 已是项目成员时显示提示信息
 *
 * 路由：/pages/opendb-projects/join?code={inviteCode}
-->
<template>
	<view class="join-container">
		<CustomNavBar title="加入项目" />

		<view class="join-content">
			<!-- 项目信息展示 -->
			<view v-if="projectInfo" class="project-card">
				<view class="project-icon">📁</view>
				<text class="project-name">{{ projectInfo.name }}</text>
				<text v-if="projectInfo.description" class="project-desc">{{ projectInfo.description }}</text>

				<view class="join-status">
					<view v-if="alreadyMember" class="status-message success">
						<text class="status-icon">✓</text>
						<text class="status-text">您已是该项目成员</text>
					</view>
					<button v-else class="join-btn" @click="joinProject" :disabled="joining">
						{{ joining ? '加入中...' : '加入项目' }}
					</button>
				</view>
			</view>

			<!-- 输入邀请码 -->
			<view v-else class="input-card">
				<text class="input-title">请输入邀请码</text>
				<input
					class="code-input"
					v-model="inviteCode"
					:placeholder="showInvitePlaceholder ? '输入6位邀请码' : ''"
					placeholder-class="code-input-placeholder"
					maxlength="6"
					:focus="true"
					@input="handleInviteCodeInput"
					@focus="handleInviteCodeFocus"
					@blur="handleInviteCodeBlur"
					@confirm="checkInviteCode"
				/>
				<button class="check-btn" @click="checkInviteCode" :disabled="checking || inviteCode.length !== 6">
					{{ checking ? '验证中...' : '验证邀请码' }}
				</button>

				<view class="tips">
					<text class="tips-title">💡 提示</text>
					<text class="tips-text">• 请向项目管理员获取邀请码</text>
					<text class="tips-text">• 邀请码有效期为48小时</text>
					<text class="tips-text">• 输入邀请码即可加入项目</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import CustomNavBar from '@/components/CustomNavBar/CustomNavBar.vue'

	export default {
		components: {
			CustomNavBar
		},
		data() {
			return {
				inviteCode: '',
				showInvitePlaceholder: true,
				projectInfo: null,
				alreadyMember: false,
				checking: false,
				joining: false
			}
		},
		onLoad(options) {
			// 从URL参数获取邀请码
			if (options.code) {
				this.inviteCode = options.code.toUpperCase()
				this.checkInviteCode()
			}
		},
		methods: {
			handleInviteCodeInput(e) {
				const value = (e.detail.value || '').replace(/\s+/g, '').toUpperCase()
				this.inviteCode = value
				this.showInvitePlaceholder = !value
			},

			handleInviteCodeFocus() {
				this.showInvitePlaceholder = false
			},

			handleInviteCodeBlur() {
				this.showInvitePlaceholder = !this.inviteCode
			},

			// 验证邀请码
			async checkInviteCode() {
				if (!this.inviteCode || this.inviteCode.length !== 6) {
					return uni.showToast({
						title: '请输入6位邀请码',
						icon: 'none'
					})
				}

				this.checking = true

				try {
					const db = uniCloud.database()
					const now = Date.now()

					// 查询邀请码对应的项目
					const res = await db.collection('opendb-projects')
						.where({
							invite_code: this.inviteCode,
							invite_code_expires: db.command.gt(now)
						})
						.field('_id,name,description,members,managers')
						.get()

					if (res.result.data && res.result.data.length > 0) {
						const project = res.result.data[0]
						this.projectInfo = project

						// 检查用户是否已经是成员
						const currentUser = uniCloud.getCurrentUserInfo()
						const uid = currentUser.uid

						if (project.managers && project.managers.includes(uid)) {
							this.alreadyMember = true
							uni.showToast({
								title: '您是该项目管理员',
								icon: 'none'
							})
						} else if (project.members && project.members.includes(uid)) {
							this.alreadyMember = true
							uni.showToast({
								title: '您已是该项目成员',
								icon: 'none'
							})
						}
					} else {
						uni.showToast({
							title: '邀请码无效或已过期',
							icon: 'none'
						})
					}
				} catch (err) {
					console.error('验证邀请码失败:', err)
					uni.showToast({
						title: '验证失败，请重试',
						icon: 'none'
					})
				} finally {
					this.checking = false
				}
			},

			// 加入项目
			async joinProject() {
				if (!this.projectInfo) return

				this.joining = true

				try {
					const db = uniCloud.database()
					const currentUser = uniCloud.getCurrentUserInfo()
					const uid = currentUser.uid

					// 将当前用户添加到项目成员列表
					await db.collection('opendb-projects')
						.doc(this.projectInfo._id)
						.update({
							members: db.command.addToSet(uid)
						})

					uni.showToast({
						title: '加入项目成功',
						icon: 'success'
					})

					// 延迟跳转到项目任务列表
					setTimeout(() => {
						uni.redirectTo({
							url: `/pages/opendb-task/list?id=${this.projectInfo._id}&name=${encodeURIComponent(this.projectInfo.name)}`
						})
					}, 1500)
				} catch (err) {
					console.error('加入项目失败:', err)
					uni.showToast({
						title: '加入失败，请重试',
						icon: 'none'
					})
				} finally {
					this.joining = false
				}
			}
		}
	}
</script>

<style scoped>
.join-container {
	min-height: 100vh;
	background-color: var(--color-bg-page);
}

.join-content {
	padding: var(--spacing-xl) var(--spacing-base);
	max-width: 600px;
	margin: 0 auto;
}

/* ===== 项目卡片 ===== */
.project-card {
	background-color: var(--color-white);
	border-radius: var(--radius-lg);
	padding: var(--spacing-xxxl) var(--spacing-xl);
	box-shadow: var(--shadow-md);
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.project-icon {
	font-size: 64px;
	margin-bottom: var(--spacing-lg);
}

.project-name {
	font-size: var(--font-size-xxxl);
	font-weight: var(--font-weight-bold);
	color: var(--color-text-primary);
	margin-bottom: var(--spacing-sm);
}

.project-desc {
	font-size: var(--font-size-base);
	color: var(--color-text-secondary);
	line-height: 1.6;
	margin-bottom: var(--spacing-xl);
}

.join-status {
	width: 100%;
	margin-top: var(--spacing-lg);
}

.status-message {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-sm);
	padding: var(--spacing-md);
	border-radius: var(--radius-base);
}

.status-message.success {
	background-color: var(--color-bg-active);
	color: var(--color-primary-dark);
}

.status-icon {
	font-size: var(--font-size-xl);
}

.status-text {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-medium);
}

.join-btn {
	width: 100%;
	padding: var(--spacing-md);
	background-color: var(--color-primary);
	color: var(--color-white);
	border: none;
	border-radius: var(--radius-base);
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	cursor: pointer;
	transition: var(--transition-base);
	box-shadow: var(--shadow-primary);
}

.join-btn:hover {
	background-color: var(--color-primary-dark);
	box-shadow: var(--shadow-primary-lg);
}

.join-btn:active {
	transform: translateY(1px);
}

.join-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* ===== 输入卡片 ===== */
.input-card {
	background-color: var(--color-white);
	border-radius: var(--radius-lg);
	padding: var(--spacing-xl);
	box-shadow: var(--shadow-md);
	box-sizing: border-box;
	width: 100%;
}

.input-title {
	display: block;
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
	margin-bottom: var(--spacing-lg);
	text-align: center;
}

.code-input {
	width: 100%;
	padding: var(--spacing-md);
	font-size: var(--font-size-xxxl);
	line-height: 1.2;
	font-weight: var(--font-weight-bold);
	color: var(--color-primary);
	text-align: center;
	letter-spacing: 4px;
	border: 2px solid var(--color-border);
	border-radius: var(--radius-base);
	background-color: var(--color-bg-active);
	text-transform: uppercase;
	font-family: 'Courier New', monospace;
	transition: var(--transition-base);
	box-sizing: border-box;
	display: block;
}

.code-input-placeholder {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-medium);
	letter-spacing: 0;
	color: var(--color-text-secondary);
}

.code-input:focus {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
	outline: none;
}

.check-btn {
	width: 100%;
	margin-top: var(--spacing-lg);
	padding: var(--spacing-md);
	background-color: var(--color-primary);
	color: var(--color-white);
	border: none;
	border-radius: var(--radius-base);
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	cursor: pointer;
	transition: var(--transition-base);
}

.check-btn:hover {
	background-color: var(--color-primary-dark);
}

.check-btn:active {
	transform: translateY(1px);
}

.check-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* ===== 提示信息 ===== */
.tips {
	margin-top: var(--spacing-xl);
	padding: var(--spacing-base);
	background-color: var(--color-gray-1);
	border-radius: var(--radius-base);
}

.tips-title {
	display: block;
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
	margin-bottom: var(--spacing-sm);
}

.tips-text {
	display: block;
	font-size: var(--font-size-sm);
	color: var(--color-text-secondary);
	line-height: 2;
}

/* #ifdef MP-WEIXIN */
.code-input {
	height: 48px;
	padding: 0 16px;
	font-size: 18px;
	line-height: 48px;
	letter-spacing: 1px;
	font-family: inherit;
	font-weight: 600;
}

.code-input-placeholder {
	font-size: 16px;
	line-height: 48px;
}
/* #endif */
</style>
