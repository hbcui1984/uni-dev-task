export function getLayoutMetrics() {
	const systemInfo = uni.getSystemInfoSync()
	const windowWidth = systemInfo.windowWidth || 375

	return {
		safeAreaTop: systemInfo.statusBarHeight || 0,
		windowWidth,
		isMobile: windowWidth <= 767
	}
}

export function createTopInsetStyle(metrics, options = {}) {
	const mobileBase = options.mobileBase ?? 16
	const desktopBase = options.desktopBase ?? 24
	const basePadding = metrics.isMobile ? mobileBase : desktopBase

	return {
		paddingTop: `${metrics.safeAreaTop + basePadding}px`
	}
}
