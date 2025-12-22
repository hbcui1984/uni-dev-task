# CLAUDE.md - 项目速览

## 项目概述

**uni-task** 是一个基于 uni-app + uniCloud 的轻量级团队任务管理系统，适用于中小型团队的项目协作。

- **版本**: 2.1.5
- **框架**: uni-app (Vue 3)
- **后端**: uniCloud (阿里云/腾讯云)
- **状态管理**: Vuex
- **用户认证**: uni-id
- **主题色**: Vue 绿 (#42b983)

## 目录结构

```
uni-task/
├── components/              # 自定义组件
│   ├── CustomNavBar/       # 自定义导航栏
│   ├── TaskDetail/         # 任务详情组件集
│   │   ├── SubTaskList.vue     # 子任务列表
│   │   ├── TaskAttachments.vue # 附件管理
│   │   ├── TaskDescription.vue # 任务描述
│   │   ├── TaskHeader.vue      # 任务头部
│   │   └── TaskInfo.vue        # 任务信息
│   └── TaskList/           # 任务列表组件（支持拖拽）
├── pages/                   # 页面
│   ├── opendb-projects/    # 项目管理页面
│   │   ├── list.vue        # 项目列表（首页）
│   │   ├── list-archived.vue # 已归档项目列表
│   │   ├── add.vue         # 新建项目
│   │   ├── edit.vue        # 编辑项目
│   │   ├── member.vue      # 成员管理
│   │   └── join.vue        # 加入项目
│   ├── opendb-task/        # 任务管理页面
│   │   ├── list.vue        # 任务列表（主页面，39KB+）
│   │   ├── detail.vue      # 任务详情（最大页面，87KB+）
│   │   ├── add.vue         # 新建任务
│   │   ├── edit.vue        # 编辑任务
│   │   ├── myTask.vue      # 我的任务
│   │   ├── list-done.vue   # 已完成任务
│   │   └── list-archived.vue # 已归档任务
│   ├── task-logs/          # 项目动态
│   ├── ucenter/            # 用户中心
│   └── error/              # 错误页面
├── store/                   # Vuex 状态管理
│   └── modules/
│       ├── app.js          # 应用状态
│       ├── user.js         # 用户状态
│       ├── task.js         # 任务状态（核心，7KB+）
│       └── error.js        # 错误状态
├── utils/                   # 工具函数
│   ├── auth.js             # 认证相关
│   ├── date.js             # 日期处理
│   ├── task.js             # 任务相关
│   ├── responsive.js       # 响应式布局
│   ├── errorHandler.js     # 错误处理
│   ├── lruCache.js         # LRU 缓存
│   └── performance.js      # 性能监控
├── common/                  # 公共资源
│   ├── theme.js            # 主题配置（颜色、间距、字体等）
│   ├── theme.scss          # 主题样式变量
│   ├── global.scss         # 全局样式
│   ├── uni.css             # uni-app 公共样式
│   └── appInit.js          # 应用初始化
├── js_sdk/                  # JS SDK
│   └── uni-id-pages/       # uni-id 页面 store
├── uniCloud-aliyun/        # 云开发
│   ├── cloudfunctions/     # 云函数/云对象
│   │   ├── task-co/        # 任务云对象
│   │   ├── project-co/     # 项目云对象
│   │   └── task-logs-co/   # 日志云对象
│   └── database/           # 数据库 schema
└── uni_modules/            # uni-app 插件（40+个）
```

## 数据库设计

### opendb-projects（项目表）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 项目ID |
| name | string | 项目名称（必填，2-50字符） |
| description | string | 项目描述（最多500字符） |
| cover | object | 项目封面（url, name, size） |
| managers | array | 管理员 uid 列表 |
| members | array | 普通成员 uid 列表 |
| archived | bool | 是否已归档 |
| archived_date | timestamp | 归档时间 |
| invite_code | string | 邀请码 |
| invite_code_expires | timestamp | 邀请码过期时间 |

### opendb-task（任务表）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 任务ID |
| project_id | string | 项目ID（必填） |
| parent_id | string | 父任务ID（子任务用） |
| group_id | string | 分组ID |
| title | string | 任务标题（必填，≥3字符） |
| content | string | 任务详情 |
| assignee | string | 负责人用户ID |
| deadline | timestamp | 截止日期 |
| priority | int | 优先级：0较低/1普通/2较高/3最高 |
| status | int | 状态：0未开始/1进行中/2已完成 |
| order | int | 排序号 |
| attachments | array | 附件列表 |
| completion_uid | string | 完成人ID |
| completion_date | timestamp | 完成时间 |
| create_date | timestamp | 创建时间 |

### task-group（分组表）
用于任务分组管理

### opendb-task-logs（操作日志表）
记录任务和项目的操作日志

## 云对象 API

### task-co（任务云对象）
- `addTask()` - 新增任务（支持URL化）
- `updateTask()` - 更新任务（支持URL化）
- `deleteTask(params)` - 删除任务
- `changeState(taskId, newStatus)` - 修改任务状态
- `deleteAttachment(taskId, index, item)` - 删除附件
- `getTaskList(params)` - 获取任务列表
- `getUserLogs(params)` - 获取用户动态
- `getProjectLogs(params)` - 获取项目动态

### project-co（项目云对象）
- `getAllUsersWithMemberStatus(pid)` - 获取用户及成员状态
- `getMembersList(pid)` - 获取项目成员列表
- `updateProject(projectId, data)` - 更新项目信息
- `deleteProject(projectId)` - 删除项目
- `toggleArchive(projectId)` - 归档/取消归档
- `addMember(projectId, userId)` - 添加成员
- `removeMember(projectId, userId)` - 移除成员
- `toggleManager(projectId, userId, isManager)` - 设置/取消管理员

## 关键配置文件

### pages.json
- 首页：`pages/opendb-projects/list`
- 登录页：`uni_modules/uni-id-pages/pages/login/login-withpwd`
- 支持 topWindow（宽屏适配，≥800px）
- uniIdRouter 配置自动登录拦截

### uni-starter.config.js
应用配置文件，挂载到 `getApp().globalData.config`

### common/theme.js
主题配置，定义颜色、间距、字体、圆角、阴影、过渡动画等设计规范

## 开发注意事项

### 本地开发环境
- **使用 uniCloud 本地调试**，修改云函数/云对象后无需上传，保存即生效
- 不要提示用户上传云对象/云函数

### 代码规范
1. Vue 3 Composition API 与 Options API 混用
2. 条件编译：`#ifdef VUE3` / `#ifdef H5` 等
3. 使用 Vuex 进行状态管理
4. 云对象调用使用 `uniCloud.importObject()`

### 样式规范
- 主题色：Vue 绿 `#42b983`
- 全局样式在 `App.vue` 中统一覆盖
- 支持 SCSS 预处理
- 响应式布局支持

### 权限控制
- 所有云对象方法通过 `_before` 钩子验证 token
- 项目级权限：管理员 vs 普通成员
- 数据库 permission 控制读写权限

### 云函数中获取用户 uid

**常见错误**：`this.getClientInfo().uid` 返回 `undefined`，因为 `getClientInfo()` 只返回设备信息。

**正确做法**：
```javascript
const uniIdCommon = require('uni-id-common')

module.exports = {
    _before: async function() {
        const clientInfo = this.getClientInfo()
        this.uniIdCommon = uniIdCommon.createInstance({ clientInfo })

        const token = this.getUniIdToken()
        if (!token) {
            throw { errCode: 'TOKEN_INVALID', errMsg: '缺少token' }
        }

        const payload = await this.uniIdCommon.checkToken(token)
        if (payload.errCode) {
            throw { errCode: payload.errCode, errMsg: payload.errMsg || '无效的token' }
        }

        this.userInfo = { uid: payload.uid }
    }
}
```

**API 区分**：
| 方法 | 返回值 |
|------|--------|
| `this.getClientInfo()` | 设备信息（platform, os, deviceId） |
| `this.getUniIdToken()` | 客户端 token 字符串 |
| `uniIdCommon.checkToken(token)` | 用户信息（uid, errCode） |

### Git 提交规范

**重要**：
1. **不要主动提交到 GitHub**
2. 每次提交前必须**列出待提交的文件清单**
3. **等待用户确认后**才能执行 `git add` 和 `git commit`
4. 推送到远程仓库前也需要用户确认

### 依赖说明
- `sortablejs` - 任务拖拽排序
- `qrcodejs2` - 二维码生成
- `uni-id-common` - 用户认证公共模块

## 常用命令

```bash
# 安装依赖
npm install

# 日志查看
npm run logcat:web
npm run logcat:mp-weixin

# 测试
npm run test:web
npm run test:mp-weixin
```

## 支持平台

- H5（Chrome 支持最佳）
- 微信小程序
- App (Vue)
- 其他小程序（阿里、百度、字节等）

## 开发计划

- [ ] 消息通知推送
- [ ] 看板视图（Kanban）
- [ ] 数据统计面板
