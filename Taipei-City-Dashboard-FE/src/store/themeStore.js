import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
	const isDarkMode = ref(true); // 預設為深色模式

	// 從 localStorage 讀取主題設定
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme) {
		isDarkMode.value = savedTheme === 'dark';
	}

	// 切換主題
	function toggleTheme() {
		isDarkMode.value = !isDarkMode.value;
		localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
		applyTheme();
	}

	// 設定主題
	function setTheme(theme) {
		isDarkMode.value = theme === 'dark';
		localStorage.setItem('theme', theme);
		applyTheme();
	}

	// 應用主題到 DOM
	function applyTheme() {
		const root = document.documentElement;
		if (isDarkMode.value) {
			root.classList.remove('light-theme');
			root.classList.add('dark-theme');
		} else {
			root.classList.remove('dark-theme');
			root.classList.add('light-theme');
		}
	}

	// 初始化主題
	function initTheme() {
		applyTheme();
	}

	return {
		isDarkMode,
		toggleTheme,
		setTheme,
		initTheme
	};
}); 