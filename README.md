# uni-dev-task

基于 uni-app + uniCloud 的轻量级团队任务管理系统，适用于中小型团队的项目协作。一套代码，多端运行。

## 功能特性

### 项目管理
- 创建、编辑、归档项目
- 项目成员管理（管理员/普通成员）
- 邀请码快速加入项目

### 任务管理
- 任务增删改查，支持富文本描述
- 任务状态流转（待处理/进行中/已完成/已归档）
- 优先级设置（高/中/低）
- 截止日期与逾期提醒
- 任务分组与拖拽排序
- 子任务支持
- 附件上传与管理

### 团队协作
- 任务分配与负责人管理
- 操作日志自动记录
- 项目动态实时展示
- 「我的任务」个人视图

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | uni-app (Vue 3) |
| 状态管理 | Vuex |
| UI 组件库 | uni-ui |
| 后端服务 | uniCloud |
| 用户认证 | uni-id |

## 支持平台

- H5
- 各家小程序
- iOS App
- Android App
- HarmonyOS

## 项目结构

```
uni-dev-task/
├── components/              # 自定义组件
│   ├── TaskList/           # 任务列表组件（支持拖拽）
│   └── TaskDetail/         # 任务详情组件集
├── pages/
│   ├── opendb-projects/    # 项目管理
│   ├── opendb-task/        # 任务管理
│   ├── task-logs/          # 项目动态
│   └── ucenter/            # 用户中心
├── store/                   # Vuex 状态管理
│   └── modules/            # 模块：task/user/app/error
├── utils/                   # 工具函数
├── common/                  # 公共样式与主题配置
├── uniCloud-aliyun/        # 云开发
│   └── cloudfunctions/     # 云函数/云对象
│       ├── task-co/        # 任务云对象
│       ├── project-co/     # 项目云对象
│       └── task-logs-co/   # 日志云对象
└── uni_modules/            # uni-app 插件
```

## 快速开始

### 环境准备

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（推荐）
2. 注册 [DCloud 开发者账号](https://dev.dcloud.net.cn/)
3. 开通 uniCloud 服务

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/hbcui1984/uni-dev-task.git

# 进入项目目录
cd uni-dev-task

# 安装依赖
npm install
```

### 云服务配置

1. 使用 HBuilderX 打开项目
2. 右键点击 `uniCloud-aliyun` 目录 → 「关联云服务空间」
3. 右键点击 `cloudfunctions` 目录 → 「上传所有云函数、公共模块及 actions」
4. 右键点击 `database` 目录 → 「初始化云数据库」

### 运行项目

```bash
# H5
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin

# App（使用 HBuilderX 运行到模拟器或真机）
```

## 数据库设计

| 数据表 | 说明 |
|--------|------|
| opendb-projects | 项目信息 |
| opendb-task | 任务数据 |
| task-group | 任务分组 |
| opendb-task-logs | 操作日志 |

## 主题配置

项目支持自定义主题色，修改以下文件即可：

```javascript
// common/theme.js
colors: {
    primary: '#42b983',  // 修改为你的主题色
}
```

```scss
// common/global.scss
:root {
    --color-primary: #42b983;  // 修改为你的主题色
}
```

**预设主题色：**

| 主题 | 色值 |
|------|------|
| Vue 绿（默认） | `#42b983` |
| 天空蓝 | `#2979ff` |
| 珊瑚橙 | `#ff6b6b` |
| 薰衣紫 | `#7c4dff` |

## 开发计划

- [ ] 消息通知推送
- [ ] 看板视图（Kanban）
- [ ] 数据统计面板

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开源协议

[MIT License](LICENSE)

## 相关链接

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [uniCloud 官方文档](https://uniapp.dcloud.net.cn/uniCloud/)
- [uni-id 文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id.html)
