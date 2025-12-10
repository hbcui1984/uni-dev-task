/**
 * 性能优化工具类
 */
class PerformanceUtils {
  /**
   * 防抖函数
   * @param {Function} func 要防抖的函数
   * @param {number} wait 等待时间（毫秒）
   * @param {boolean} immediate 是否立即执行
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait = 300, immediate = false) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        timeout = null
        if (!immediate) func.apply(this, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this, args)
    }
  }

  /**
   * 节流函数
   * @param {Function} func 要节流的函数
   * @param {number} limit 限制时间（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit = 300) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * 图片懒加载
   * @param {string} src 图片地址
   * @param {string} placeholder 占位图地址
   * @returns {Promise} 图片加载Promise
   */
  lazyLoadImage(src, placeholder = '/static/placeholder.png') {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(src)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = src
    })
  }

  /**
   * 批量图片预加载
   * @param {Array<string>} urls 图片URL数组
   * @returns {Promise} 所有图片加载完成的Promise
   */
  preloadImages(urls) {
    const promises = urls.map(url => this.lazyLoadImage(url))
    return Promise.allSettled(promises)
  }

  /**
   * 虚拟滚动计算
   * @param {number} totalCount 总数量
   * @param {number} itemHeight 每项高度
   * @param {number} containerHeight 容器高度
   * @param {number} scrollTop 滚动位置
   * @param {number} buffer 缓冲区大小
   * @returns {Object} 虚拟滚动信息
   */
  calculateVirtualScroll(totalCount, itemHeight, containerHeight, scrollTop, buffer = 5) {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
    const endIndex = Math.min(totalCount - 1, startIndex + visibleCount + buffer * 2)
    
    return {
      startIndex,
      endIndex,
      visibleCount,
      totalHeight: totalCount * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }

  /**
   * 内存使用监控
   * @returns {Object} 内存使用信息
   */
  getMemoryUsage() {
    // #ifdef H5
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    // #endif
    
    return {
      used: 0,
      total: 0,
      limit: 0
    }
  }

  /**
   * 性能监控
   * @param {string} name 监控名称
   * @param {Function} fn 要监控的函数
   * @returns {Promise} 函数执行结果
   */
  async measurePerformance(name, fn) {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      const result = await fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      console.log(`Performance [${name}]:`, {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        memory: {
          used: `${((endMemory.used - startMemory.used) / 1024 / 1024).toFixed(2)}MB`,
          total: `${(endMemory.total / 1024 / 1024).toFixed(2)}MB`
        }
      })
      
      return result
    } catch (error) {
      const endTime = performance.now()
      console.error(`Performance [${name}] failed:`, {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        error: error.message
      })
      throw error
    }
  }

  /**
   * 数据分页
   * @param {Array} data 原始数据
   * @param {number} page 页码（从1开始）
   * @param {number} pageSize 每页大小
   * @returns {Object} 分页结果
   */
  paginate(data, page = 1, pageSize = 20) {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const total = data.length
    const totalPages = Math.ceil(total / pageSize)
    
    return {
      data: data.slice(startIndex, endIndex),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * 数据缓存
   */
  createCache(maxSize = 100) {
    const cache = new Map()
    
    return {
      get(key) {
        return cache.get(key)
      },
      set(key, value, ttl = 5 * 60 * 1000) { // 默认5分钟过期
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value
          cache.delete(firstKey)
        }
        
        cache.set(key, {
          value,
          expireAt: Date.now() + ttl
        })
      },
      has(key) {
        const item = cache.get(key)
        if (!item) return false
        
        if (Date.now() > item.expireAt) {
          cache.delete(key)
          return false
        }
        
        return true
      },
      delete(key) {
        return cache.delete(key)
      },
      clear() {
        cache.clear()
      },
      size() {
        return cache.size
      }
    }
  }

  /**
   * 请求队列管理
   */
  createRequestQueue(maxConcurrent = 3) {
    const queue = []
    let running = 0
    
    const processQueue = async () => {
      if (running >= maxConcurrent || queue.length === 0) {
        return
      }
      
      const { request, resolve, reject } = queue.shift()
      running++
      
      try {
        const result = await request()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        running--
        processQueue()
      }
    }
    
    return {
      add(request) {
        return new Promise((resolve, reject) => {
          queue.push({ request, resolve, reject })
          processQueue()
        })
      },
      getQueueLength() {
        return queue.length
      },
      getRunningCount() {
        return running
      }
    }
  }
}

// 创建单例实例
const performanceUtils = new PerformanceUtils()

export default performanceUtils 