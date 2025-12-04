<template>
	<view class="task-description">
		<view class="section-header">
			<text class="section-title">任务描述</text>
		</view>
		<view class="description-content">
			<text>{{ task.content || '无' }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TaskDescription',
	props: {
		task: {
			type: Object,
			required: true
		}
	}
}
</script>

<style scoped>
.task-description {
	margin-top: 20px;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 10px;
}

.section-title {
	font-weight: 700;
	font-size: 16px;
}

.description-content {
	padding: 15px;
	background-color: #f7f8fa;
	border-radius: 4px;
	min-height: 80px;
}
</style>
