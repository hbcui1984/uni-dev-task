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
      <!-- 第二行：按信息存在情况显示负责人 / 截止日期 / 优先级 -->
      <view class="mtask-meta-row" v-if="showMetaRow">
        <view v-if="showAssigneeChip" class="mtask-chip mtask-chip--assignee">
          <view class="mtask-avatar">
            <image v-if="assigneeAvatar" :src="assigneeAvatar" class="mtask-avatar-img" mode="aspectFill"></image>
            <view v-else class="mtask-avatar-text" :style="{ backgroundColor: getAvatarColor(assigneeDisplayName) }">
              <text>{{ assigneeInitial }}</text>
            </view>
          </view>
          <text class="mtask-chip-text mtask-chip-text--assignee">{{ assigneeDisplayName }}</text>
        </view>

        <picker v-if="showDeadlineChip" mode="date" :value="deadlineValue" @change="onDeadlineChange" @click.stop>
          <view class="mtask-chip mtask-chip--deadline" :class="{ 'mtask-chip--overdue': isOverdue(task.deadline) }">
            <uni-icons type="calendar" size="12" :color="isOverdue(task.deadline) ? '#dc2626' : '#6b7280'"></uni-icons>
            <text class="mtask-chip-text" :class="{ 'mtask-chip-text--overdue': isOverdue(task.deadline) }">
              {{ formatDeadlineText(task.deadline) }}
            </text>
          </view>
        </picker>

        <view v-if="showPriorityChip" class="mtask-chip mtask-chip--priority" :class="`mtask-chip--priority-${task.priority}`">
          <text class="mtask-chip-text mtask-chip-text--priority" :class="`mtask-chip-text--priority-${task.priority}`">
            {{ getPriorityText(task.priority) }}
          </text>
        </view>
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
    },
    showAssigneeChip() {
      return this.showAssignee && !!this.assigneeId && !!this.assigneeDisplayName
    },
    showDeadlineChip() {
      return !!this.task.deadline
    },
    showPriorityChip() {
      return this.task.priority !== null && this.task.priority !== undefined
    },
    showMetaRow() {
      return this.showAssigneeChip || this.showDeadlineChip || this.showPriorityChip
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
/* ===== 任务行容器 ===== */
.task-item-mobile {
  display: flex;
  align-items: flex-start;
  padding: 9px 12px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.mobile-checkbox {
  flex-shrink: 0;
  margin-top: 3px;
  transform: scale(0.88);
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
  line-height: 1.36;
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
  flex-wrap: wrap;
  padding-top: 1px;
}

.mtask-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  padding: 0;
  border-radius: 0;
  background-color: transparent;
  border: none;
  max-width: 100%;
}

.mtask-chip--assignee {
  gap: 5px;
}

.mtask-chip--deadline {
  gap: 3px;
  padding: 0 0 0 1px;
  border-radius: 999px;
  background-color: transparent;
  border: none;
}

.mtask-chip--overdue {
  padding: 1px 6px;
  background-color: #fff4f3;
  border-radius: 999px;
}

.mtask-chip--priority-0 {
  padding: 0 2px;
}

.mtask-chip--priority-1 {
  padding: 0 2px;
}

.mtask-chip--priority-2 {
  padding: 0 2px;
}

.mtask-chip--priority-3 {
  padding: 0 2px;
}

.mtask-chip-text {
  font-size: 11px;
  line-height: 1.2;
  color: #7b8794;
  white-space: nowrap;
}

.mtask-chip-text--assignee {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 112px;
  color: #7b8794;
}

.mtask-chip-text--overdue {
  color: #dc2626;
  font-weight: 500;
}

.mtask-chip-text--priority {
  font-weight: 500;
}

.mtask-chip-text--priority-0 {
  color: #7b8794;
}

.mtask-chip-text--priority-1 {
  color: #53759a;
}

.mtask-chip-text--priority-2 {
  color: #a06a16;
}

.mtask-chip-text--priority-3 {
  color: #b85450;
}

.mtask-avatar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.mtask-avatar-img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.mtask-avatar-text {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 8px;
  font-weight: 600;
}
</style>
