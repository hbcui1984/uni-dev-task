# uni-task - 轻量级团队任务管理系统

基于 `uni-app` & `uniCloud` 开发的团队任务管理系统，一套代码，多端运行。适用于中小型团队的项目协作与任务跟踪。

## 功能特性

### 项目管理
- 项目创建、编辑、归档
- 项目成员管理（管理员/普通成员权限区分）
- 项目动态实时展示

### 任务管理
- 任务增删改查
- 任务状态流转（待处理/已完成/已归档）
- 优先级设置（较低/普通/较高/最高）
- 截止日期设置
- 任务分组管理
- 子任务支持
- 附件上传与管理

### 团队协作
- 任务分配与负责人管理
- 操作日志自动记录
- 「我的任务」个人视图
- 多成员协同工作

## 界面预览

### PC端

项目列表:

![](https://mp-2da038dd-5cd3-481f-a00b-ddb04ea75ed6.cdn.bspapp.com/project-list.png)

任务列表:

![](https://mp-2da038dd-5cd3-481f-a00b-ddb04ea75ed6.cdn.bspapp.com/task-list.png)

支持子任务和评论：

![](https://mp-2da038dd-5cd3-481f-a00b-ddb04ea75ed6.cdn.bspapp.com/sub-task-list.png)

任务动态自动记录：

![](https://mp-2da038dd-5cd3-481f-a00b-ddb04ea75ed6.cdn.bspapp.com/task-log.png)

快捷查看“我的任务“：

![](https://mp-2da038dd-5cd3-481f-a00b-ddb04ea75ed6.cdn.bspapp.com/my-task.png)

### 微信小程序

![](https://mp-2da038dd-5cd3-481f-a00b-ddb04ea75ed6.cdn.bspapp.com/uni-task-weixin.jpg)

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | uni-app (Vue 3) |
| 状态管理 | Vuex |
| UI 组件 | uni-ui |
| 后端服务 | uniCloud（支付宝云） |
| 用户认证 | uni-id |
| 数据库 | uniCloud 云数据库 |


## 快速开始

### 1. 导入项目

在 HBuilderX 中导入本插件，或从 GitHub 克隆：

```bash
git clone https://github.com/hbcui1984/uni-task.git
```

### 2. 关联云服务空间

1. 右键点击 `uniCloud-alipay` 目录
2. 选择「关联云服务空间」
3. 如没有云服务空间，请先创建一个

### 3. 上传云函数

1. 右键点击 `uniCloud-aliyun/cloudfunctions` 目录
2. 选择「上传所有云函数、公共模块及 actions」

### 4. 初始化数据库

1. 右键点击 `uniCloud-aliyun/database` 目录
2. 选择「初始化云数据库」

### 5. 运行项目

在 HBuilderX 中直接运行到浏览器/模拟器/真机。

## 目录结构

```
uni-task/
├── components/              # 自定义组件
│   ├── TaskList/           # 任务列表（支持拖拽）
│   └── TaskDetail/         # 任务详情组件集
├── pages/
│   ├── opendb-projects/    # 项目管理
│   ├── opendb-task/        # 任务管理
│   ├── task-logs/          # 项目动态
│   └── ucenter/            # 用户中心
├── store/                   # Vuex 状态管理
├── utils/                   # 工具函数
├── common/                  # 公共样式与主题
└── uniCloud-alipay/        # 云开发
    ├── cloudfunctions/     # 云函数/云对象
    └── database/           # 数据库 Schema
```

## 数据库设计

| 数据表 | 说明 |
|--------|------|
| opendb-projects | 项目信息 |
| opendb-task | 任务数据 |
| task-group | 任务分组 |
| opendb-task-logs | 操作日志 |
| uni-id-users | 用户信息（uni-id） |

## 主题定制

项目支持自定义主题色，默认使用 Vue 绿（#42b983）。

修改 `common/theme.js`：

```javascript
colors: {
    primary: '#42b983',  // 修改为你的主题色
}
```

修改 `common/global.scss`：

```scss
:root {
    --color-primary: #42b983;  // 修改为你的主题色
}
```

**预设主题色参考：**

| 主题 | 色值 |
|------|------|
| Vue 绿（默认） | `#42b983` |
| 天空蓝 | `#2979ff` |
| 珊瑚橙 | `#ff6b6b` |
| 薰衣紫 | `#7c4dff` |

## 常见问题

### Q: 如何修改登录方式？

本项目使用 uni-id-pages 处理登录，支持账号密码、短信验证码、微信登录等多种方式。配置文件位于：

```
uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json
```

### Q: 如何切换云服务商？

1. 将 `uniCloud-aliyun` 目录重命名为 `uniCloud-tcb`（腾讯云）
2. 重新关联腾讯云服务空间
3. 上传云函数并初始化数据库

### Q: 如何部署到自己的服务器？

uniCloud 为 Serverless 架构，无需自建服务器。

如需私有化部署，可参考[uni云开发软件版](https://doc.dcloud.net.cn/uniCloud/software/)

## 开源协议

[MIT License](https://opensource.org/licenses/MIT)

可免费商用，欢迎二次开发。

## 交流反馈

如有问题或建议，欢迎：

1. 提交 [GitHub Issue](https://github.com/hbcui1984/uni-task/issues)
2. 在插件市场评论区留言

---

**如果这个项目对你有帮助，欢迎 Star 支持！**
