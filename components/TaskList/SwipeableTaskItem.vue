<!--
 * 可滑动任务项组件
 *
 * 功能说明：
 * - 移动端：支持左滑显示操作按钮（编辑、删除）
 * - PC端：正常显示，不支持滑动
 * - 点击任务跳转到详情
 *
 * 使用方式：
 * <SwipeableTaskItem
 *   :task="task"
 *   :members="members"
 *   @finish="onFinish"
 *   @edit="onEdit"
 *   @delete="onDelete"
 *   @click="onClick"
 * />
-->
<template>
	<view
		class="swipeable-item"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	>
		<!-- 操作按钮层（右侧隐藏） -->
		<view class="swipe-actions" :style="{ width: actionsWidth + 'px' }">
			<view class="swipe-action swipe-action--complete" @click.stop="handleComplete">
				<uni-icons type="checkmarkempty" size="20" color="#fff"></uni-icons>
				<text>完成</text>
			</view>
			<view class="swipe-action swipe-action--edit" @click.stop="handleEdit">
				<uni-icons type="compose" size="20" color="#fff"></uni-icons>
				<text>编辑</text>
			</view>
			<view class="swipe-action swipe-action--delete" @click.stop="handleDelete">
				<uni-icons type="trash" size="20" color="#fff"></uni-icons>
				<text>删除</text>
			</view>
		</view>

		<!-- 内容层 -->
		<view
			class="swipe-content"
			:style="{ transform: `translateX(${offsetX}px)` }"
			@click="handleClick"
		>
			<slot>
				<!-- 默认任务内容 -->
				<view class="task-item-default">
					<checkbox
						:checked="task.status === 2"
						@click.stop="handleComplete"
						color="#42b983"
					/>
					<view class="task-info">
						<text class="task-title" :class="{ 'task-completed': task.status === 2 }">
							{{ task.title }}
						</text>
						<view class="task-meta">
							<text v-if="task.deadline" class="deadline" :class="{ 'overdue': isOverdue }">
								{{ formattedDeadline }}
							</text>
							<text class="priority-tag" :class="`priority-${task.priority || 0}`">
								{{ priorityText }}
							</text>
						</view>
					</view>
				</view>
			</slot>
		</view>
	</view>
</template>

<script>
import { isMobile } from '@/utils/responsive.js'

export default {
	name: 'SwipeableTaskItem',
	props: {
		task: {
			type: Object,
			required: true
		},
		threshold: {
			type: Number,
			default: 60
		}
	},
	data() {
		return {
			startX: 0,
			startY: 0,
			offsetX: 0,
			isMoving: false,
			actionsWidth: 180
		}
	},
	computed: {
		isMobileDevice() {
			return isMobile()
		},
		isOverdue() {
			if (!this.task.deadline) return false
			return new Date(this.task.deadline) < new Date()
		},
		formattedDeadline() {
			if (!this.task.deadline) return ''
			const date = new Date(this.task.deadline)
			const month = date.getMonth() + 1
			const day = date.getDate()
			return `${month}月${day}日`
		},
		priorityText() {
			const priorityMap = ['较低', '普通', '较高', '最高']
			return priorityMap[this.task.priority] || '普通'
		}
	},
	methods: {
		onTouchStart(e) {
			if (!this.isMobileDevice) return
			const touch = e.touches[0]
			this.startX = touch.clientX
			this.startY = touch.clientY
			this.isMoving = false
		},

		onTouchMove(e) {
			if (!this.isMobileDevice) return
			const touch = e.touches[0]
			const deltaX = touch.clientX - this.startX
			const deltaY = touch.clientY - this.startY

			// 判断是否为水平滑动
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				this.isMoving = true
				// 只允许左滑（负值）
				if (deltaX < 0) {
					// 限制最大滑动距离
					this.offsetX = Math.max(deltaX, -this.actionsWidth)
				} else if (this.offsetX < 0) {
					// 向右滑动时恢复
					this.offsetX = Math.min(0, this.offsetX + deltaX)
				}
			}
		},

		onTouchEnd() {
			if (!this.isMobileDevice) return
			// 判断是否超过阈值
			if (Math.abs(this.offsetX) > this.threshold) {
				// 展开操作按钮
				this.offsetX = -this.actionsWidth
			} else {
				// 收起
				this.offsetX = 0
			}
		},

		resetSwipe() {
			this.offsetX = 0
		},

		handleClick() {
			if (this.isMoving || this.offsetX !== 0) {
				this.resetSwipe()
				return
			}
			this.$emit('click', this.task)
		},

		handleComplete() {
			this.resetSwipe()
			this.$emit('finish', this.task._id)
		},

		handleEdit() {
			this.resetSwipe()
			this.$emit('edit', this.task._id)
		},

		handleDelete() {
			this.resetSwipe()
			this.$emit('delete', this.task._id)
		}
	}
}
</script>

<style lang="scss" scoped>
.swipeable-item {
	position: relative;
	overflow: hidden;
	background-color: #fff;
}

.swipe-actions {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: stretch;
}

.swipe-action {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 60px;
	color: #fff;
	font-size: 12px;
	gap: 4px;
	transition: all 0.2s ease;
}

.swipe-action--complete {
	background-color: #42b983;
}

.swipe-action--edit {
	background-color: #6c757d;
}

.swipe-action--delete {
	background-color: #e74c3c;
}

.swipe-content {
	position: relative;
	z-index: 1;
	background-color: #fff;
	transition: transform 0.2s ease;
}

.task-item-default {
	display: flex;
	align-items: center;
	padding: 14px 16px;
	gap: 12px;
}

.task-info {
	flex: 1;
	min-width: 0;
}

.task-title {
	font-size: 14px;
	color: #2c3e50;
	font-weight: 500;
	line-height: 1.4;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.task-completed {
	color: #9ca3af;
	text-decoration: line-through;
}

.task-meta {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 6px;
}

.deadline {
	font-size: 12px;
	color: #6c757d;
	padding: 2px 8px;
	background-color: #f7f8fa;
	border-radius: 4px;
}

.deadline.overdue {
	color: #e74c3c;
	background-color: #fdecea;
}

.priority-tag {
	font-size: 11px;
	font-weight: 500;
}

.priority-0 { color: #6c757d; }
.priority-1 { color: #42b983; }
.priority-2 { color: #f39c12; }
.priority-3 { color: #e74c3c; }
</style>
