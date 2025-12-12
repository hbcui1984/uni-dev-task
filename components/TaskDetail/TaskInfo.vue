<template>
	<view class="task-info">
		<!-- 负责人 -->
		<view class="info-item">
			<uni-icons type="contact" class="info-icon"></uni-icons>
			<uni-data-select
				class="info-select"
				:clear-icon="false"
				v-model="localAssignee"
				:localdata="members"
				@change="handleAssigneeChange">
			</uni-data-select>
		</view>

		<!-- 截止日期 -->
		<view class="info-item">
			<uni-icons type="calendar" class="info-icon"></uni-icons>
			<view :class="{ 'deadline-overdue': isOverdue }">
				<uni-datetime-picker
					type="date"
					v-model="localDeadline"
					@change="handleDeadlineChange">
					{{ localDeadline || '设置截止日期' }}
				</uni-datetime-picker>
			</view>
		</view>

		<!-- 优先级 -->
		<view class="info-item">
			<uni-icons type="tune" class="info-icon"></uni-icons>
			<picker
				:value="task.priority"
				:range="priorityOptions"
				@change="handlePriorityChange">
				<view class="info-picker">{{ priorityOptions[task.priority] }}</view>
			</picker>
		</view>
	</view>
</template>

<script>
import { isOverdue, PRIORITY_OPTIONS } from '@/utils/task.js'

export default {
	name: 'TaskInfo',
	props: {
		task: {
			type: Object,
			required: true
		},
		members: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			localAssignee: this.task.assignee || '',
			localDeadline: this.task.deadline || '',
			priorityOptions: PRIORITY_OPTIONS.map(p => p.text)
		}
	},
	computed: {
		isOverdue() {
			return isOverdue(this.localDeadline)
		}
	},
	watch: {
		'task.assignee'(val) {
			this.localAssignee = val || ''
		},
		'task.deadline'(val) {
			this.localDeadline = val || ''
		}
	},
	methods: {
		handleAssigneeChange(val) {
			this.$emit('assignee-change', val)
		},
		handleDeadlineChange(val) {
			this.$emit('deadline-change', val)
		},
		handlePriorityChange(e) {
			const priority = parseInt(e.detail.value)
			this.$emit('priority-change', priority)
		}
	}
}
</script>

<style scoped>
.task-info {
	display: flex;
	flex-wrap: wrap;
	margin-top: 16px;
	gap: 16px;
	padding: 16px;
	background-color: #f7f8fa;
	border-radius: 8px;
	border: 1px solid #e9ecef;
}

.info-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background-color: #ffffff;
	border-radius: 6px;
	transition: all 0.25s ease;
	border: 1px solid transparent;
}

.info-item:hover {
	border-color: #42b983;
	box-shadow: 0 2px 8px rgba(66, 185, 131, 0.1);
}

.info-icon {
	color: #42b983;
	font-size: 18px;
}

.info-select {
	min-width: 150px;
	border: none;
}

.info-picker {
	padding: 6px 12px;
	cursor: pointer;
	color: #2c3e50;
	font-weight: 500;
	border-radius: 4px;
	transition: all 0.25s ease;
}

.info-picker:hover {
	background-color: #e6fcf5;
	color: #42b983;
}

.deadline-overdue {
	color: #e74c3c;
	font-weight: 600;
}

/* uni-datetime-picker 样式优化 */
:deep(.uni-date-x) {
	color: #42b983;
	font-weight: 500;
}

:deep(.uni-date-x:hover) {
	color: #359568;
}

/* uni-data-select 样式优化 */
:deep(.uni-stat__select) {
	border-color: transparent;
}

:deep(.uni-stat__select:hover) {
	border-color: #42b983;
}

:deep(.uni-stat__select-text) {
	color: #42b983;
	font-weight: 500;
}
</style>
