<!--
 * 任务快速编辑组件
 *
 * 功能说明：
 * - 提供优先级快速选择弹窗
 * - 提供截止日期快速选择（PC端原生日期选择器，移动端picker-view）
 * - 可被任何需要快速编辑任务的页面复用
 *
 * 使用方式：
 * 1. 在页面中引入组件：<TaskQuickEdit ref="quickEdit" @update="onTaskUpdate" />
 * 2. 调用方法：this.$refs.quickEdit.openPriorityEditor(task)
 * 3. 调用方法：this.$refs.quickEdit.openDeadlineEditor(task)
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

		<!-- 移动端日期选择弹出层 -->
		<uni-popup ref="popup-deadline" type="bottom">
			<view class="deadline-popup">
				<view class="deadline-popup__header">
					<text class="deadline-popup__cancel" @click="closeDeadlinePopup">取消</text>
					<text class="deadline-popup__title">选择截止日期</text>
					<text class="deadline-popup__confirm" @click="confirmDeadline">确定</text>
				</view>
				<view class="deadline-popup__content">
					<picker-view :value="datePickerValue" @change="onDatePickerChange" class="date-picker-view">
						<picker-view-column>
							<view v-for="year in yearRange" :key="year" class="picker-item">{{ year }}年</view>
						</picker-view-column>
						<picker-view-column>
							<view v-for="month in 12" :key="month" class="picker-item">{{ month }}月</view>
						</picker-view-column>
						<picker-view-column>
							<view v-for="day in daysInMonth" :key="day" class="picker-item">{{ day }}日</view>
						</picker-view-column>
					</picker-view>
				</view>
				<view class="deadline-popup__actions">
					<button class="deadline-popup__clear" @click="clearDeadline">清除截止日期</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
export default {
	name: 'TaskQuickEdit',
	data() {
		return {
			currentTaskId: '',
			currentPriority: 1,
			currentDeadline: null,
			priorityList: [
				{ value: 0, text: '较低' },
				{ value: 1, text: '普通' },
				{ value: 2, text: '较高' },
				{ value: 3, text: '最高' }
			],
			// 日期选择器相关
			datePickerValue: [0, 0, 0],
			selectedYear: new Date().getFullYear(),
			selectedMonth: new Date().getMonth() + 1,
			selectedDay: new Date().getDate()
		}
	},
	computed: {
		yearRange() {
			const currentYear = new Date().getFullYear()
			const years = []
			for (let i = currentYear; i <= currentYear + 5; i++) {
				years.push(i)
			}
			return years
		},
		daysInMonth() {
			return new Date(this.selectedYear, this.selectedMonth, 0).getDate()
		}
	},
	methods: {
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
		 */
		openDeadlineEditor(task) {
			this.currentTaskId = task._id
			this.currentDeadline = task.deadline

			// PC 端使用原生日期选择器
			if (this.isPC()) {
				this.openNativeDatePicker(task.deadline)
			} else {
				// 移动端使用 picker-view
				this.openMobileDatePicker(task.deadline)
			}
		},

		isPC() {
			// #ifdef H5
			return window.innerWidth >= 768
			// #endif
			return false
		},

		openNativeDatePicker(currentDeadline) {
			// #ifdef H5
			const input = document.createElement('input')
			input.type = 'date'
			input.style.position = 'fixed'
			input.style.left = '-9999px'
			document.body.appendChild(input)

			input.value = currentDeadline ? new Date(currentDeadline).toISOString().split('T')[0] : ''

			input.onchange = async (e) => {
				const value = e.target.value
				await this.saveDeadline(value)
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

			setTimeout(() => {
				input.showPicker ? input.showPicker() : input.click()
			}, 0)
			// #endif
		},

		openMobileDatePicker(currentDeadline) {
			const date = currentDeadline ? new Date(currentDeadline) : new Date()
			this.selectedYear = date.getFullYear()
			this.selectedMonth = date.getMonth() + 1
			this.selectedDay = date.getDate()

			const yearIndex = this.yearRange.indexOf(this.selectedYear)
			this.datePickerValue = [
				yearIndex >= 0 ? yearIndex : 0,
				this.selectedMonth - 1,
				this.selectedDay - 1
			]

			this.$refs['popup-deadline'].open()
		},

		onDatePickerChange(e) {
			const values = e.detail.value
			this.selectedYear = this.yearRange[values[0]]
			this.selectedMonth = values[1] + 1
			this.selectedDay = values[2] + 1
		},

		async confirmDeadline() {
			const dateStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`
			await this.saveDeadline(dateStr)
			this.closeDeadlinePopup()
		},

		async clearDeadline() {
			await this.saveDeadline(null)
			this.closeDeadlinePopup()
		},

		closeDeadlinePopup() {
			this.$refs['popup-deadline'].close()
		},

		async saveDeadline(value) {
			try {
				const db = uniCloud.database()
				const deadline = value ? new Date(value).getTime() : null

				await db.collection('opendb-task').doc(this.currentTaskId).update({
					deadline: deadline
				})

				uni.showToast({
					title: value ? '截止日期已更新' : '截止日期已清除',
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

/* 日期选择弹窗样式 */
.deadline-popup {
	background-color: #fff;
	border-radius: 16px 16px 0 0;
	overflow: hidden;
}

.deadline-popup__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #f1f3f5;
}

.deadline-popup__cancel,
.deadline-popup__confirm {
	font-size: 15px;
	padding: 4px 8px;
}

.deadline-popup__cancel {
	color: #6c757d;
}

.deadline-popup__confirm {
	color: #42b983;
	font-weight: 600;
}

.deadline-popup__title {
	font-size: 16px;
	font-weight: 600;
	color: #2c3e50;
}

.deadline-popup__content {
	padding: 0 20px;
}

.date-picker-view {
	height: 200px;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	color: #2c3e50;
}

.deadline-popup__actions {
	padding: 16px 20px;
	padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.deadline-popup__clear {
	width: 100%;
	height: 44px;
	line-height: 44px;
	font-size: 14px;
	color: #e74c3c;
	background-color: #fdecea;
	border: none;
	border-radius: 8px;
}
</style>
