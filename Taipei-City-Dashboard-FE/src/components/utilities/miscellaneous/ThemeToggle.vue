<!-- Developed by Taipei Urban Intelligence Center 2023-2024-->

<script setup>
import { useThemeStore } from '../../../store/themeStore';

const themeStore = useThemeStore();
</script>

<template>
  <div class="theme-toggle">
    <button
      class="theme-toggle-button"
      @click="themeStore.toggleTheme"
      :title="themeStore.isDarkMode ? '切換到淺色模式' : '切換到深色模式'"
    >
      <span class="theme-toggle-icon">
        {{ themeStore.isDarkMode ? 'light_mode' : 'dark_mode' }}
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.theme-toggle {
	display: flex;
	align-items: center;

	&-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background-color: transparent;
		border: 1px solid var(--color-border);
		transition: all 0.3s ease;
		cursor: pointer;

		&:hover {
			background-color: var(--color-component-background);
			border-color: var(--color-highlight);
		}
	}

	&-icon {
		font-family: var(--font-icon);
		font-size: var(--font-l);
		color: var(--color-complement-text);
		transition: color 0.3s ease;
	}

	&-button:hover &-icon {
		color: var(--color-highlight);
	}
}
</style> 