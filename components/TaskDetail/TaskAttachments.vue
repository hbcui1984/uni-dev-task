<template>
	<view class="task-attachments">
		<view class="section-header">
			<uni-icons type="paperclip" size="16"></uni-icons>
			<text class="section-title">附件列表</text>
		</view>

		<!-- 附件列表 -->
		<view v-if="attachments && attachments.length > 0" class="attachment-list">
			<view
				v-for="(item, index) in attachments"
				:key="index"
				class="attachment-item">
				<view class="attachment-name">
					<uni-icons type="doc" size="14" style="margin-right: 5px;"></uni-icons>
					{{ item.name }}
				</view>
				<!-- #ifdef H5 -->
				<view class="attachment-actions">
					<text class="action-link" @click="downloadFile(item)">下载</text>
					<text class="action-link action-delete" @click="deleteFile(item, index)">删除</text>
				</view>
				<!-- #endif -->
			</view>
		</view>

		<!-- 上传按钮 -->
		<view class="upload-section">
			<uni-file-picker
				v-model="files"
				limit="9"
				file-mediatype="all"
				return-type="array"
				@success="handleUploadSuccess"
				@select="handleFileSelect"
				@delete="handleFileDelete">
				<button type="primary" size="mini">上传新附件</button>
			</uni-file-picker>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TaskAttachments',
	props: {
		attachments: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			files: []
		}
	},
	methods: {
		downloadFile(item) {
			// #ifdef H5
			const link = document.createElement('a')
			link.href = item.url
			link.download = item.name
			link.click()
			// #endif
			this.$emit('download', item)
		},
		deleteFile(item, index) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除附件"${item.name}"吗？`,
				success: (res) => {
					if (res.confirm) {
						this.$emit('delete', { item, index })
					}
				}
			})
		},
		handleUploadSuccess(e) {
			this.$emit('upload-success', e)
		},
		handleFileSelect(e) {
			this.$emit('file-select', e)
		},
		handleFileDelete(e) {
			this.$emit('file-delete', e)
		}
	}
}
</script>

<style scoped>
.task-attachments {
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
	margin-left: 8px;
	font-weight: 600;
	font-size: 15px;
	color: #2c3e50;
}

.attachment-list {
	margin-bottom: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.attachment-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background-color: #ffffff;
	border-radius: 8px;
	border: 1px solid #e9ecef;
	transition: all 0.25s ease;
}

.attachment-item:hover {
	border-color: #42b983;
	box-shadow: 0 2px 8px rgba(66, 185, 131, 0.1);
	transform: translateY(-1px);
}

.attachment-name {
	display: flex;
	align-items: center;
	flex: 1;
	font-size: 14px;
	color: #2c3e50;
	font-weight: 500;
	gap: 8px;
}

.attachment-actions {
	display: flex;
	gap: 12px;
}

.action-link {
	color: #42b983;
	font-size: 12px;
	cursor: pointer;
	font-weight: 600;
	padding: 4px 8px;
	border-radius: 4px;
	transition: all 0.25s ease;
}

.action-link:hover {
	background-color: #e6fcf5;
	text-decoration: none;
}

.action-delete {
	color: #e74c3c;
}

.action-delete:hover {
	background-color: #fdecea;
}

.upload-section {
	margin-top: 12px;
}

</style>

<!-- 无 scoped 样式块，用于覆盖子组件样式（兼容小程序） -->
<style lang="scss">
/* TaskAttachments - 文件上传按钮样式优化 */
.task-attachments .uni-file-picker__container {
	border-radius: 8px;
}

.task-attachments button[type="primary"] {
	background-color: #42b983;
	border-color: #42b983;
	border-radius: 6px;
	font-weight: 500;
	transition: all 0.25s ease;
}

.task-attachments button[type="primary"]:hover {
	background-color: #359568;
	box-shadow: 0 4px 14px rgba(66, 185, 131, 0.2);
}
</style>
