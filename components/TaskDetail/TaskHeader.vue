<template>
	<view class="task-header">
		<view class="header-row">
			<view class="title-section">
				<checkbox-group @change="handleStatusChange">
					<label class="title-label">
						<checkbox :checked="task.status == 2" :value="task.status + ''" color="#42b983" />
						<text class="title-text">{{ task.title }}</text>
					</label>
				</checkbox-group>
			</view>
			<view class="action-buttons">
				<uni-icons type="compose" @click="handleEdit" class="action-icon"></uni-icons>
				<uni-icons type="trash" @click="handleDelete" class="action-icon"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TaskHeader',
	props: {
		task: {
			type: Object,
			required: true
		}
	},
	methods: {
		handleStatusChange(e) {
			const status = e.detail.value.length > 0 ? 2 : (this.task.status === 2 ? 1 : 2)
			this.$emit('status-change', status)
		},
		handleEdit() {
			this.$emit('edit')
		},
		handleDelete() {
			this.$emit('delete')
		}
	}
}
</script>

<style scoped>
.task-header {
	border-bottom: 2px solid #e6fcf5;
	margin-bottom: 16px;
	padding-bottom: 16px;
	background: linear-gradient(to right, rgba(66, 185, 131, 0.02), transparent);
	padding: 16px;
	margin: -16px -16px 16px -16px;
	border-radius: 8px 8px 0 0;
}

.header-row {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-start;
}

.title-section {
	flex: 1;
	min-width: 0;
}

.title-label {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12px;
}

.title-text {
	font-size: 20px;
	font-weight: 600;
	color: #2c3e50;
	line-height: 1.4;
	word-break: break-word;
}

.action-buttons {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12px;
}

.action-icon {
	color: #6c757d;
	cursor: pointer;
	transition: all 0.25s ease;
	padding: 6px;
	border-radius: 6px;
}

.action-icon:hover {
	color: #42b983;
	background-color: #e6fcf5;
	transform: translateY(-1px);
}

/* Checkbox 样式 */
:deep(checkbox .uni-checkbox-input) {
	border-color: #42b983;
	width: 20px;
	height: 20px;
}

:deep(checkbox .uni-checkbox-input.uni-checkbox-input-checked) {
	background-color: #42b983;
	border-color: #42b983;
}
</style>
