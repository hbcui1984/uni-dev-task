import App from './App'
import store from './store'
import {initUniIdPageStore} from './js_sdk/uni-id-pages/store.js'

// #ifdef VUE3
import {createSSRApp} from 'vue'

export function createApp() {
	const app = createSSRApp(App)
	app.use(store)
	initUniIdPageStore(app)
	return {app}
}
// #endif
