//这是应用的配置页面，App.vue挂载到getApp().globalData.config
export default {
	"h5": {
		"url": "", //	前端网页托管的域名	
		 // 在h5端全局悬浮引导用户下载app的功能 更多自定义要求在/common/openApp.js中修改	
		"openApp": { //如不需要本功能直接移除本节点即可	
			// //点击悬浮下载栏后打开的网页链接
			// "openUrl": '/#/pages/ucenter/invite/invite',
			// //左侧显示的应用名称	
			// "appname": 'uni-starter',
			// //应用的图标	
			// "logo": './static/logo.png',
		}
	},
	"mp": {
		"weixin": {
			//微信小程序原始id，微信小程序分享时
			"id": ""
		}
	},
	//关于应用
	"about": {
		//应用名称
		"appName": "uni-task",
		//应用logo
		"logo": "/static/logo.png",
		//公司名称
		"company": "北京xx网络技术有限公司",
		//口号
		"slogan": "云端一体应用快速开发模版",
		//应用的链接，用于分享到第三方平台和生成关于我们页的二维码
		"download": "",
		//version
		"version":"1.0.0" //用于非app端显示，app端自动获取
	},
	"download":{ //用于生成二合一下载页面
		"ios":"",
		"android":""
	},
	//用于打开应用市场评分界面
	"marketId":{
		"ios":"",
		"android":""
	},
	//配置多语言国际化。i18n为英文单词 internationalization的首末字符i和n，18为中间的字符数 是“国际化”的简称
	"i18n":{
		"enable":false //默认关闭，国际化。如果你想使用国际化相关功能，请改为true
	}
}