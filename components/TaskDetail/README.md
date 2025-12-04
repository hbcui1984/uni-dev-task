# TaskDetail 组件说明

## 概述

将原来 921 行的 `detail.vue` 拆分成多个职责单一的子组件，提高代码可维护性和复用性。

## 组件结构

```
components/TaskDetail/
├── TaskHeader.vue         # 任务头部（标题、状态、操作按钮）
├── TaskInfo.vue          # 任务信息（负责人、截止日期、优先级）
├── TaskDescription.vue   # 任务描述
├── TaskAttachments.vue   # 附件管理
├── SubTaskList.vue       # 子任务列表
└── README.md            # 说明文档
```

## 各组件说明

### 1. TaskHeader.vue

**功能**：显示任务标题、完成状态和操作按钮

**Props**:
- `task` (Object): 任务对象，必填

**Events**:
- `status-change`: 状态变更事件，参数: newStatus (Number)
- `edit`: 编辑按钮点击事件
- `delete`: 删除按钮点击事件

**使用示例**:
```vue
<TaskHeader
  :task="taskData"
  @status-change="handleStatusChange"
  @edit="handleEdit"
  @delete="handleDelete" />
```

### 2. TaskInfo.vue

**功能**：显示和编辑任务的基本信息

**Props**:
- `task` (Object): 任务对象，必填
- `members` (Array): 成员列表，用于负责人选择

**Events**:
- `assignee-change`: 负责人变更，参数: assigneeId (String)
- `deadline-change`: 截止日期变更，参数: deadline (String/Number)
- `priority-change`: 优先级变更，参数: priority (Number)

**使用示例**:
```vue
<TaskInfo
  :task="taskData"
  :members="memberList"
  @assignee-change="handleAssigneeChange"
  @deadline-change="handleDeadlineChange"
  @priority-change="handlePriorityChange" />
```

### 3. TaskDescription.vue

**功能**：显示任务描述内容

**Props**:
- `task` (Object): 任务对象，必填

**使用示例**:
```vue
<TaskDescription :task="taskData" />
```

### 4. TaskAttachments.vue

**功能**：管理任务附件（上传、下载、删除）

**Props**:
- `attachments` (Array): 附件列表

**Events**:
- `download`: 下载附件，参数: item (Object)
- `delete`: 删除附件，参数: { item, index }
- `upload-success`: 上传成功，参数: event
- `file-select`: 文件选择，参数: event
- `file-delete`: 文件删除，参数: event

**使用示例**:
```vue
<TaskAttachments
  :attachments="taskData.attachments"
  @download="handleDownload"
  @delete="handleDelete"
  @upload-success="handleUploadSuccess" />
```

### 5. SubTaskList.vue

**功能**：管理子任务列表

**Props**:
- `subTasks` (Array): 子任务列表
- `taskId` (String): 父任务ID，必填

**Events**:
- `add`: 添加子任务，参数: title (String)
- `status-change`: 子任务状态变更，参数: { task, status }
- `delete`: 删除子任务，参数: task (Object)

**使用示例**:
```vue
<SubTaskList
  :sub-tasks="subTaskList"
  :task-id="taskId"
  @add="handleAddSubTask"
  @status-change="handleSubTaskStatusChange"
  @delete="handleDeleteSubTask" />
```

## 完整使用示例

参见 `pages/opendb-task/detail-refactored.vue`，这是重构后的完整示例。

## 迁移步骤

1. **备份原文件**: 将 `detail.vue` 重命名为 `detail.backup.vue`

2. **复制新文件**: 将 `detail-refactored.vue` 重命名为 `detail.vue`

3. **测试功能**: 逐个测试各个功能是否正常
   - 任务信息展示
   - 状态切换
   - 负责人/截止日期/优先级修改
   - 附件上传下载删除
   - 子任务添加删除状态切换

4. **样式调整**: 根据实际UI需求调整样式

5. **补充功能**: 如果原组件有其他功能（如评论等），继续拆分或补充

## 优点

1. **职责单一**: 每个组件只负责一个功能模块
2. **易于维护**: 代码行数减少，逻辑清晰
3. **可复用**: 子组件可在其他页面复用
4. **易于测试**: 可单独测试每个组件
5. **协作友好**: 多人可同时开发不同组件

## 性能优化建议

1. 使用 `computed` 处理复杂数据
2. 避免频繁的数据库操作，使用防抖
3. 大列表使用虚拟滚动
4. 图片使用懒加载

## 后续优化方向

1. 添加任务评论组件 `TaskComments.vue`
2. 添加任务历史记录组件 `TaskHistory.vue`
3. 使用 TypeScript 增强类型安全
4. 添加单元测试
5. 使用 Composition API 重构（Vue 3）
