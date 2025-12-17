<!--
 * 任务快速编辑组件
 *
 * 功能说明：
 * - 提供优先级快速选择弹窗
 * - 提供截止日期快速选择（使用 uni-datetime-picker）
 * - 提供负责人快速切换
 * - 可被任何需要快速编辑任务的页面复用
 *
 * 使用方式：
 * 1. 在页面中引入组件：<TaskQuickEdit ref="quickEdit" @update="onTaskUpdate" />
 * 2. 调用方法：this.$refs.quickEdit.openPriorityEditor(task)
 * 3. 调用方法：this.$refs.quickEdit.openDeadlineEditor(task)
 * 4. 调用方法：this.$refs.quickEdit.openAssigneeEditor(task, members)
-->
<template>
	<view class="task-quick-edit">
		<!-- 优先级选择弹出层 -->
		<uni-popup ref="popup-priority" type="center" background-color="#fff">
			<view class="priority-popup">
				<view class="priority-popup__header">
					<text class="priority-popup__title">选择优先级</text>
				</view>
				<view class="priority-popup__content">
					<view
						v-for="item in priorityList"
						:key="item.value"
						class="priority-option"
						:class="{ 'priority-option--selected': currentPriority === item.value }"
						@click="selectPriority(item.value)"
					>
						<view class="priority-option__tag" :class="`priority-${item.value}`">
							{{ item.text }}
						</view>
						<uni-icons v-if="currentPriority === item.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
					</view>
				</view>
				<view class="priority-popup__footer">
					<button class="priority-popup__btn" @click="closePriorityPopup">取消</button>
				</view>
			</view>
		</uni-popup>

		<!-- 隐藏的日期选择器 -->
		<picker
			ref="datePicker"
			mode="date"
			:value="selectedDate"
			@change="onDeadlineChange"
			style="position: absolute; left: -9999px; opacity: 0;"
		>
			<view>隐藏的日期选择器</view>
		</picker>

		<!-- 负责人选择弹出层 -->
		<uni-popup ref="popup-assignee" type="center" background-color="#fff">
			<view class="assignee-popup">
				<view class="assignee-popup__header">
					<text class="assignee-popup__title">选择负责人</text>
				</view>
				<view class="assignee-popup__content">
					<view
						class="assignee-option"
						:class="{ 'assignee-option--selected': !currentAssignee }"
						@click="selectAssignee('')"
					>
						<view class="assignee-option__info">
							<view class="assignee-option__avatar assignee-option__avatar--empty">
								<uni-icons type="person" size="16" color="#999"></uni-icons>
							</view>
							<text class="assignee-option__name">不指定</text>
						</view>
						<uni-icons v-if="!currentAssignee" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
					</view>
					<view
						v-for="member in memberList"
						:key="member.value"
						class="assignee-option"
						:class="{ 'assignee-option--selected': currentAssignee === member.value }"
						@click="selectAssignee(member.value)"
					>
						<view class="assignee-option__info">
							<image v-if="member.avatar" :src="member.avatar" class="assignee-option__avatar" mode="aspectFill"></image>
							<view v-else class="assignee-option__avatar assignee-option__avatar--text" :style="{ backgroundColor: getAvatarColor(member.text) }">
								{{ member.text.slice(0, 1) }}
							</view>
							<text class="assignee-option__name">{{ member.text }}</text>
						</view>
						<uni-icons v-if="currentAssignee === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
					</view>
				</view>
				<view class="assignee-popup__footer">
					<button class="assignee-popup__btn" @click="closeAssigneePopup">取消</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { getAvatarColor } from '@/utils/task.js'

export default {
	name: 'TaskQuickEdit',
	data() {
		return {
			currentTaskId: '',
			currentProjectId: '',
			// 优先级
			currentPriority: 1,
			priorityList: [
				{ value: 0, text: '较低' },
				{ value: 1, text: '普通' },
				{ value: 2, text: '较高' },
				{ value: 3, text: '最高' }
			],
			// 截止日期
			selectedDate: '',
			// 负责人
			currentAssignee: '',
			memberList: []
		}
	},
	methods: {
		getAvatarColor,

		// ========== 优先级编辑 ==========

		/**
		 * 打开优先级选择器
		 * @param {Object} task - 任务对象，需要包含 _id 和 priority
		 */
		openPriorityEditor(task) {
			this.currentTaskId = task._id
			this.currentPriority = task.priority ?? 1
			this.$refs['popup-priority'].open()
		},

		async selectPriority(priority) {
			if (priority === this.currentPriority) {
				this.closePriorityPopup()
				return
			}

			try {
				const db = uniCloud.database()
				await db.collection('opendb-task').doc(this.currentTaskId).update({
					priority: priority
				})

				this.closePriorityPopup()
				uni.showToast({
					title: '优先级已更新',
					icon: 'success'
				})

				// 通知父组件更新
				this.$emit('update', {
					type: 'priority',
					taskId: this.currentTaskId,
					value: priority
				})
			} catch (error) {
				console.error('更新优先级失败:', error)
				uni.showToast({
					title: '更新失败',
					icon: 'none'
				})
			}
		},

		closePriorityPopup() {
			this.$refs['popup-priority'].close()
		},

		// ========== 截止日期编辑 ==========

		/**
		 * 打开截止日期选择器
		 * @param {Object} task - 任务对象，需要包含 _id 和 deadline
		 * @param {Object} position - 点击位置，格式 { left: number, top: number }
		 */
		openDeadlineEditor(task, position) {
			this.currentTaskId = task._id
			const currentDeadline = task.deadline

			// 将时间戳转换为日期字符串
			if (currentDeadline) {
				const date = new Date(currentDeadline)
				this.selectedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
			} else {
				this.selectedDate = ''
			}

			// PC 端使用原生日期选择器
			if (this.isPC()) {
				this.openPCDatePicker(currentDeadline, position)
			} else {
				// 移动端触发隐藏的 picker
				this.$nextTick(() => {
					const pickerElement = this.$refs.datePicker
					if (pickerElement) {
						pickerElement.$el && pickerElement.$el.click()
					}
				})
			}
		},

		isPC() {
			// #ifdef H5
			return window.innerWidth >= 768
			// #endif
			return false
		},

		openPCDatePicker(currentDeadline, position) {
			// #ifdef H5
			const input = document.createElement('input')
			input.type = 'date'
			input.style.position = 'fixed'
			input.style.width = '1px'
			input.style.height = '1px'
			input.style.border = 'none'
			input.style.padding = '0'
			input.style.margin = '0'
			input.style.zIndex = '9999'
			input.style.opacity = '0'

			// 使用传入的位置
			let left = '50%'
			let top = '50%'

			if (position && position.left !== undefined && position.top !== undefined) {
				left = position.left + 'px'
				top = position.top + 'px'
			}

			input.style.left = left
			input.style.top = top

			input.value = currentDeadline ? new Date(currentDeadline).toISOString().split('T')[0] : ''

			input.onchange = async (e) => {
				await this.saveDeadline(e.target.value)
				if (input.parentNode) {
					document.body.removeChild(input)
				}
			}

			input.onblur = () => {
				setTimeout(() => {
					if (input.parentNode) {
						document.body.removeChild(input)
					}
				}, 200)
			}

			document.body.appendChild(input)

			setTimeout(() => {
				try {
					input.showPicker()
				} catch (e) {
					console.error('showPicker error:', e)
					input.focus()
					input.click()
				}
			}, 0)
			// #endif
		},

		async onDeadlineChange(e) {
			const value = e.detail.value
			await this.saveDeadline(value)
		},

		async saveDeadline(value) {
			try {
				const db = uniCloud.database()
				const deadline = value ? new Date(value).getTime() : null

				await db.collection('opendb-task').doc(this.currentTaskId).update({
					deadline: deadline
				})

				uni.showToast({
					title: deadline ? '截止日期已更新' : '截止日期已清除',
					icon: 'success'
				})

				// 通知父组件更新
				this.$emit('update', {
					type: 'deadline',
					taskId: this.currentTaskId,
					value: deadline
				})
			} catch (error) {
				console.error('更新截止日期失败:', error)
				uni.showToast({
					title: '更新失败',
					icon: 'none'
				})
			}
		},

		// ========== 负责人编辑 ==========

		/**
		 * 打开负责人选择器
		 * @param {Object} task - 任务对象，需要包含 _id, assignee, project_id
		 * @param {Array} members - 成员列表，格式：[{ value: userId, text: nickname, avatar: url }]
		 */
		// 获取 assignee ID（JQL联表后为数组格式 [{_id, nickname}]）
		getAssigneeId(assignee) {
			if (!assignee) return ''
			if (Array.isArray(assignee) && assignee.length > 0) {
				return assignee[0]._id || ''
			}
			return ''
		},

		async openAssigneeEditor(task, members) {
			this.currentTaskId = task._id
			this.currentProjectId = task.project_id
			this.currentAssignee = this.getAssigneeId(task.assignee)

			// 如果传入了成员列表，直接使用
			if (members && members.length > 0) {
				this.memberList = members
				this.$refs['popup-assignee'].open()
			} else if (task.project_id) {
				// 否则根据项目ID加载成员
				await this.loadProjectMembers(task.project_id)
				this.$refs['popup-assignee'].open()
			} else {
				uni.showToast({
					title: '无法获取成员列表',
					icon: 'none'
				})
			}
		},

		async loadProjectMembers(projectId) {
			try {
				const projectObj = uniCloud.importObject('project-co')
				const res = await projectObj.getMembersList(projectId)
				this.memberList = res.map(member => ({
					value: member._id,
					text: member.nickname,
					avatar: member.avatar
				}))
			} catch (e) {
				console.error('加载项目成员失败:', e)
				this.memberList = []
			}
		},

		async selectAssignee(assigneeId) {
			if (assigneeId === this.currentAssignee) {
				this.closeAssigneePopup()
				return
			}

			try {
				// 获取原负责人和新负责人信息
				const oldMember = this.memberList.find(m => m.value === this.currentAssignee)
				const newMember = this.memberList.find(m => m.value === assigneeId)
				const oldName = oldMember ? oldMember.text : '无'
				const newName = newMember ? newMember.text : '无'

				const db = uniCloud.database()
				await db.collection('opendb-task').doc(this.currentTaskId).update({
					assignee: assigneeId || ''
				})

				this.closeAssigneePopup()
				uni.showToast({
					title: `负责人: ${oldName} → ${newName}`,
					icon: 'none',
					duration: 2000
				})

				// 通知父组件更新
				this.$emit('update', {
					type: 'assignee',
					taskId: this.currentTaskId,
					value: assigneeId,
					oldAssignee: this.currentAssignee,
					oldMemberInfo: oldMember || null,
					memberInfo: newMember || null
				})
			} catch (error) {
				console.error('更新负责人失败:', error)
				uni.showToast({
					title: '更新失败',
					icon: 'none'
				})
			}
		},

		closeAssigneePopup() {
			this.$refs['popup-assignee'].close()
		}
	}
}
</script>

<style lang="scss" scoped>
/* 优先级弹窗样式 */
.priority-popup {
	width: 280px;
	background-color: #fff;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.priority-popup__header {
	padding: 16px;
	border-bottom: 1px solid #f1f3f5;
	text-align: center;
}

.priority-popup__title {
	font-size: 16px;
	font-weight: 600;
	color: #2c3e50;
}

.priority-popup__content {
	padding: 12px 16px;
}

.priority-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-bottom: 8px;
}

.priority-option:last-child {
	margin-bottom: 0;
}

.priority-option:hover {
	background-color: #f7f8fa;
}

.priority-option--selected {
	background-color: #e6fcf5;
}

.priority-option__tag {
	padding: 4px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
}

.priority-option__tag.priority-0 {
	background-color: #f3f4f6;
	color: #6b7280;
}

.priority-option__tag.priority-1 {
	background-color: #e6fcf5;
	color: #42b983;
}

.priority-option__tag.priority-2 {
	background-color: #fef3c7;
	color: #d97706;
}

.priority-option__tag.priority-3 {
	background-color: #fee2e2;
	color: #dc2626;
}

.priority-popup__footer {
	padding: 12px 16px;
	border-top: 1px solid #f1f3f5;
}

.priority-popup__btn {
	width: 100%;
	height: 40px;
	line-height: 40px;
	font-size: 14px;
	color: #6c757d;
	background-color: #f7f8fa;
	border: none;
	border-radius: 8px;
}

/* 负责人弹窗样式 */
.assignee-popup {
	width: 300px;
	max-height: 70vh;
	background-color: #fff;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.assignee-popup__header {
	padding: 16px;
	border-bottom: 1px solid #f1f3f5;
	text-align: center;
}

.assignee-popup__title {
	font-size: 16px;
	font-weight: 600;
	color: #2c3e50;
}

.assignee-popup__content {
	max-height: 300px;
	overflow-y: auto;
	padding: 8px 0;
}

.assignee-option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 16px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.assignee-option:hover {
	background-color: #f7f8fa;
}

.assignee-option--selected {
	background-color: #e6fcf5;
}

.assignee-option__info {
	display: flex;
	align-items: center;
	gap: 12px;
}

.assignee-option__avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	flex-shrink: 0;
}

.assignee-option__avatar--text {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	color: #fff;
	font-weight: 500;
}

.assignee-option__avatar--empty {
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f1f3f5;
}

.assignee-option__name {
	font-size: 14px;
	color: #2c3e50;
}

.assignee-popup__footer {
	padding: 12px 16px;
	border-top: 1px solid #f1f3f5;
}

.assignee-popup__btn {
	width: 100%;
	height: 40px;
	line-height: 40px;
	font-size: 14px;
	color: #6c757d;
	background-color: #f7f8fa;
	border: none;
	border-radius: 8px;
}
</style>
