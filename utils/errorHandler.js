/**
 * 统一错误处理工具
 */
class ErrorHandler {
  constructor() {
    this.errorMap = {
      'TOKEN_INVALID': '登录已过期，请重新登录',
      'PARAM_IS_NULL': '参数不能为空',
      'PERMISSION_DENIED': '权限不足',
      'NETWORK_ERROR': '网络连接失败，请检查网络设置',
      'DATABASE_ERROR': '数据库操作失败',
      'FILE_UPLOAD_ERROR': '文件上传失败',
      'DEFAULT': '操作失败，请稍后重试'
    }
  }

  /**
   * 处理错误并显示用户友好的提示
   * @param {Error|Object} error 错误对象
   * @param {Object} options 配置选项
   */
  handleError(error, options = {}) {
    const {
      showToast = true,
      showModal = false,
      logError = true,
      fallbackMessage = '操作失败，请稍后重试'
    } = options

    // 解析错误信息
    const errorInfo = this.parseError(error)
    
    // 记录错误日志
    if (logError) {
      this.logError(errorInfo)
    }

    // 显示错误提示
    if (showToast) {
      this.showErrorToast(errorInfo.message || fallbackMessage)
    }

    if (showModal) {
      this.showErrorModal(errorInfo.message || fallbackMessage)
    }

    return errorInfo
  }

  /**
   * 解析错误对象
   * @param {Error|Object} error 
   * @returns {Object} 解析后的错误信息
   */
  parseError(error) {
    if (!error) {
      return {
        code: 'UNKNOWN',
        message: '未知错误',
        original: error
      }
    }

    // 处理uniCloud错误
    if (error.errCode) {
      return {
        code: error.errCode,
        message: this.errorMap[error.errCode] || error.errMsg || '操作失败',
        original: error
      }
    }

    // 处理网络错误
    if (error.statusCode) {
      return {
        code: 'NETWORK_ERROR',
        message: this.getNetworkErrorMessage(error.statusCode),
        original: error
      }
    }

    // 处理普通Error对象
    if (error.message) {
      return {
        code: 'GENERAL_ERROR',
        message: error.message,
        original: error
      }
    }

    return {
      code: 'UNKNOWN',
      message: '未知错误',
      original: error
    }
  }

  /**
   * 获取网络错误信息
   * @param {number} statusCode 
   * @returns {string}
   */
  getNetworkErrorMessage(statusCode) {
    const statusMap = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '禁止访问',
      404: '请求的资源不存在',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时'
    }
    return statusMap[statusCode] || '网络请求失败'
  }

  /**
   * 显示错误提示
   * @param {string} message 
   */
  showErrorToast(message) {
    uni.showToast({
      title: message,
      icon: 'error',
      duration: 3000
    })
  }

  /**
   * 显示错误弹窗
   * @param {string} message 
   */
  showErrorModal(message) {
    uni.showModal({
      title: '错误提示',
      content: message,
      showCancel: false,
      confirmText: '确定'
    })
  }

  /**
   * 记录错误日志
   * @param {Object} errorInfo 
   */
  logError(errorInfo) {
    const logData = {
      timestamp: new Date().toISOString(),
      code: errorInfo.code,
      message: errorInfo.message,
      stack: errorInfo.original?.stack,
      page: this.getCurrentPage(),
      userAgent: this.getUserAgent()
    }

    console.error('Error Log:', logData)
    
    // 可以在这里添加错误上报逻辑
    // this.reportError(logData)
  }

  /**
   * 获取当前页面信息
   * @returns {string}
   */
  getCurrentPage() {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      return pages[pages.length - 1].route
    }
    return 'unknown'
  }

  /**
   * 获取用户代理信息
   * @returns {string}
   */
  getUserAgent() {
    // #ifdef H5
    return navigator.userAgent
    // #endif
    
    // #ifdef APP-PLUS
    return plus.navigator.getUserAgent()
    // #endif
    
    // #ifdef MP
    return 'miniprogram'
    // #endif
    
    return 'unknown'
  }

  /**
   * 错误上报（可选）
   * @param {Object} logData 
   */
  async reportError(logData) {
    try {
      // 这里可以集成第三方错误监控服务
      // 如 Sentry、Bugsnag 等
      console.log('Error reported:', logData)
    } catch (error) {
      console.error('Error reporting failed:', error)
    }
  }

  /**
   * 创建异步操作的错误处理包装器
   * @param {Function} asyncFn 异步函数
   * @param {Object} options 错误处理选项
   * @returns {Function} 包装后的函数
   */
  wrapAsync(asyncFn, options = {}) {
    return async (...args) => {
      try {
        return await asyncFn(...args)
      } catch (error) {
        this.handleError(error, options)
        throw error
      }
    }
  }

  /**
   * 验证数据
   * @param {Object} data 数据对象
   * @param {Object} rules 验证规则
   * @returns {Object} 验证结果
   */
  validateData(data, rules) {
    const errors = []
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field]
      
      // 必填验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rule.message || `${field} 不能为空`
        })
        continue
      }
      
      // 类型验证
      if (rule.type && value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== rule.type) {
          errors.push({
            field,
            message: rule.message || `${field} 类型错误，期望 ${rule.type}，实际 ${actualType}`
          })
          continue
        }
      }
      
      // 长度验证
      if (rule.minLength && value && value.length < rule.minLength) {
        errors.push({
          field,
          message: rule.message || `${field} 长度不能少于 ${rule.minLength} 个字符`
        })
        continue
      }
      
      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors.push({
          field,
          message: rule.message || `${field} 长度不能超过 ${rule.maxLength} 个字符`
        })
        continue
      }
      
      // 自定义验证
      if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value, data)
        if (result !== true) {
          errors.push({
            field,
            message: result || rule.message || `${field} 验证失败`
          })
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 创建单例实例
const errorHandler = new ErrorHandler()

export default errorHandler 