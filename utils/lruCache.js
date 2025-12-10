/**
 * LRU (Least Recently Used) 缓存实现
 * 支持大小限制、TTL过期、持久化存储
 */

class LRUCache {
	/**
	 * @param {Object} options 配置选项
	 * @param {Number} options.max 最大缓存数量，默认100
	 * @param {Number} options.ttl 过期时间（毫秒），默认5分钟
	 * @param {String} options.storage 存储类型 'none' | 'local' | 'session'，默认'none'
	 * @param {String} options.storageKey 存储键名
	 */
	constructor(options = {}) {
		this.max = options.max || 100
		this.ttl = options.ttl || 5 * 60 * 1000 // 默认5分钟
		this.storage = options.storage || 'none'
		this.storageKey = options.storageKey || 'lru_cache'

		// 使用Map保证插入顺序
		this.cache = new Map()

		// 从存储中恢复缓存
		if (this.storage !== 'none') {
			this._loadFromStorage()
		}
	}

	/**
	 * 从本地存储加载缓存
	 */
	_loadFromStorage() {
		try {
			let data
			if (this.storage === 'local') {
				data = uni.getStorageSync(this.storageKey)
			} else if (this.storage === 'session') {
				// uni-app 没有 sessionStorage，使用内存
				return
			}

			if (data) {
				const entries = JSON.parse(data)
				const now = Date.now()

				// 恢复未过期的数据
				entries.forEach(([key, entry]) => {
					if (now - entry.timestamp < this.ttl) {
						this.cache.set(key, entry)
					}
				})
			}
		} catch (e) {
			console.error('从存储加载缓存失败:', e)
		}
	}

	/**
	 * 保存缓存到本地存储
	 */
	_saveToStorage() {
		if (this.storage === 'none') {
			return
		}

		try {
			const entries = Array.from(this.cache.entries())
			const data = JSON.stringify(entries)

			if (this.storage === 'local') {
				uni.setStorageSync(this.storageKey, data)
			}
		} catch (e) {
			console.error('保存缓存到存储失败:', e)
		}
	}

	/**
	 * 获取缓存
	 * @param {String} key 键
	 * @returns {*} 值，如果不存在或已过期返回undefined
	 */
	get(key) {
		if (!this.cache.has(key)) {
			return undefined
		}

		const entry = this.cache.get(key)
		const now = Date.now()

		// 检查是否过期
		if (now - entry.timestamp > this.ttl) {
			this.cache.delete(key)
			this._saveToStorage()
			return undefined
		}

		// LRU: 移到最后（最近使用）
		this.cache.delete(key)
		entry.timestamp = now // 更新时间戳
		this.cache.set(key, entry)

		return entry.value
	}

	/**
	 * 设置缓存
	 * @param {String} key 键
	 * @param {*} value 值
	 */
	set(key, value) {
		// 如果已存在，先删除（为了更新顺序）
		if (this.cache.has(key)) {
			this.cache.delete(key)
		}

		// 检查是否超过最大数量
		if (this.cache.size >= this.max) {
			// 删除最老的（第一个）
			const firstKey = this.cache.keys().next().value
			this.cache.delete(firstKey)
		}

		// 添加新条目
		this.cache.set(key, {
			value,
			timestamp: Date.now()
		})

		// 持久化
		this._saveToStorage()
	}

	/**
	 * 检查键是否存在且未过期
	 * @param {String} key 键
	 * @returns {Boolean}
	 */
	has(key) {
		return this.get(key) !== undefined
	}

	/**
	 * 删除缓存
	 * @param {String} key 键
	 * @returns {Boolean} 是否删除成功
	 */
	delete(key) {
		const result = this.cache.delete(key)
		if (result) {
			this._saveToStorage()
		}
		return result
	}

	/**
	 * 清空缓存
	 */
	clear() {
		this.cache.clear()
		this._saveToStorage()
	}

	/**
	 * 获取缓存大小
	 * @returns {Number}
	 */
	get size() {
		return this.cache.size
	}

	/**
	 * 清理过期缓存
	 * @returns {Number} 清理的数量
	 */
	prune() {
		const now = Date.now()
		let count = 0

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.ttl) {
				this.cache.delete(key)
				count++
			}
		}

		if (count > 0) {
			this._saveToStorage()
		}

		return count
	}

	/**
	 * 获取所有键
	 * @returns {Array}
	 */
	keys() {
		return Array.from(this.cache.keys())
	}

	/**
	 * 获取所有值
	 * @returns {Array}
	 */
	values() {
		const now = Date.now()
		const values = []

		for (const entry of this.cache.values()) {
			if (now - entry.timestamp <= this.ttl) {
				values.push(entry.value)
			}
		}

		return values
	}

	/**
	 * 获取缓存统计信息
	 * @returns {Object}
	 */
	stats() {
		const now = Date.now()
		let expiredCount = 0

		for (const entry of this.cache.values()) {
			if (now - entry.timestamp > this.ttl) {
				expiredCount++
			}
		}

		return {
			size: this.cache.size,
			max: this.max,
			expired: expiredCount,
			active: this.cache.size - expiredCount
		}
	}
}

/**
 * 创建LRU缓存实例
 * @param {Object} options 配置选项
 * @returns {LRUCache}
 */
export function createLRUCache(options) {
	return new LRUCache(options)
}

export default LRUCache
