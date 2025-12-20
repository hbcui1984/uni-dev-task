<template>
	<view class="sub-task-list">
		<view class="section-header">
			<text class="section-title">子任务</text>
			<text class="task-count">({{ subTasks.length }})</text>
		</view>

		<!-- 添加子任务输入框 -->
		<view class="add-subtask">
			<input
				class="subtask-input"
				v-model="newSubTaskTitle"
				placeholder="添加子任务"
				@confirm="handleAddSubTask"
			/>
			<button
				type="primary"
				size="mini"
				@click="handleAddSubTask"
				:disabled="!newSubTaskTitle.trim()">
				添加
			</button>
		</view>

		<!-- 子任务列表 -->
		<view v-if="subTasks.length > 0" class="subtask-items">
			<view
				v-for="(item, index) in subTasks"
				:key="item._id"
				class="subtask-item">
				<checkbox-group @change="(e) => handleSubTaskStatusChange(e, item)">
					<label class="subtask-label">
						<checkbox :checked="item.status == 2" :value="item._id" color="#42b983" />
						<text :class="{ 'subtask-completed': item.status == 2 }">
							{{ item.title }}
						</text>
					</label>
				</checkbox-group>
				<view class="subtask-actions">
					<uni-icons
						type="trash"
						size="16"
						color="#999"
						@click="handleDeleteSubTask(item)">
					</uni-icons>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-else class="empty-state">
			<text class="empty-text">暂无子任务</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'SubTaskList',
	props: {
		subTasks: {
			type: Array,
			default: () => []
		},
		taskId: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			newSubTaskTitle: ''
		}
	},
	methods: {
		handleAddSubTask() {
			if (!this.newSubTaskTitle.trim()) {
				return
			}
			this.$emit('add', this.newSubTaskTitle.trim())
			this.newSubTaskTitle = ''
		},
		handleSubTaskStatusChange(e, item) {
			const newStatus = e.detail.value.length > 0 ? 2 : (item.status === 2 ? 0 : 2)
			this.$emit('status-change', { task: item, status: newStatus })
		},
		handleDeleteSubTask(item) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除子任务"${item.title}"吗？`,
				success: (res) => {
					if (res.confirm) {
						this.$emit('delete', item)
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.sub-task-list {
	margin-top: 24px;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 2px solid #e6fcf5;
}

.section-title {
	font-weight: 600;
	font-size: 16px;
	color: #2c3e50;
}

.task-count {
	margin-left: 8px;
	color: #42b983;
	font-size: 14px;
	font-weight: 600;
	background-color: #e6fcf5;
	padding: 2px 8px;
	border-radius: 12px;
}

.add-subtask {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	padding: 12px;
	background-color: #f7f8fa;
	border-radius: 8px;
	border: 1px solid #e9ecef;
}

.subtask-input {
	flex: 1;
	padding: 10px 14px;
	border: 1px solid #e9ecef;
	border-radius: 6px;
	font-size: 14px;
	transition: all 0.25s ease;
	background-color: #ffffff;
}

.subtask-input:focus {
	outline: none;
	border-color: #42b983;
	box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.subtask-items {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.subtask-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background-color: #ffffff;
	border-radius: 8px;
	border: 1px solid #e9ecef;
	transition: all 0.25s ease;
}

.subtask-item:hover {
	border-color: #42b983;
	box-shadow: 0 2px 8px rgba(66, 185, 131, 0.1);
}

.subtask-label {
	display: flex;
	align-items: center;
	flex: 1;
	gap: 10px;
	color: #2c3e50;
	font-weight: 500;
}

.subtask-completed {
	text-decoration: line-through;
	color: #adb5bd;
	font-weight: 400;
}

.subtask-actions {
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.25s ease;
}

.subtask-actions:hover {
	background-color: #fdecea;
}

.empty-state {
	padding: 48px;
	text-align: center;
	background-color: #f7f8fa;
	border-radius: 8px;
	border: 2px dashed #e9ecef;
}

.empty-text {
	color: #adb5bd;
	font-size: 14px;
}

</style>

<!-- 无 scoped 样式块，用于覆盖子组件样式（兼容小程序） -->
<style lang="scss">
/* SubTaskList - Checkbox 样式 */
.sub-task-list checkbox .uni-checkbox-input {
	border-color: #42b983;
}

.sub-task-list checkbox .uni-checkbox-input.uni-checkbox-input-checked {
	background-color: #42b983;
	border-color: #42b983;
}

/* SubTaskList - 按钮样式 */
.sub-task-list button[type="primary"] {
	background-color: #42b983;
	border-color: #42b983;
	border-radius: 6px;
	font-weight: 500;
	transition: all 0.25s ease;
}

.sub-task-list button[type="primary"]:hover {
	background-color: #359568;
	box-shadow: 0 4px 14px rgba(66, 185, 131, 0.2);
}

.sub-task-list button[type="primary"]:disabled {
	background-color: #adb5bd;
	border-color: #adb5bd;
	opacity: 0.6;
}
</style>
