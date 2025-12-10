/**
 * 全局主题配置
 * 统一的颜色、间距、字体等设计规范
 */

export default {
	// ===== 主色系 =====
	colors: {
		// 主色 - Vue 绿色系
		primary: '#42b983',
		primaryLight: '#5fd89f',
		primaryLighter: '#7de3b3',
		primaryDark: '#359568',
		primaryDarker: '#2a7a53',

		// 辅助色
		secondary: '#35495e',
		secondaryLight: '#4a5f7a',
		secondaryDark: '#2c3e50',

		// 功能色
		success: '#42b983',  // 与主色一致
		warning: '#f39c12',
		danger: '#e74c3c',
		info: '#3498db',

		// 中性色
		white: '#ffffff',
		black: '#000000',
		gray1: '#f7f8fa',   // 最浅
		gray2: '#e9ecef',
		gray3: '#dee2e6',
		gray4: '#ced4da',
		gray5: '#adb5bd',
		gray6: '#6c757d',
		gray7: '#495057',
		gray8: '#343a40',
		gray9: '#212529',   // 最深

		// 文字颜色
		textPrimary: '#2c3e50',
		textSecondary: '#6c757d',
		textTertiary: '#adb5bd',
		textDisabled: '#ced4da',

		// 背景色
		bgPage: '#f7f8fa',
		bgCard: '#ffffff',
		bgHover: '#f0fdf7',
		bgActive: '#e6fcf5',
		bgDisabled: '#e9ecef',

		// 边框色
		border: '#e9ecef',
		borderLight: '#f7f8fa',
		borderDark: '#dee2e6',

		// 阴影色
		shadow: 'rgba(66, 185, 131, 0.1)',
		shadowDark: 'rgba(0, 0, 0, 0.1)',
	},

	// ===== 间距系统 (基于 4px) =====
	spacing: {
		xs: '4px',
		sm: '8px',
		md: '12px',
		base: '16px',
		lg: '20px',
		xl: '24px',
		xxl: '32px',
		xxxl: '48px',
	},

	// ===== 字体系统 =====
	typography: {
		// 字体大小
		fontSize: {
			xs: '12px',
			sm: '13px',
			base: '14px',
			md: '15px',
			lg: '16px',
			xl: '18px',
			xxl: '20px',
			xxxl: '24px',
			huge: '32px',
		},

		// 字重
		fontWeight: {
			light: 300,
			normal: 400,
			medium: 500,
			semibold: 600,
			bold: 700,
		},

		// 行高
		lineHeight: {
			tight: 1.2,
			normal: 1.5,
			relaxed: 1.75,
			loose: 2,
		},
	},

	// ===== 圆角 =====
	radius: {
		none: '0',
		sm: '4px',
		base: '6px',
		md: '8px',
		lg: '12px',
		xl: '16px',
		round: '50%',
		full: '9999px',
	},

	// ===== 阴影 =====
	shadows: {
		none: 'none',
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
		md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
		xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		primary: '0 4px 14px 0 rgba(66, 185, 131, 0.2)',
		primaryLg: '0 8px 24px 0 rgba(66, 185, 131, 0.25)',
	},

	// ===== 过渡动画 =====
	transition: {
		fast: 'all 0.15s ease',
		base: 'all 0.25s ease',
		slow: 'all 0.35s ease',

		// 具体属性
		color: 'color 0.25s ease',
		background: 'background-color 0.25s ease',
		border: 'border-color 0.25s ease',
		transform: 'transform 0.25s ease',
		opacity: 'opacity 0.25s ease',
	},

	// ===== Z-index 层级 =====
	zIndex: {
		dropdown: 1000,
		sticky: 1020,
		fixed: 1030,
		modalBackdrop: 1040,
		modal: 1050,
		popover: 1060,
		tooltip: 1070,
	},

	// ===== 断点 =====
	breakpoints: {
		xs: '0',
		sm: '576px',
		md: '768px',
		lg: '992px',
		xl: '1200px',
		xxl: '1400px',
	},
}

/**
 * 获取主题颜色（带透明度）
 * @param {string} color - 颜色值
 * @param {number} opacity - 透明度 0-1
 */
export function getColorWithOpacity(color, opacity) {
	// 简单实现，实际项目中可以使用更完善的颜色处理库
	const hex = color.replace('#', '')
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)
	return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * 生成渐变色
 * @param {string} color1 - 起始颜色
 * @param {string} color2 - 结束颜色
 * @param {string} direction - 方向
 */
export function getGradient(color1, color2, direction = 'to right') {
	return `linear-gradient(${direction}, ${color1}, ${color2})`
}
