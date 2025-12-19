import { createLRUCache } from '@/utils/lruCache'

export default {
  namespaced: true,
  state: {
    // 任务列表缓存 - 使用LRU缓存，最多100项，5分钟过期，持久化到本地
    taskCache: createLRUCache({
      max: 100,
      ttl: 5 * 60 * 1000,
      storage: 'local',
      storageKey: 'task_cache'
    }),
    // 项目成员缓存 - 10分钟过期
    memberCache: createLRUCache({
      max: 50,
      ttl: 10 * 60 * 1000,
      storage: 'local',
      storageKey: 'member_cache'
    }),
    // 分组缓存 - 5分钟过期
    groupCache: createLRUCache({
      max: 50,
      ttl: 5 * 60 * 1000,
      storage: 'local',
      storageKey: 'group_cache'
    }),
    // 当前项目ID
    currentProjectId: null,
    // 加载状态
    loading: false,
    // 错误信息
    error: null
  },
  
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_CURRENT_PROJECT(state, projectId) {
      state.currentProjectId = projectId
    },
    // 缓存任务数据 - LRU缓存会自动处理过期和大小限制
    CACHE_TASKS(state, { projectId, tasks }) {
      state.taskCache.set(projectId, tasks)
    },
    // 缓存成员数据
    CACHE_MEMBERS(state, { projectId, members }) {
      state.memberCache.set(projectId, members)
    },
    // 缓存分组数据
    CACHE_GROUPS(state, { projectId, groups }) {
      state.groupCache.set(projectId, groups)
    },
    // 更新单个任务
    UPDATE_TASK(state, { projectId, taskId, updates }) {
      const tasks = state.taskCache.get(projectId)
      if (tasks) {
        const taskIndex = tasks.findIndex(task => task._id === taskId)
        if (taskIndex !== -1) {
          tasks[taskIndex] = { ...tasks[taskIndex], ...updates }
          // 更新缓存
          state.taskCache.set(projectId, tasks)
        }
      }
    },
    // 添加新任务
    ADD_TASK(state, { projectId, task }) {
      const tasks = state.taskCache.get(projectId)
      if (tasks) {
        tasks.unshift(task)
        // 更新缓存
        state.taskCache.set(projectId, tasks)
      }
    },
    // 删除任务
    REMOVE_TASK(state, { projectId, taskId }) {
      const tasks = state.taskCache.get(projectId)
      if (tasks) {
        const taskIndex = tasks.findIndex(task => task._id === taskId)
        if (taskIndex !== -1) {
          tasks.splice(taskIndex, 1)
          // 更新缓存
          state.taskCache.set(projectId, tasks)
        }
      }
    },
    // 清除缓存
    CLEAR_CACHE(state, projectId) {
      if (projectId) {
        state.taskCache.delete(projectId)
        state.memberCache.delete(projectId)
        state.groupCache.delete(projectId)
      } else {
        state.taskCache.clear()
        state.memberCache.clear()
        state.groupCache.clear()
      }
    }
  },
  
  actions: {
    // 加载项目任务
    async loadProjectTasks({ commit, state }, projectId) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)

        // 检查缓存 - LRU缓存会自动处理过期
        const cachedTasks = state.taskCache.get(projectId)
        if (cachedTasks) {
          return cachedTasks
        }

        // 从服务器加载数据
        const db = uniCloud.database()
        const { result } = await db.collection('opendb-task')
          .where(`project_id=='${projectId}' && status!=2`)
          .orderBy('create_date desc')
          .get()

        commit('CACHE_TASKS', { projectId, tasks: result.data })
        return result.data

      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // 加载项目成员
    async loadProjectMembers({ commit, state }, projectId) {
      try {
        // 检查缓存 - LRU缓存会自动处理过期
        const cachedMembers = state.memberCache.get(projectId)
        if (cachedMembers) {
          return cachedMembers
        }

        // 从服务器加载
        const projectObj = uniCloud.importObject('project-co')
        const members = await projectObj.getMembersList(projectId)

        commit('CACHE_MEMBERS', { projectId, members })
        return members

      } catch (error) {
        console.error('加载项目成员失败:', error)
        throw error
      }
    },

    // 加载项目分组
    async loadProjectGroups({ commit, state }, projectId) {
      try {
        // 检查缓存 - LRU缓存会自动处理过期
        const cachedGroups = state.groupCache.get(projectId)
        if (cachedGroups) {
          return cachedGroups
        }

        // 从服务器加载
        const db = uniCloud.database()
        const { result } = await db.collection('task-group')
          .where(`project_id=='${projectId}'`)
          .orderBy('order asc')
          .get()

        commit('CACHE_GROUPS', { projectId, groups: result.data })
        return result.data

      } catch (error) {
        console.error('加载项目分组失败:', error)
        throw error
      }
    },
    
    // 更新任务状态
    async updateTaskStatus({ commit }, { projectId, taskId, status }) {
      try {
        const taskObj = uniCloud.importObject('task-co')
        await taskObj.changeState(taskId, status)
        
        commit('UPDATE_TASK', { 
          projectId, 
          taskId, 
          updates: { status } 
        })
        
        return true
      } catch (error) {
        console.error('更新任务状态失败:', error)
        throw error
      }
    },
    
    // 创建新任务
    async createTask({ commit }, { projectId, taskData }) {
      try {
        const taskObj = uniCloud.importObject('task-co')
        const result = await taskObj.addTask(taskData)
        
        commit('ADD_TASK', { projectId, task: result })
        return result
      } catch (error) {
        console.error('创建任务失败:', error)
        throw error
      }
    },
    
    // 删除任务（通过云对象，包含权限检查）
    async deleteTask({ commit }, { projectId, taskId }) {
      try {
        const taskObj = uniCloud.importObject('task-co')
        const result = await taskObj.deleteTask({ taskId, project_id: projectId })

        if (result.errCode) {
          throw new Error(result.errMsg || '删除失败')
        }

        commit('REMOVE_TASK', { projectId, taskId })
        return true
      } catch (error) {
        console.error('删除任务失败:', error)
        throw error
      }
    },
    
    // 设置当前项目
    setCurrentProject({ commit }, projectId) {
      commit('SET_CURRENT_PROJECT', projectId)
    },
    
    // 清除项目缓存
    clearProjectCache({ commit }, projectId) {
      commit('CLEAR_CACHE', projectId)
    }
  },
  
  getters: {
    // 获取当前项目的任务
    currentProjectTasks: (state) => {
      if (!state.currentProjectId) return []
      const tasks = state.taskCache.get(state.currentProjectId)
      return tasks || []
    },

    // 获取当前项目的成员
    currentProjectMembers: (state) => {
      if (!state.currentProjectId) return []
      const members = state.memberCache.get(state.currentProjectId)
      return members || []
    },

    // 获取当前项目的分组
    currentProjectGroups: (state) => {
      if (!state.currentProjectId) return []
      const groups = state.groupCache.get(state.currentProjectId)
      return groups || []
    },

    // 获取未完成任务数量
    unfinishedTaskCount: (state, getters) => {
      return getters.currentProjectTasks.filter(task => task.status !== 2).length
    },

    // 获取逾期任务数量
    overdueTaskCount: (state, getters) => {
      const now = new Date()
      return getters.currentProjectTasks.filter(task =>
        task.deadline && new Date(task.deadline) < now && task.status !== 2
      ).length
    },

    // 缓存统计信息
    cacheStats: (state) => ({
      tasks: state.taskCache.stats(),
      members: state.memberCache.stats(),
      groups: state.groupCache.stats()
    })
  }
} 