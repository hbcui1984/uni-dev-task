<template>
  <!--
    TaskItem 移动端任务行组件
    - 适用于 TaskList.vue（项目任务列表）和 myTask.vue（我的任务）
    - 仅用于移动端（H5 mobile + 微信小程序），PC 端由父组件自行处理
    - H5 mobile 与微信小程序使用相同模板，保持一致
  -->
  <view class="task-item-mobile">
    <checkbox @click.stop="$emit('finish', task._id)" color="#42b983" class="mobile-checkbox" />
    <view class="mobile-task-content">
      <!-- 第一行：标题 + 子任务数 -->
      <view class="mtask-title-row">
        <text class="task-title">{{ task.title }}</text>
        <view v-if="task.subtaskCount && task.subtaskCount.total > 0" class="mtask-subtask">
          <uni-icons type="list" size="11" color="#9ca3af"></uni-icons>
          <text :class="{ 'subtask-all-done': task.subtaskCount.completed === task.subtaskCount.total }">
            {{ task.subtaskCount.completed }}/{{ task.subtaskCount.total }}
          </text>
        </view>
      </view>
      <!-- 第二行：负责人 → 截止日期 → 优先级（从左到右，有就显示） -->
      <view class="mtask-meta-row" v-if="(showAssignee && assigneeId) || task.deadline || task.priority != null">
        <view v-if="showAssignee && assigneeId" class="mtask-avatar">
          <image v-if="assigneeAvatar" :src="assigneeAvatar" class="mtask-avatar-img" mode="aspectFill"></image>
          <view v-else class="mtask-avatar-text" :style="{ backgroundColor: getAvatarColor(assigneeDisplayName) }">
            <text>{{ assigneeInitial }}</text>
          </view>
        </view>
        <picker v-if="task.deadline" mode="date" :value="deadlineValue" @change="onDeadlineChange" @click.stop>
          <text class="mtask-deadline" :class="{ 'mtask-deadline--overdue': isOverdue(task.deadline) }">
            {{ formatDeadlineText(task.deadline) }}
          </text>
        </picker>
        <text v-if="task.priority != null" class="mtask-priority" :class="`mtask-priority--${task.priority}`">
          {{ getPriorityText(task.priority) }}
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import { formatDeadline, isOverdue, getPriorityText, getAvatarColor } from '@/utils/task.js'

export default {
  name: 'TaskItem',
  props: {
    // 任务数据对象
    task: {
      type: Object,
      required: true
    },
    // 项目成员列表（用于头像/名称回查）
    members: {
      type: Array,
      default: () => []
    },
    // 是否显示负责人头像（myTask 页面无需显示，因为都是当前用户的任务）
    showAssignee: {
      type: Boolean,
      default: true
    }
  },
  emits: ['finish', 'save-deadline'],
  computed: {
    // 解析负责人 ID（兼容联表数组格式和字符串格式）
    assigneeId() {
      const a = this.task.assignee
      if (!a) return null
      if (Array.isArray(a) && a.length > 0) return a[0]._id
      if (typeof a === 'string' && a) return a
      return null
    },
    // 负责人显示名称
    assigneeDisplayName() {
      const a = this.task.assignee
      if (Array.isArray(a) && a.length > 0) {
        const u = a[0]
        return u.realname || u.real_name || u.nickname || u.username || '未知'
      }
      if (this.assigneeId) {
        const member = this.members.find(m => m.value === this.assigneeId)
        return member?.realName || member?.text || '未知'
      }
      return null
    },
    // 负责人头像 URL
    assigneeAvatar() {
      const a = this.task.assignee
      if (Array.isArray(a) && a.length > 0 && a[0].avatar_file?.url) {
        return a[0].avatar_file.url
      }
      if (this.assigneeId) {
        const member = this.members.find(m => m.value === this.assigneeId)
        return member?.avatar || null
      }
      return null
    },
    // 负责人姓名首字母（用于文字头像）
    assigneeInitial() {
      const name = this.assigneeDisplayName
      if (!name) return '人'
      return String(name).trim().slice(0, 1).toUpperCase()
    },
    // picker 需要的 yyyy-MM-dd 格式
    deadlineValue() {
      if (!this.task.deadline) return ''
      try {
        return new Date(this.task.deadline).toISOString().split('T')[0]
      } catch (e) {
        return ''
      }
    }
  },
  methods: {
    formatDeadlineText(deadline) {
      return formatDeadline(deadline) || '设置截止日期'
    },
    isOverdue,
    getPriorityText,
    getAvatarColor,
    onDeadlineChange(e) {
      this.$emit('save-deadline', this.task._id, e.detail.value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/common/_priority.scss';

/* ===== 任务行容器 ===== */
.task-item-mobile {
  display: flex;
  align-items: flex-start;
  padding: 11px 12px 11px 14px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  gap: 10px;
  width: 100%;
}

.mobile-checkbox {
  flex-shrink: 0;
  margin-top: 2px;
}

.mobile-task-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ===== 第一行：标题 + 子任务数 ===== */
.mtask-title-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.task-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  line-height: 1.45;
}

.mtask-subtask {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 11px;
  color: #9ca3af;
  background-color: #f3f4f6;
  padding: 1px 6px;
  border-radius: 999px;
}

/* #ifdef H5 */
.mtask-subtask text {
  font-weight: 500;
}
/* #endif */

.mtask-subtask .subtask-all-done {
  color: #42b983;
}

/* ===== 第二行：负责人 → 截止日期 → 优先级 ===== */
.mtask-meta-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.mtask-avatar {
  flex-shrink: 0;
}

.mtask-avatar-img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.mtask-avatar-text {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}

.mtask-deadline {
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

.mtask-deadline--overdue {
  color: #dc2626;
}

.mtask-priority {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
}

.mtask-priority--0 { color: $priority-0-color; }
.mtask-priority--1 { color: $priority-1-color; }
.mtask-priority--2 { color: $priority-2-color; }
.mtask-priority--3 { color: $priority-3-color; }
</style>
