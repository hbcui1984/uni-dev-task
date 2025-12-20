<!--
 * 我的任务页面
 *
 * 功能说明：
 * - 展示当前用户被分配的所有未完成任务
 * - 任务按所属项目分组显示
 * - 支持折叠/展开项目分组
 * - 显示任务截止日期、优先级、逾期状态
 * - 点击任务跳转到任务详情
 *
 * 路由：/pages/opendb-task/myTask
-->
<template>
	<view class="my-task-page">
		<!-- 点击遮罩关闭下拉框 -->
		<view v-if="openAssigneeTaskId || openPriorityTaskId" class="dropdown-backdrop" @click="closeAllDropdowns"></view>

		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">我的任务</text>
			<text class="task-summary" v-if="totalCount > 0">共 {{ totalCount }} 项待办</text>
		</view>

		<!-- 加载中 -->
		<view v-if="loading" class="loading-container">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 无任务 -->
		<view v-else-if="!projectList || projectList.length === 0" class="empty-container">
			<uni-icons type="checkbox" size="48" color="#ccc"></uni-icons>
			<text class="empty-text">暂无分配给你的任务</text>
			<text class="empty-hint">当有人将任务分配给你时，会显示在这里</text>
		</view>

		<!-- 任务列表按项目分组 -->
		<view v-else class="project-list">
			<view v-for="project in projectList" :key="project._id" class="project-section">
				<!-- 项目标题 -->
				<view class="project-header" @click="toggleProject(project._id)">
					<view class="project-info">
						<uni-icons :type="expandedProjects[project._id] ? 'bottom' : 'right'" size="16" color="#42b983"></uni-icons>
						<text class="project-name">{{ project.name }}</text>
						<text class="project-count">({{ project.taskCount }})</text>
					</view>
					<view class="project-action" @click.stop="goToProject(project._id, project.name)">
						<uni-icons type="right" size="14" color="#999"></uni-icons>
					</view>
				</view>

				<!-- 项目下的任务分组 -->
				<view v-show="expandedProjects[project._id]" class="task-groups">
					<!-- 未分组的任务 -->
					<view v-if="project.ungroupedTasks && project.ungroupedTasks.length > 0" class="task-group">
						<view class="task-list-custom">
							<template v-for="task in project.ungroupedTasks" :key="task._id">
								<!-- 情况1: 子任务，父任务负责人不是自己 - 显示灰色父任务行 -->
								<view v-if="task.parentTask" class="parent-task-row" @click="goToTaskDetail(task.parentTask._id, project._id)">
									<checkbox disabled class="checkbox-disabled" />
									<view class="task-content">
										<text class="parent-task-title">{{ task.parentTask.title }}</text>
									</view>
									<view class="task-meta">
										<view class="parent-task-assignee">{{ task.parentTask.assigneeName || '无负责人' }}</view>
									</view>
								</view>
								<!-- 情况1的子任务行（缩进） -->
								<view v-if="task.parentTask" class="task-row task-row--child" @click="goToTaskDetail(task._id, project._id)">
									<checkbox @click.stop="finishTask(task._id)" color="#42b983" />
									<view class="task-content">
										<text class="task-title">{{ task.title }}</text>
									</view>
									<view class="task-meta">
										<view class="deadline deadline--clickable" :class="{ 'overdue': isOverdue(task.deadline) }" @click.stop="openDeadlineEditor(task, project._id, $event)">
											{{ task.deadline ? formatDeadline(task.deadline) : '设置日期' }}
										</view>
										<view class="priority-wrapper">
											<text class="priority-tag priority-tag--clickable" :class="`priority-${task.priority || 0}`" @click.stop="togglePriorityDropdown(task)">
												{{ getPriorityText(task.priority) }}
											</text>
											<view v-if="openPriorityTaskId === task._id" class="priority-dropdown" @click.stop>
												<view v-for="opt in priorityOptions" :key="opt.value" class="priority-option" :class="{ 'priority-option--selected': currentPriority === opt.value }" @click.stop="selectPriority(task._id, opt.value)">
													<view class="priority-option-dot" :style="{ backgroundColor: opt.color }"></view>
													<text class="priority-option-label">{{ opt.label }}</text>
													<uni-icons v-if="currentPriority === opt.value" type="checkmarkempty" size="16" color="#42b983"></uni-icons>
												</view>
											</view>
										</view>
										<view class="assignee-wrapper">
											<view class="assignee assignee--clickable" @click.stop="openAssigneeEditor(task, project._id)">
												<image v-if="userAvatar" :src="userAvatar" class="assignee-avatar" mode="aspectFill"></image>
												<view v-else class="assignee-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(userNickname) }">
													{{ userNickname.slice(0,1) }}
												</view>
											</view>
											<!-- 负责人下拉选择 -->
											<view v-if="openAssigneeTaskId === task._id" class="assignee-dropdown" @click.stop>
												<view class="assignee-dropdown-search">
													<uni-icons type="search" size="16" color="#999"></uni-icons>
													<input type="text" v-model="assigneeSearchKeyword" placeholder="输入关键字查询" class="assignee-search-input" />
													<uni-icons type="person" size="16" color="#999"></uni-icons>
												</view>
												<scroll-view scroll-y class="assignee-dropdown-list">
													<view class="assignee-option" :class="{ 'assignee-option--selected': !currentAssigneeId }" @click.stop="selectAssignee(task._id, null)">
														<view class="assignee-option-avatar assignee-option-avatar--empty"><uni-icons type="person" size="20" color="#42b983"></uni-icons></view>
														<text class="assignee-option-name">无负责人</text>
														<uni-icons v-if="!currentAssigneeId" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
													</view>
													<view v-for="member in filteredMembers" :key="member.value" class="assignee-option" :class="{ 'assignee-option--selected': currentAssigneeId === member.value }" @click.stop="selectAssignee(task._id, member.value)">
														<image v-if="member.avatar" :src="member.avatar" class="assignee-option-avatar" mode="aspectFill"></image>
														<view v-else class="assignee-option-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(member.text) }">{{ member.text.slice(0,1) }}</view>
														<text class="assignee-option-name">{{ member.text }}</text>
														<uni-icons v-if="currentAssigneeId === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
													</view>
												</scroll-view>
											</view>
										</view>
									</view>
								</view>
								<!-- 情况2: 父任务（自己负责），正常显示 -->
								<template v-if="!task.parentTask">
									<view class="task-row" @click="goToTaskDetail(task._id, project._id)">
										<checkbox @click.stop="finishTask(task._id)" color="#42b983" />
										<view class="task-content">
											<text class="task-title">{{ task.title }}</text>
										</view>
										<view class="task-meta">
											<view class="deadline deadline--clickable" :class="{ 'overdue': isOverdue(task.deadline) }" @click.stop="openDeadlineEditor(task, project._id, $event)">
												{{ task.deadline ? formatDeadline(task.deadline) : '设置日期' }}
											</view>
											<view class="priority-wrapper">
												<text class="priority-tag priority-tag--clickable" :class="`priority-${task.priority || 0}`" @click.stop="togglePriorityDropdown(task)">
													{{ getPriorityText(task.priority) }}
												</text>
												<view v-if="openPriorityTaskId === task._id" class="priority-dropdown" @click.stop>
													<view v-for="opt in priorityOptions" :key="opt.value" class="priority-option" :class="{ 'priority-option--selected': currentPriority === opt.value }" @click.stop="selectPriority(task._id, opt.value)">
														<view class="priority-option-dot" :style="{ backgroundColor: opt.color }"></view>
														<text class="priority-option-label">{{ opt.label }}</text>
														<uni-icons v-if="currentPriority === opt.value" type="checkmarkempty" size="16" color="#42b983"></uni-icons>
													</view>
												</view>
											</view>
											<view class="assignee-wrapper">
												<view class="assignee assignee--clickable" @click.stop="openAssigneeEditor(task, project._id)">
													<image v-if="userAvatar" :src="userAvatar" class="assignee-avatar" mode="aspectFill"></image>
													<view v-else class="assignee-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(userNickname) }">
														{{ userNickname.slice(0,1) }}
													</view>
												</view>
												<!-- 负责人下拉选择 -->
												<view v-if="openAssigneeTaskId === task._id" class="assignee-dropdown" @click.stop>
													<view class="assignee-dropdown-search">
														<uni-icons type="search" size="16" color="#999"></uni-icons>
														<input type="text" v-model="assigneeSearchKeyword" placeholder="输入关键字查询" class="assignee-search-input" />
														<uni-icons type="person" size="16" color="#999"></uni-icons>
													</view>
													<scroll-view scroll-y class="assignee-dropdown-list">
														<view class="assignee-option" :class="{ 'assignee-option--selected': !currentAssigneeId }" @click.stop="selectAssignee(task._id, null)">
															<view class="assignee-option-avatar assignee-option-avatar--empty"><uni-icons type="person" size="20" color="#42b983"></uni-icons></view>
															<text class="assignee-option-name">无负责人</text>
															<uni-icons v-if="!currentAssigneeId" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
														<view v-for="member in filteredMembers" :key="member.value" class="assignee-option" :class="{ 'assignee-option--selected': currentAssigneeId === member.value }" @click.stop="selectAssignee(task._id, member.value)">
															<image v-if="member.avatar" :src="member.avatar" class="assignee-option-avatar" mode="aspectFill"></image>
															<view v-else class="assignee-option-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(member.text) }">{{ member.text.slice(0,1) }}</view>
															<text class="assignee-option-name">{{ member.text }}</text>
															<uni-icons v-if="currentAssigneeId === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
													</scroll-view>
												</view>
											</view>
										</view>
									</view>
									<!-- 父任务下的子任务（缩进显示） -->
									<view v-for="child in task.children" :key="child._id" class="task-row task-row--child" @click="goToTaskDetail(child._id, project._id)">
										<checkbox @click.stop="finishTask(child._id)" color="#42b983" />
										<view class="task-content">
											<text class="task-title">{{ child.title }}</text>
										</view>
										<view class="task-meta">
											<view class="deadline deadline--clickable" :class="{ 'overdue': isOverdue(child.deadline) }" @click.stop="openDeadlineEditor(child, project._id, $event)">
												{{ child.deadline ? formatDeadline(child.deadline) : '设置日期' }}
											</view>
											<view class="priority-wrapper">
												<text class="priority-tag priority-tag--clickable" :class="`priority-${child.priority || 0}`" @click.stop="togglePriorityDropdown(child)">
													{{ getPriorityText(child.priority) }}
												</text>
												<view v-if="openPriorityTaskId === child._id" class="priority-dropdown" @click.stop>
													<view v-for="opt in priorityOptions" :key="opt.value" class="priority-option" :class="{ 'priority-option--selected': currentPriority === opt.value }" @click.stop="selectPriority(child._id, opt.value)">
														<view class="priority-option-dot" :style="{ backgroundColor: opt.color }"></view>
														<text class="priority-option-label">{{ opt.label }}</text>
														<uni-icons v-if="currentPriority === opt.value" type="checkmarkempty" size="16" color="#42b983"></uni-icons>
													</view>
												</view>
											</view>
											<view class="assignee-wrapper">
												<view class="assignee assignee--clickable" @click.stop="openAssigneeEditor(child, project._id)">
													<image v-if="userAvatar" :src="userAvatar" class="assignee-avatar" mode="aspectFill"></image>
													<view v-else class="assignee-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(userNickname) }">
														{{ userNickname.slice(0,1) }}
													</view>
												</view>
												<!-- 负责人下拉选择 -->
												<view v-if="openAssigneeTaskId === child._id" class="assignee-dropdown" @click.stop>
													<view class="assignee-dropdown-search">
														<uni-icons type="search" size="16" color="#999"></uni-icons>
														<input type="text" v-model="assigneeSearchKeyword" placeholder="输入关键字查询" class="assignee-search-input" />
														<uni-icons type="person" size="16" color="#999"></uni-icons>
													</view>
													<scroll-view scroll-y class="assignee-dropdown-list">
														<view class="assignee-option" :class="{ 'assignee-option--selected': !currentAssigneeId }" @click.stop="selectAssignee(child._id, null)">
															<view class="assignee-option-avatar assignee-option-avatar--empty"><uni-icons type="person" size="20" color="#42b983"></uni-icons></view>
															<text class="assignee-option-name">无负责人</text>
															<uni-icons v-if="!currentAssigneeId" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
														<view v-for="member in filteredMembers" :key="member.value" class="assignee-option" :class="{ 'assignee-option--selected': currentAssigneeId === member.value }" @click.stop="selectAssignee(child._id, member.value)">
															<image v-if="member.avatar" :src="member.avatar" class="assignee-option-avatar" mode="aspectFill"></image>
															<view v-else class="assignee-option-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(member.text) }">{{ member.text.slice(0,1) }}</view>
															<text class="assignee-option-name">{{ member.text }}</text>
															<uni-icons v-if="currentAssigneeId === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
													</scroll-view>
												</view>
											</view>
										</view>
									</view>
								</template>
							</template>
						</view>
					</view>

					<!-- 分组的任务 -->
					<view v-for="group in project.groups" :key="group._id" class="task-group">
						<view class="group-header">
							<text class="group-name">{{ group.name }}</text>
							<text class="group-count">({{ group.tasks.length }})</text>
						</view>
						<view class="task-list-custom">
							<template v-for="task in group.tasks" :key="task._id">
								<!-- 情况1: 子任务，父任务负责人不是自己 - 显示灰色父任务行 -->
								<view v-if="task.parentTask" class="parent-task-row" @click="goToTaskDetail(task.parentTask._id, project._id)">
									<checkbox disabled class="checkbox-disabled" />
									<view class="task-content">
										<text class="parent-task-title">{{ task.parentTask.title }}</text>
									</view>
									<view class="task-meta">
										<view class="parent-task-assignee">{{ task.parentTask.assigneeName || '无负责人' }}</view>
									</view>
								</view>
								<!-- 情况1的子任务行（缩进） -->
								<view v-if="task.parentTask" class="task-row task-row--child" @click="goToTaskDetail(task._id, project._id)">
									<checkbox @click.stop="finishTask(task._id)" color="#42b983" />
									<view class="task-content">
										<text class="task-title">{{ task.title }}</text>
									</view>
									<view class="task-meta">
										<view class="deadline deadline--clickable" :class="{ 'overdue': isOverdue(task.deadline) }" @click.stop="openDeadlineEditor(task, project._id, $event)">
											{{ task.deadline ? formatDeadline(task.deadline) : '设置日期' }}
										</view>
										<view class="priority-wrapper">
											<text class="priority-tag priority-tag--clickable" :class="`priority-${task.priority || 0}`" @click.stop="togglePriorityDropdown(task)">
												{{ getPriorityText(task.priority) }}
											</text>
											<view v-if="openPriorityTaskId === task._id" class="priority-dropdown" @click.stop>
												<view v-for="opt in priorityOptions" :key="opt.value" class="priority-option" :class="{ 'priority-option--selected': currentPriority === opt.value }" @click.stop="selectPriority(task._id, opt.value)">
													<view class="priority-option-dot" :style="{ backgroundColor: opt.color }"></view>
													<text class="priority-option-label">{{ opt.label }}</text>
													<uni-icons v-if="currentPriority === opt.value" type="checkmarkempty" size="16" color="#42b983"></uni-icons>
												</view>
											</view>
										</view>
										<view class="assignee-wrapper">
											<view class="assignee assignee--clickable" @click.stop="openAssigneeEditor(task, project._id)">
												<image v-if="userAvatar" :src="userAvatar" class="assignee-avatar" mode="aspectFill"></image>
												<view v-else class="assignee-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(userNickname) }">
													{{ userNickname.slice(0,1) }}
												</view>
											</view>
											<view v-if="openAssigneeTaskId === task._id" class="assignee-dropdown" @click.stop>
												<view class="assignee-dropdown-search">
													<uni-icons type="search" size="16" color="#999"></uni-icons>
													<input type="text" v-model="assigneeSearchKeyword" placeholder="输入关键字查询" class="assignee-search-input" />
													<uni-icons type="person" size="16" color="#999"></uni-icons>
												</view>
												<scroll-view scroll-y class="assignee-dropdown-list">
													<view class="assignee-option" :class="{ 'assignee-option--selected': !currentAssigneeId }" @click.stop="selectAssignee(task._id, null)">
														<view class="assignee-option-avatar assignee-option-avatar--empty"><uni-icons type="person" size="20" color="#42b983"></uni-icons></view>
														<text class="assignee-option-name">无负责人</text>
														<uni-icons v-if="!currentAssigneeId" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
													</view>
													<view v-for="member in filteredMembers" :key="member.value" class="assignee-option" :class="{ 'assignee-option--selected': currentAssigneeId === member.value }" @click.stop="selectAssignee(task._id, member.value)">
														<image v-if="member.avatar" :src="member.avatar" class="assignee-option-avatar" mode="aspectFill"></image>
														<view v-else class="assignee-option-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(member.text) }">{{ member.text.slice(0,1) }}</view>
														<text class="assignee-option-name">{{ member.text }}</text>
														<uni-icons v-if="currentAssigneeId === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
													</view>
												</scroll-view>
											</view>
										</view>
									</view>
								</view>
								<!-- 情况2: 父任务（自己负责），正常显示 -->
								<template v-if="!task.parentTask">
									<view class="task-row" @click="goToTaskDetail(task._id, project._id)">
										<checkbox @click.stop="finishTask(task._id)" color="#42b983" />
										<view class="task-content">
											<text class="task-title">{{ task.title }}</text>
										</view>
										<view class="task-meta">
											<view class="deadline deadline--clickable" :class="{ 'overdue': isOverdue(task.deadline) }" @click.stop="openDeadlineEditor(task, project._id, $event)">
												{{ task.deadline ? formatDeadline(task.deadline) : '设置日期' }}
											</view>
											<view class="priority-wrapper">
												<text class="priority-tag priority-tag--clickable" :class="`priority-${task.priority || 0}`" @click.stop="togglePriorityDropdown(task)">
													{{ getPriorityText(task.priority) }}
												</text>
												<view v-if="openPriorityTaskId === task._id" class="priority-dropdown" @click.stop>
													<view v-for="opt in priorityOptions" :key="opt.value" class="priority-option" :class="{ 'priority-option--selected': currentPriority === opt.value }" @click.stop="selectPriority(task._id, opt.value)">
														<view class="priority-option-dot" :style="{ backgroundColor: opt.color }"></view>
														<text class="priority-option-label">{{ opt.label }}</text>
														<uni-icons v-if="currentPriority === opt.value" type="checkmarkempty" size="16" color="#42b983"></uni-icons>
													</view>
												</view>
											</view>
											<view class="assignee-wrapper">
												<view class="assignee assignee--clickable" @click.stop="openAssigneeEditor(task, project._id)">
													<image v-if="userAvatar" :src="userAvatar" class="assignee-avatar" mode="aspectFill"></image>
													<view v-else class="assignee-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(userNickname) }">
														{{ userNickname.slice(0,1) }}
													</view>
												</view>
												<view v-if="openAssigneeTaskId === task._id" class="assignee-dropdown" @click.stop>
													<view class="assignee-dropdown-search">
														<uni-icons type="search" size="16" color="#999"></uni-icons>
														<input type="text" v-model="assigneeSearchKeyword" placeholder="输入关键字查询" class="assignee-search-input" />
														<uni-icons type="person" size="16" color="#999"></uni-icons>
													</view>
													<scroll-view scroll-y class="assignee-dropdown-list">
														<view class="assignee-option" :class="{ 'assignee-option--selected': !currentAssigneeId }" @click.stop="selectAssignee(task._id, null)">
															<view class="assignee-option-avatar assignee-option-avatar--empty"><uni-icons type="person" size="20" color="#42b983"></uni-icons></view>
															<text class="assignee-option-name">无负责人</text>
															<uni-icons v-if="!currentAssigneeId" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
														<view v-for="member in filteredMembers" :key="member.value" class="assignee-option" :class="{ 'assignee-option--selected': currentAssigneeId === member.value }" @click.stop="selectAssignee(task._id, member.value)">
															<image v-if="member.avatar" :src="member.avatar" class="assignee-option-avatar" mode="aspectFill"></image>
															<view v-else class="assignee-option-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(member.text) }">{{ member.text.slice(0,1) }}</view>
															<text class="assignee-option-name">{{ member.text }}</text>
															<uni-icons v-if="currentAssigneeId === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
													</scroll-view>
												</view>
											</view>
										</view>
									</view>
									<!-- 父任务下的子任务（缩进显示） -->
									<view v-for="child in task.children" :key="child._id" class="task-row task-row--child" @click="goToTaskDetail(child._id, project._id)">
										<checkbox @click.stop="finishTask(child._id)" color="#42b983" />
										<view class="task-content">
											<text class="task-title">{{ child.title }}</text>
										</view>
										<view class="task-meta">
											<view class="deadline deadline--clickable" :class="{ 'overdue': isOverdue(child.deadline) }" @click.stop="openDeadlineEditor(child, project._id, $event)">
												{{ child.deadline ? formatDeadline(child.deadline) : '设置日期' }}
											</view>
											<view class="priority-wrapper">
												<text class="priority-tag priority-tag--clickable" :class="`priority-${child.priority || 0}`" @click.stop="togglePriorityDropdown(child)">
													{{ getPriorityText(child.priority) }}
												</text>
												<view v-if="openPriorityTaskId === child._id" class="priority-dropdown" @click.stop>
													<view v-for="opt in priorityOptions" :key="opt.value" class="priority-option" :class="{ 'priority-option--selected': currentPriority === opt.value }" @click.stop="selectPriority(child._id, opt.value)">
														<view class="priority-option-dot" :style="{ backgroundColor: opt.color }"></view>
														<text class="priority-option-label">{{ opt.label }}</text>
														<uni-icons v-if="currentPriority === opt.value" type="checkmarkempty" size="16" color="#42b983"></uni-icons>
													</view>
												</view>
											</view>
											<view class="assignee-wrapper">
												<view class="assignee assignee--clickable" @click.stop="openAssigneeEditor(child, project._id)">
													<image v-if="userAvatar" :src="userAvatar" class="assignee-avatar" mode="aspectFill"></image>
													<view v-else class="assignee-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(userNickname) }">
														{{ userNickname.slice(0,1) }}
													</view>
												</view>
												<view v-if="openAssigneeTaskId === child._id" class="assignee-dropdown" @click.stop>
													<view class="assignee-dropdown-search">
														<uni-icons type="search" size="16" color="#999"></uni-icons>
														<input type="text" v-model="assigneeSearchKeyword" placeholder="输入关键字查询" class="assignee-search-input" />
														<uni-icons type="person" size="16" color="#999"></uni-icons>
													</view>
													<scroll-view scroll-y class="assignee-dropdown-list">
														<view class="assignee-option" :class="{ 'assignee-option--selected': !currentAssigneeId }" @click.stop="selectAssignee(child._id, null)">
															<view class="assignee-option-avatar assignee-option-avatar--empty"><uni-icons type="person" size="20" color="#42b983"></uni-icons></view>
															<text class="assignee-option-name">无负责人</text>
															<uni-icons v-if="!currentAssigneeId" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
														<view v-for="member in filteredMembers" :key="member.value" class="assignee-option" :class="{ 'assignee-option--selected': currentAssigneeId === member.value }" @click.stop="selectAssignee(child._id, member.value)">
															<image v-if="member.avatar" :src="member.avatar" class="assignee-option-avatar" mode="aspectFill"></image>
															<view v-else class="assignee-option-avatar assignee-avatar-text" :style="{ backgroundColor: getAvatarColor(member.text) }">{{ member.text.slice(0,1) }}</view>
															<text class="assignee-option-name">{{ member.text }}</text>
															<uni-icons v-if="currentAssigneeId === member.value" type="checkmarkempty" size="18" color="#42b983"></uni-icons>
														</view>
													</scroll-view>
												</view>
											</view>
										</view>
									</view>
								</template>
							</template>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 快速编辑组件 -->
		<TaskQuickEdit ref="quickEdit" @update="onQuickEditUpdate" />
	</view>
</template>

<script>
import { formatDeadline, isOverdue, getPriorityText, getAvatarColor } from '@/utils/task.js'
import { getCurrentUser } from '@/utils/auth.js'
import TaskQuickEdit from '@/components/TaskQuickEdit/TaskQuickEdit.vue'

export default {
	components: {
		TaskQuickEdit
	},
	data() {
		return {
			loading: true,
			userId: '',
			userNickname: '',
			userAvatar: '',
			projectList: [],
			expandedProjects: {},
			totalCount: 0,
			// 负责人下拉选择
			openAssigneeTaskId: null,
			currentAssigneeId: null,
			currentProjectIdForAssignee: null,
			assigneeSearchKeyword: '',
			memberList: [],
			membersLoading: false,
			// 优先级下拉选择
			openPriorityTaskId: null,
			currentPriority: 0,
			priorityOptions: [
				{ value: 0, label: '较低', color: '#6c757d' },
				{ value: 1, label: '普通', color: '#42b983' },
				{ value: 2, label: '较高', color: '#f39c12' },
				{ value: 3, label: '最高', color: '#e74c3c' }
			]
		}
	},
	onLoad() {
		const userInfo = getCurrentUser()
		this.userId = userInfo._id
		this.userNickname = userInfo.nickname || '我'
		this.userAvatar = userInfo.avatar_file?.url || ''
		this.loadMyTasks()
	},
	onShow() {
		// 每次显示页面时刷新数据
		if (this.userId) {
			this.loadMyTasks()
		}
	},
	onPullDownRefresh() {
		this.loadMyTasks().finally(() => {
			uni.stopPullDownRefresh()
		})
	},
	computed: {
		filteredMembers() {
			if (!this.assigneeSearchKeyword) {
				return this.memberList
			}
			const keyword = this.assigneeSearchKeyword.toLowerCase()
			return this.memberList.filter(member =>
				member.text.toLowerCase().includes(keyword)
			)
		}
	},
	methods: {
		async loadMyTasks() {
			if (!this.userId) {
				this.loading = false
				return
			}

			this.loading = true

			try {
				const db = uniCloud.database()
				const dbCmd = db.command

				// 查询分配给当前用户的所有未完成任务
				const { result: taskResult } = await db.collection('opendb-task')
					.where({
						assignee: this.userId,
						status: dbCmd.neq(2) // 未完成的任务
					})
					.field('_id,title,deadline,priority,status,project_id,group_id,parent_id,assignee')
					.orderBy('deadline', 'asc')
					.limit(500)
					.get()

				const tasks = taskResult.data || []

				if (tasks.length === 0) {
					this.projectList = []
					this.totalCount = 0
					this.loading = false
					return
				}

				// 获取所有涉及的项目ID
				const projectIds = [...new Set(tasks.map(t => t.project_id).filter(Boolean))]

				// 获取所有涉及的分组ID
				const groupIds = [...new Set(tasks.map(t => t.group_id).filter(Boolean))]

				// 获取所有父任务ID
				const parentIds = [...new Set(tasks.map(t => t.parent_id).filter(Boolean))]

				// 查询项目信息
				let projectMap = {}
				if (projectIds.length > 0) {
					const { result: projectResult } = await db.collection('opendb-projects')
						.where({
							_id: dbCmd.in(projectIds)
						})
						.field('_id,name')
						.get()

					projectResult.data.forEach(p => {
						projectMap[p._id] = p
					})
				}

				// 查询父任务信息（使用 JQL 联表查询获取负责人信息）
				let parentTaskMap = {}
				if (parentIds.length > 0) {
					const taskTemp = db.collection('opendb-task')
						.where({ _id: dbCmd.in(parentIds) })
						.field('_id,title,assignee,group_id')
						.getTemp()
					const userTemp = db.collection('uni-id-users')
						.field('_id,nickname')
						.getTemp()

					const { result: parentResult } = await db.collection(taskTemp, userTemp)
						.get()

					parentResult.data.forEach(p => {
						// JQL联表后 assignee 是数组格式 [{_id, nickname}]
						if (Array.isArray(p.assignee) && p.assignee.length > 0) {
							p.assigneeName = p.assignee[0].nickname
						}
						parentTaskMap[p._id] = p
					})
				}

				// 过滤掉已删除项目的任务（项目不存在于 projectMap 中的任务）
				const validTasks = tasks.filter(task => {
					return task.project_id && projectMap[task.project_id]
				})
				this.totalCount = validTasks.length

				if (validTasks.length === 0) {
					this.projectList = []
					this.loading = false
					return
				}

				// 查询分组信息
				let groupMap = {}
				// 合并任务的分组ID和父任务的分组ID
				const allGroupIds = [...new Set([
					...groupIds,
					...Object.values(parentTaskMap).map(p => p.group_id).filter(Boolean)
				])]
				if (allGroupIds.length > 0) {
					const { result: groupResult } = await db.collection('task-group')
						.where({
							_id: dbCmd.in(allGroupIds)
						})
						.field('_id,name,order')
						.get()

					groupResult.data.forEach(g => {
						groupMap[g._id] = g
					})
				}

				// 按项目组织任务（使用过滤后的有效任务）
				const projectTaskMap = {}

				// 先区分父任务和子任务
				const parentTasks = validTasks.filter(t => !t.parent_id)
				const childTasks = validTasks.filter(t => t.parent_id)

				// 创建父任务ID到子任务的映射
				const parentToChildrenMap = {}
				childTasks.forEach(child => {
					if (!parentToChildrenMap[child.parent_id]) {
						parentToChildrenMap[child.parent_id] = []
					}
					parentToChildrenMap[child.parent_id].push(child)
				})

				// 处理父任务（包含自己分配的子任务）
				parentTasks.forEach(task => {
					const projectId = task.project_id
					if (!projectTaskMap[projectId]) {
						projectTaskMap[projectId] = {
							_id: projectId,
							name: projectMap[projectId].name,
							taskCount: 0,
							ungroupedTasks: [],
							groupedTasks: {}
						}
					}

					projectTaskMap[projectId].taskCount++

					// 挂载子任务
					task.children = parentToChildrenMap[task._id] || []
					// 子任务也计入总数，但不重复添加到列表
					task.children.forEach(() => {
						projectTaskMap[projectId].taskCount++
					})

					// 确定分组
					const effectiveGroupId = task.group_id

					if (effectiveGroupId && groupMap[effectiveGroupId]) {
						const groupId = effectiveGroupId
						if (!projectTaskMap[projectId].groupedTasks[groupId]) {
							projectTaskMap[projectId].groupedTasks[groupId] = {
								_id: groupId,
								name: groupMap[groupId].name,
								order: groupMap[groupId].order || 0,
								tasks: []
							}
						}
						projectTaskMap[projectId].groupedTasks[groupId].tasks.push(task)
					} else {
						projectTaskMap[projectId].ungroupedTasks.push(task)
					}
				})

				// 处理父任务不在列表中的子任务（父任务负责人不是自己）
				childTasks.forEach(task => {
					// 如果父任务已在列表中（负责人是自己），则跳过（已经作为子任务挂载）
					if (parentTasks.find(p => p._id === task.parent_id)) {
						return
					}

					const projectId = task.project_id
					if (!projectTaskMap[projectId]) {
						projectTaskMap[projectId] = {
							_id: projectId,
							name: projectMap[projectId].name,
							taskCount: 0,
							ungroupedTasks: [],
							groupedTasks: {}
						}
					}

					projectTaskMap[projectId].taskCount++

					// 添加父任务信息
					if (parentTaskMap[task.parent_id]) {
						task.parentTask = parentTaskMap[task.parent_id]
					}

					// 确定分组：子任务跟随父任务的分组
					const effectiveGroupId = task.parentTask
						? task.parentTask.group_id
						: task.group_id

					if (effectiveGroupId && groupMap[effectiveGroupId]) {
						const groupId = effectiveGroupId
						if (!projectTaskMap[projectId].groupedTasks[groupId]) {
							projectTaskMap[projectId].groupedTasks[groupId] = {
								_id: groupId,
								name: groupMap[groupId].name,
								order: groupMap[groupId].order || 0,
								tasks: []
							}
						}
						projectTaskMap[projectId].groupedTasks[groupId].tasks.push(task)
					} else {
						projectTaskMap[projectId].ungroupedTasks.push(task)
					}
				})

				// 转换为数组并排序
				this.projectList = Object.values(projectTaskMap).map(project => ({
					...project,
					groups: Object.values(project.groupedTasks).sort((a, b) => (a.order || 0) - (b.order || 0))
				})).sort((a, b) => b.taskCount - a.taskCount) // 按任务数量降序

				// 默认展开所有项目
				this.projectList.forEach(p => {
					if (this.expandedProjects[p._id] === undefined) {
						this.expandedProjects[p._id] = true
					}
				})

			} catch (e) {
				console.error('加载我的任务失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		toggleProject(projectId) {
			this.expandedProjects[projectId] = !this.expandedProjects[projectId]
		},

		goToProject(projectId, projectName) {
			uni.navigateTo({
				url: `/pages/opendb-task/list?id=${projectId}&name=${encodeURIComponent(projectName)}`
			})
		},

		goToTaskDetail(taskId, projectId) {
			uni.navigateTo({
				url: `/pages/opendb-task/detail?id=${taskId}&pid=${projectId}`,
				events: {
					refreshTaskList: () => {
						this.loadMyTasks()
					}
				}
			})
		},

		async finishTask(taskId) {
			try {
				await uniCloud.database().collection('opendb-task').doc(taskId).update({
					status: 2
				})
				uni.showToast({
					title: '已完成',
					icon: 'success'
				})
				this.loadMyTasks()
			} catch (e) {
				console.error('完成任务失败:', e)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			}
		},

		formatDeadline,
		isOverdue,
		getPriorityText,
		getAvatarColor,

		// ========== 快速编辑 ==========

		// 判断是否 PC 端
		isPC() {
			// #ifdef H5
			return window.innerWidth >= 768
			// #endif
			return false
		},

		openDeadlineEditor(task, projectId, event) {
			const taskId = task._id
			const currentDeadline = task.deadline

			// PC端：直接在这里处理，参考 TaskList.vue 的实现
			if (this.isPC()) {
				// #ifdef H5
				const input = document.createElement('input')
				input.type = 'date'
				input.style.position = 'fixed'
				input.style.width = '1px'
				input.style.height = '1px'
				input.style.border = 'none'
				input.style.padding = '0'
				input.style.margin = '0'
				input.style.zIndex = '9999'

				// 获取点击位置
				let left = '50%'
				let top = '50%'

				try {
					// uni-app 事件包装
					if (event && event.mp && event.mp.currentTarget) {
						const rect = event.mp.currentTarget.getBoundingClientRect()
						left = rect.left + 'px'
						top = rect.bottom + 'px'
					} else if (event && event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
						const rect = event.currentTarget.getBoundingClientRect()
						left = rect.left + 'px'
						top = rect.bottom + 'px'
					} else if (event && event.target && typeof event.target.getBoundingClientRect === 'function') {
						const rect = event.target.getBoundingClientRect()
						left = rect.left + 'px'
						top = rect.bottom + 'px'
					} else if (event && event.detail) {
						left = (event.detail.x || event.detail.clientX || window.innerWidth / 2) + 'px'
						top = (event.detail.y || event.detail.clientY || window.innerHeight / 2) + 'px'
					}
				} catch (e) {
					console.warn('无法获取点击位置', e)
				}

				input.style.left = left
				input.style.top = top
				input.value = currentDeadline ? new Date(currentDeadline).toISOString().split('T')[0] : ''

				input.onchange = async (e) => {
					await this.saveDeadline(taskId, e.target.value)
					if (input.parentNode) {
						document.body.removeChild(input)
					}
				}

				input.onblur = () => {
					setTimeout(() => {
						if (input.parentNode) {
							document.body.removeChild(input)
						}
					}, 200)
				}

				document.body.appendChild(input)

				setTimeout(() => {
					try {
						input.showPicker()
					} catch (e) {
						input.focus()
						input.click()
					}
				}, 0)
				// #endif
			} else {
				// 移动端：使用 TaskQuickEdit 组件
				const taskWithProject = { ...task, project_id: projectId }
				this.$refs.quickEdit.openDeadlineEditor(taskWithProject, null)
			}
		},

		async saveDeadline(taskId, value) {
			try {
				const db = uniCloud.database()
				const deadline = value ? new Date(value).getTime() : null

				await db.collection('opendb-task').doc(taskId).update({
					deadline: deadline
				})

				// 局部更新本地数据
				this.updateLocalTask(taskId, { deadline })

				uni.showToast({
					title: deadline ? '截止日期已更新' : '截止日期已清除',
					icon: 'success'
				})
			} catch (error) {
				console.error('更新截止日期失败:', error)
				uni.showToast({
					title: '更新失败',
					icon: 'none'
				})
			}
		},

		/**
		 * 局部更新本地任务数据
		 * @param {string} taskId - 任务ID
		 * @param {object} updates - 要更新的字段
		 */
		updateLocalTask(taskId, updates) {
			for (const project of this.projectList) {
				// 查找未分组任务
				for (const task of project.ungroupedTasks || []) {
					if (task._id === taskId) {
						Object.assign(task, updates)
						return true
					}
					// 查找子任务
					for (const child of task.children || []) {
						if (child._id === taskId) {
							Object.assign(child, updates)
							return true
						}
					}
				}
				// 查找分组任务
				for (const group of project.groups || []) {
					for (const task of group.tasks || []) {
						if (task._id === taskId) {
							Object.assign(task, updates)
							return true
						}
						// 查找子任务
						for (const child of task.children || []) {
							if (child._id === taskId) {
								Object.assign(child, updates)
								return true
							}
						}
					}
				}
			}
			return false
		},

		// ========== 优先级下拉选择 ==========

		togglePriorityDropdown(task) {
			// 关闭其他下拉框
			this.closeAssigneeDropdown()

			if (this.openPriorityTaskId === task._id) {
				this.closePriorityDropdown()
			} else {
				this.openPriorityTaskId = task._id
				this.currentPriority = task.priority || 0
			}
		},

		closePriorityDropdown() {
			this.openPriorityTaskId = null
			this.currentPriority = 0
		},

		selectPriority(taskId, priority) {
			// 先关闭下拉框
			this.closePriorityDropdown()

			// 查找任务并保存旧值
			let oldPriority = null
			for (const project of this.projectList) {
				for (const task of project.ungroupedTasks || []) {
					if (task._id === taskId) {
						oldPriority = task.priority
						break
					}
					for (const child of task.children || []) {
						if (child._id === taskId) {
							oldPriority = child.priority
							break
						}
					}
				}
				if (oldPriority !== null) break
				for (const group of project.groups || []) {
					for (const task of group.tasks || []) {
						if (task._id === taskId) {
							oldPriority = task.priority
							break
						}
						for (const child of task.children || []) {
							if (child._id === taskId) {
								oldPriority = child.priority
								break
							}
						}
					}
					if (oldPriority !== null) break
				}
				if (oldPriority !== null) break
			}

			// 乐观更新 UI
			this.updateLocalTask(taskId, { priority })

			const priorityText = this.priorityOptions.find(p => p.value === priority)?.label || '未知'
			uni.showToast({
				title: `优先级: ${priorityText}`,
				icon: 'success'
			})

			// 后台同步到服务器
			const db = uniCloud.database()
			db.collection('opendb-task').doc(taskId).update({
				priority: priority
			}).catch(error => {
				console.error('更新优先级失败:', error)
				// 回滚
				if (oldPriority !== null) {
					this.updateLocalTask(taskId, { priority: oldPriority })
				}
				uni.showToast({
					title: '更新失败，已恢复',
					icon: 'none'
				})
			})
		},

		closeAllDropdowns() {
			this.closeAssigneeDropdown()
			this.closePriorityDropdown()
		},

		// ========== 负责人下拉选择 ==========

		async openAssigneeEditor(task, projectId) {
			// 关闭其他下拉框
			this.closePriorityDropdown()

			if (this.openAssigneeTaskId === task._id) {
				this.closeAssigneeDropdown()
				return
			}

			this.openAssigneeTaskId = task._id
			this.currentAssigneeId = task.assignee || ''
			this.currentProjectIdForAssignee = projectId
			this.assigneeSearchKeyword = ''

			// 加载项目成员
			if (this.memberList.length === 0 || this.currentProjectIdForAssignee !== projectId) {
				await this.loadProjectMembers(projectId)
			}
		},

		async loadProjectMembers(projectId) {
			this.membersLoading = true
			try {
				const projectObj = uniCloud.importObject('project-co')
				const res = await projectObj.getMembersList(projectId)
				this.memberList = res.map(member => ({
					value: member._id,
					text: member.nickname,
					avatar: member.avatar
				}))
			} catch (e) {
				console.error('加载项目成员失败:', e)
				this.memberList = []
			} finally {
				this.membersLoading = false
			}
		},

		closeAssigneeDropdown() {
			this.openAssigneeTaskId = null
			this.currentAssigneeId = null
			this.assigneeSearchKeyword = ''
		},

		// 切换负责人 - 乐观更新
		selectAssignee(taskId, memberId) {
			const oldMember = this.memberList.find(m => m.value === this.currentAssigneeId)
			const newMember = this.memberList.find(m => m.value === memberId)
			const oldName = oldMember ? oldMember.text : '无'
			const newName = newMember ? newMember.text : '无'

			// 立即关闭下拉框并显示提示
			this.closeAssigneeDropdown()
			uni.showToast({
				title: `负责人: ${oldName} → ${newName}`,
				icon: 'none',
				duration: 2000
			})

			// 乐观更新：如果负责人不再是自己，从列表中移除任务
			let removedTaskData = null
			let removedFromProject = null
			let removedFromGroup = null

			if (memberId !== this.userId) {
				// 保存任务数据以便回滚
				const result = this.findAndRemoveTask(taskId)
				removedTaskData = result.task
				removedFromProject = result.projectId
				removedFromGroup = result.groupId
			} else {
				// 局部更新 assignee
				this.updateLocalTask(taskId, {
					assignee: [{
						_id: memberId,
						nickname: newMember?.text || '未知'
					}]
				})
			}

			// 后台同步到服务器
			const db = uniCloud.database()
			db.collection('opendb-task').doc(taskId).update({
				assignee: memberId || ''
			}).catch(error => {
				console.error('更新负责人失败:', error)
				uni.showToast({
					title: '更新失败，已恢复',
					icon: 'none'
				})
				// 回滚：恢复被移除的任务或重新加载
				if (removedTaskData) {
					this.loadMyTasks() // 简单回滚方式
				}
			})
		},

		// 查找并移除任务（返回任务数据用于回滚）
		findAndRemoveTask(taskId) {
			for (const project of this.projectList) {
				// 检查未分组任务
				const ungroupedIndex = project.ungroupedTasks.findIndex(t => t._id === taskId)
				if (ungroupedIndex !== -1) {
					const task = project.ungroupedTasks.splice(ungroupedIndex, 1)[0]
					return { task, projectId: project._id, groupId: null }
				}
				// 检查子任务
				for (const parentTask of project.ungroupedTasks) {
					if (parentTask.children) {
						const childIndex = parentTask.children.findIndex(c => c._id === taskId)
						if (childIndex !== -1) {
							const task = parentTask.children.splice(childIndex, 1)[0]
							return { task, projectId: project._id, groupId: null, parentId: parentTask._id }
						}
					}
				}
				// 检查分组任务
				for (const group of project.groups) {
					const taskIndex = group.tasks.findIndex(t => t._id === taskId)
					if (taskIndex !== -1) {
						const task = group.tasks.splice(taskIndex, 1)[0]
						return { task, projectId: project._id, groupId: group._id }
					}
					// 检查分组内的子任务
					for (const parentTask of group.tasks) {
						if (parentTask.children) {
							const childIndex = parentTask.children.findIndex(c => c._id === taskId)
							if (childIndex !== -1) {
								const task = parentTask.children.splice(childIndex, 1)[0]
								return { task, projectId: project._id, groupId: group._id, parentId: parentTask._id }
							}
						}
					}
				}
			}
			return { task: null, projectId: null, groupId: null }
		},

		onQuickEditUpdate(data) {
			// 根据更新类型进行局部更新
			if (data.type === 'priority') {
				this.updateLocalTask(data.taskId, { priority: data.value })
			} else if (data.type === 'deadline') {
				this.updateLocalTask(data.taskId, { deadline: data.value })
			} else if (data.type === 'assignee') {
				// 负责人变更后，任务可能不再属于"我的任务"，需要重新加载
				// 但如果只是切换给自己，可以局部更新
				if (data.value === this.userId) {
					this.updateLocalTask(data.taskId, { assignee: data.value })
				} else {
					// 任务分配给了别人，从列表中移除并重新加载
					this.loadMyTasks()
				}
			} else {
				// 其他情况，刷新列表
				this.loadMyTasks()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.my-task-page {
	min-height: 100vh;
	background: linear-gradient(to bottom, #fafdfb, #f7f8fa);
	padding: 24px;
	padding-bottom: calc(24px + var(--tabbar-height, 50px) + var(--safe-area-bottom, 0px));

	@media screen and (max-width: 767px) {
		padding: 16px;
		padding-bottom: calc(16px + var(--tabbar-height, 50px) + var(--safe-area-bottom, 0px));
	}

	@media screen and (min-width: 768px) {
		padding: 32px 48px;
		padding-bottom: 32px;
		max-width: 1200px;
		margin: 0 auto;
	}
}

.page-header {
	margin-bottom: 24px;
	display: flex;
	align-items: baseline;
	gap: 12px;

	@media screen and (max-width: 767px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		margin-bottom: 16px;
	}
}

.page-title {
	font-size: 24px;
	font-weight: 700;
	color: #2c3e50;

	@media screen and (max-width: 767px) {
		font-size: 22px;
	}

	@media screen and (min-width: 768px) {
		font-size: 28px;
	}
}

.task-summary {
	font-size: 14px;
	color: #6c757d;
}

.loading-container,
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80px 20px;
	text-align: center;
}

.loading-text {
	color: #6c757d;
	font-size: 15px;
}

.empty-text {
	margin-top: 16px;
	font-size: 16px;
	color: #6c757d;
}

.empty-hint {
	margin-top: 8px;
	font-size: 13px;
	color: #adb5bd;
}

.project-list {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.project-section {
	background-color: #ffffff;
	border-radius: 12px;
	overflow: visible;
	box-shadow: 0 2px 8px rgba(66, 185, 131, 0.08);
}

.project-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 20px;
	background: linear-gradient(135deg, #42b983 0%, #359568 100%);
	cursor: pointer;
	transition: all 0.25s ease;
}

.project-header:hover {
	background: linear-gradient(135deg, #3aa876 0%, #2d7d58 100%);
}

.project-info {
	display: flex;
	align-items: center;
	gap: 8px;
}


.project-name {
	font-size: 16px;
	font-weight: 600;
	color: #ffffff;
}

.project-count {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.8);
}

.project-action {
	padding: 4px;
	border-radius: 4px;
	transition: all 0.25s ease;
}


.project-action:hover {
	background-color: rgba(255, 255, 255, 0.15);
}

.task-groups {
	padding: 0;
	overflow: visible;
}

.task-group {
	border-bottom: 1px solid #f1f3f5;
	overflow: visible;
}

.task-group:last-child {
	border-bottom: none;
}

.group-header {
	display: flex;
	align-items: center;
	padding: 10px 20px 10px 32px;
	background-color: #f0fdf7;
	border-left: 3px solid #42b983;
	gap: 6px;
}

.group-name {
	font-size: 14px;
	font-weight: 600;
	color: #2c3e50;
}

.group-count {
	font-size: 12px;
	color: #6c757d;
}

.task-list {
	background-color: transparent;
	padding-left: 24px;
}

.task-content {
	flex: 1;
	min-width: 0;
}

.task-title-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.priority-tag {
	padding: 2px 0;
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
	flex-shrink: 0;
}

.priority-0 {
	color: #6c757d;
}

.priority-1 {
	color: #42b983;
}

.priority-2 {
	color: #f39c12;
}

.priority-3 {
	color: #e74c3c;
	font-weight: 600;
}

.task-title {
	font-size: 14px;
	color: #2c3e50;
	line-height: 1.5;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.task-meta {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	overflow: visible;

	@media screen and (max-width: 767px) {
		gap: 6px;
	}
}

.deadline {
	font-size: 12px;
	color: #6c757d;
	padding: 4px 10px;
	border-radius: 6px;
	background-color: #f7f8fa;
	white-space: nowrap;
}

.deadline.overdue {
	color: #e74c3c;
	background-color: #fdecea;
}

/* 可点击的截止日期和优先级样式 */
.deadline--clickable {
	cursor: pointer;
	transition: all 0.2s ease;
}

.deadline--clickable:hover {
	background-color: #e6fcf5;
	color: #42b983;
}

.deadline--clickable.overdue:hover {
	background-color: #fad4d4;
}

.priority-tag--clickable {
	cursor: pointer;
	padding: 4px 10px;
	border-radius: 6px;
	transition: all 0.2s ease;
}

.priority-tag--clickable:hover {
	background-color: #f0f0f0;
}

.assignee--clickable {
	cursor: pointer;
	padding: 4px;
	margin: -4px;
	border-radius: 50%;
	transition: all 0.2s ease;
}

.assignee--clickable:hover {
	background-color: #e6fcf5;
}


/* 自定义任务列表 */
.task-list-custom {
	padding-left: 24px;
	overflow: visible;
}

/* 父任务行样式 */
.parent-task-row {
	display: flex;
	align-items: center;
	padding: 10px 16px 10px 0;
	cursor: pointer;
	transition: all 0.2s ease;
	border-bottom: 1px solid #f1f3f5;
}

.parent-task-row:hover {
	background-color: #f8f9fa;
}

/* 灰色禁用的 checkbox */
.checkbox-disabled {
	opacity: 0.4;
	pointer-events: none;
}

.parent-task-title {
	font-size: 14px;
	color: #999;
	line-height: 1.5;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.parent-task-meta {
	display: flex;
	align-items: center;
	margin-left: 12px;
}

.parent-task-assignee {
	font-size: 12px;
	color: #adb5bd;
	padding: 4px 10px;
	border-radius: 6px;
	background-color: #f7f8fa;
	white-space: nowrap;
}

/* 任务行样式 */
.task-row {
	display: flex;
	align-items: center;
	padding: 10px 16px 10px 0;
	cursor: pointer;
	transition: all 0.2s ease;
	border-bottom: 1px solid #f1f3f5;
	overflow: visible;
}

.task-row:hover {
	background-color: #f0fdf7;
}

.task-row:last-child {
	border-bottom: none;
}

/* 子任务缩进样式 */
.task-row--child {
	padding-left: 24px;
	background-color: #fafdfb;
}

.task-row--child:hover {
	background-color: #f0fdf7;
}

/* 负责人头像样式 */
.assignee {
	display: flex;
	align-items: center;
	margin-left: 8px;
}

.assignee-avatar {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	flex-shrink: 0;
}

.assignee-avatar-text {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	color: #fff;
	font-weight: 500;
}

/* ========== 负责人下拉选择 ========== */
.dropdown-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	background-color: transparent;
}

/* 优先级选择器 */
.priority-wrapper {
	position: relative;
}

.priority-dropdown {
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: 8px;
	width: 140px;
	background-color: #fff;
	border-radius: 10px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	overflow: hidden;
	padding: 8px 0;
}

.priority-option {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.priority-option:hover {
	background-color: #f5f5f5;
}

.priority-option--selected {
	background-color: #e6fcf5;
}

.priority-option--selected:hover {
	background-color: #d1f7e8;
}

.priority-option-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
}

.priority-option-label {
	flex: 1;
	font-size: 14px;
	color: #333;
}

.assignee-wrapper {
	position: relative;
}

/* 负责人下拉选择框 */
.assignee-dropdown {
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: 8px;
	width: 240px;
	background-color: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	overflow: hidden;
}

.assignee-dropdown-search {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid #f0f0f0;
}

.assignee-search-input {
	flex: 1;
	border: none;
	outline: none;
	font-size: 14px;
	color: #333;
	background: transparent;
}

.assignee-search-input::placeholder {
	color: #999;
}

.assignee-dropdown-list {
	max-height: 240px;
	padding: 8px 0;
}

.assignee-option {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.assignee-option:hover {
	background-color: #d1f7e8;
}

.assignee-option--selected {
	background-color: #e6fcf5;
}

.assignee-option--selected:hover {
	background-color: #c3f5de;
}

.assignee-option-avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.assignee-option-avatar.assignee-avatar-text {
	color: #fff;
	font-size: 14px;
	font-weight: 600;
}

.assignee-option-avatar--empty {
	background-color: #e6fcf5;
}

.assignee-option-name {
	flex: 1;
	font-size: 14px;
	color: #333;
}
</style>

<!-- 无 scoped 样式块，用于覆盖子组件样式（兼容小程序） -->
<style lang="scss">
/* myTask - 项目信息区域图标 */
.my-task-page .project-info .uni-icons {
	color: #ffffff !important;
}

/* myTask - 项目操作按钮图标 */
.my-task-page .project-action .uni-icons {
	color: rgba(255, 255, 255, 0.7) !important;
}

.my-task-page .project-action:hover .uni-icons {
	color: #ffffff !important;
}

/* myTask - 列表项样式优化 */
.my-task-page .uni-list-item {
	transition: all 0.25s ease;
}

.my-task-page .uni-list-item:hover {
	background-color: #f0fdf7;
}

/* myTask - Checkbox 样式优化 */
.my-task-page checkbox .uni-checkbox-input {
	border-color: #42b983;
}

.my-task-page checkbox .uni-checkbox-input.uni-checkbox-input-checked {
	background-color: #42b983;
	border-color: #42b983;
}
</style>
