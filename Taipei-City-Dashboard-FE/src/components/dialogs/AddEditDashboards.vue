<!-- Developed by Taipei Urban Intelligence Center 2023-2024-->

<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";

import { useDialogStore } from "../../store/dialogStore";
import { useContentStore } from "../../store/contentStore";

import DialogContainer from "./DialogContainer.vue";
import ComponentDragTags from "../utilities/forms/ComponentDragTags.vue";
import CustomCheckBox from "../utilities/forms/CustomCheckBox.vue";
import AddComponent from "./AddComponent.vue";
import { allIcons } from "../../assets/configs/AllIcons";

const dialogStore = useDialogStore();
const contentStore = useContentStore();

const { editDashboard } = storeToRefs(contentStore);
const indexStatus = ref("");
const iconSearch = ref("");
const deleteConfirm = ref(false);
const isExporting = ref(false);
const isImporting = ref(false);
const fileInput = ref(null);

const availableIcons = computed(() => {
	let filteredIcons = [...allIcons];
	const filterNum = dialogStore.addEdit === "edit" ? 36 : 54;
	if (iconSearch.value !== "") {
		filteredIcons = filteredIcons.filter((icon) =>
			icon.includes(iconSearch.value)
		);
	} else {
		const selected = filteredIcons.findIndex(
			(icon) => icon === editDashboard.value.icon
		);
		if (selected >= filterNum) {
			filteredIcons.splice(selected, 1);
			filteredIcons.unshift(editDashboard.value.icon);
		}
	}
	filteredIcons = filteredIcons.slice(0, filterNum);
	return filteredIcons;
});

function handleConfirm() {
	if (dialogStore.addEdit === "add") {
		contentStore.createDashboard();
	} else if (dialogStore.addEdit === "edit") {
		contentStore.editCurrentDashboard();
	}
	handleClose();
}

function handleDelete() {
	contentStore.deleteCurrentDashboard();
	handleClose();
}

async function handleExportCSV() {
	isExporting.value = true;
	try {
		await contentStore.exportDashboardToCSV();
	} catch (error) {
		console.error('匯出失敗:', error);
	} finally {
		isExporting.value = false;
	}
}

function handleImportCSV() {
	fileInput.value?.click();
}

async function handleFileChange(event) {
	const file = event.target.files[0];
	if (!file) return;
	
	isImporting.value = true;
	try {
		const importedData = await contentStore.importDashboardFromCSV(file);
		if (importedData) {
			// Update editDashboard with imported data
			editDashboard.value.name = importedData.name;
			editDashboard.value.components = importedData.components;
		}
	} catch (error) {
		console.error('匯入失敗:', error);
	} finally {
		isImporting.value = false;
		// Reset file input
		event.target.value = '';
	}
}

function handleClose() {
	indexStatus.value = "";
	iconSearch.value = "";
	deleteConfirm.value = false;
	isExporting.value = false;
	isImporting.value = false;
	contentStore.editDashboard = {
		index: "",
		name: "我的新儀表板",
		icon: "star",
		components: [],
	};
	dialogStore.hideAllDialogs();
}
</script>

<template>
  <DialogContainer
    :dialog="`addEditDashboards`"
    @on-close="handleClose"
  >
    <div class="addeditdashboards">
      <div class="addeditdashboards-header">
        <h2>
          {{ dialogStore.addEdit === "edit" ? "編輯" : "新增" }}儀表板
        </h2>
        <div class="addeditdashboards-header-buttons">
          <button
            v-if="
              dialogStore.addEdit === 'edit' &&
                deleteConfirm === true
            "
            :style="{ backgroundColor: 'rgb(192, 67, 67)' }"
            @click="handleDelete"
          >
            刪除儀表板
          </button>
          <button
            v-if="dialogStore.addEdit === 'edit'"
            :style="{ backgroundColor: '#59a85b' }"
            @click="handleExportCSV"
            :disabled="isExporting"
            :title="isExporting ? '正在匯出儀表板數據...' : '匯出儀表板組件資訊為 CSV 檔案'"
            class="export-csv-button"
          >
            <span class="material-icons">
              {{ 'publish' }}
            </span>
            {{ isExporting ? '匯出中...' : '匯出 CSV' }}
          </button>
          <button
            v-if="dialogStore.addEdit === 'add'"
            @click="handleImportCSV"
            :disabled="isImporting"
            :title="isImporting ? '正在匯入儀表板數據...' : '從 CSV 檔案匯入儀表板配置'"
            class="import-csv-button"
          >
            <span class="material-icons">
              {{ 'download' }}
            </span>
            {{ isImporting ? '匯入中...' : '匯入 CSV' }}
          </button>
          <button
            v-if="editDashboard.name"
            @click="handleConfirm"
          >
            確認{{
              dialogStore.addEdit === "edit" ? "更改" : "新增"
            }}
          </button>
          <!-- Hidden file input for CSV import -->
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            @change="handleFileChange"
            style="display: none;"
          >
        </div>
      </div>
      <div class="addeditdashboards-content">
        <div class="addeditdashboards-settings">
          <label v-if="dialogStore.addEdit === 'edit'">Index*</label>
          <input
            v-if="dialogStore.addEdit === 'edit'"
            :value="editDashboard.index"
            disabled="true"
          >
          <label>名稱* ({{ editDashboard.name.length }}/10)</label>
          <input
            v-model="editDashboard.name"
            :minlength="1"
            :maxlength="10"
            required
          >
          <label>圖示*</label>
          <input
            v-model="iconSearch"
            placeholder="尋找圖示(英文)"
          >
          <div class="addeditdashboards-settings-icon">
            <div
              v-for="item in availableIcons"
              :key="item"
            >
              <input
                :id="item"
                v-model="editDashboard.icon"
                type="radio"
                :value="item"
              >
              <label :for="item">{{ item }}</label>
            </div>
          </div>
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column' }">
          <div class="addeditdashboards-settings">
            <label>{{
              dialogStore.addEdit === "edit"
                ? "編輯"
                : "新增"
            }}儀表板組件 (拖拉以更改順序)</label>
            <div 
              v-if="dialogStore.addEdit === 'add'" 
              class="addeditdashboards-settings-import-hint"
            >
              <p>💡 提示：可以通過上方的「匯入 CSV」按鈕快速匯入現有儀表板配置</p>
            </div>
            <div class="addeditdashboards-settings-components">
              <ComponentDragTags
                :tags="editDashboard.components"
                @deletetag="
                  (index) => {
                    editDashboard.components.splice(
                      index,
                      1
                    );
                  }
                "
                @updatetagorder="
                  (updatedTags) => {
                    editDashboard.components = updatedTags;
                  }
                "
              />
              <button
                @click="dialogStore.showDialog('addComponent')"
              >
                +
              </button>
            </div>
          </div>
          <div
            v-if="dialogStore.addEdit === 'edit'"
            class="addeditdashboards-settings-delete"
          >
            <input
              id="delete"
              v-model="deleteConfirm"
              type="checkbox"
              :value="true"
              class="custom-check-input"
            >
            <CustomCheckBox for="delete">
              啟動刪除儀表板功能
            </CustomCheckBox>
          </div>
        </div>
      </div>
    </div>
    <AddComponent />
  </DialogContainer>
</template>

<style scoped lang="scss">
.addeditdashboards {
	width: 600px;
	height: 350px;

	@media (max-width: 600px) {
		display: none;
	}
	@media (max-height: 350px) {
		display: none;
	}

	&-header {
		display: flex;
		justify-content: space-between;

		&-buttons {
			display: flex;
			column-gap: 8px;
			button {
				display: flex;
				align-items: center;
				justify-self: baseline;
				padding: 2px 12px;
				border-radius: 5px;
				background-color: var(--color-highlight);
				font-size: var(--font-s);
				transition: opacity 0.2s;

				&:hover {
					opacity: 0.8;
				}

				&.export-csv-button {
					gap: 4px;
					padding: 2px 12px;
					background-color: #59a85b;
					color: white;
					
					.material-icons {
						font-size: 1rem;
						animation: none;
						transition: transform 0.3s ease;
					}

					&:hover:not(:disabled) {
						background-color: #4a9051;
						transform: translateY(-1px);
						box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					}

					&:disabled {
						opacity: 0.6;
						cursor: not-allowed;
						transform: none;
						
						.material-icons {
							animation: spin 1s linear infinite;
						}
					}
				}

				&.import-csv-button {
					gap: 4px;
					padding: 2px 12px;
					background-color: #ff8c42;
					color: white;
					
					.material-icons {
						font-size: 1rem;
						animation: none;
						transition: transform 0.3s ease;
					}

					&:hover:not(:disabled) {
						background-color: #e67a3a;
						transform: translateY(-1px);
						box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					}

					&:disabled {
						opacity: 0.6;
						cursor: not-allowed;
						transform: none;
						
						.material-icons {
							animation: spin 1s linear infinite;
						}
					}
				}
			}
		}
	}

	&-content {
		height: calc(100% - 45px);
		display: grid;
		grid-template-columns: 1fr 1fr;
		margin-top: var(--font-ms);
		column-gap: var(--font-ms);
	}

	&-settings {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 0.5rem 0.5rem 0.5rem;
		border-radius: 5px;
		border: solid 1px var(--color-border);
		overflow-y: scroll;

		label {
			margin: 8px 0 4px;
			font-size: var(--font-s);
			color: var(--color-complement-text);
		}

		&-index {
			width: 100%;
			position: relative;
			display: flex;
			align-items: center;

			input {
				width: 100%;
			}

			span {
				position: absolute;
				right: 4px;
				font-family: var(--font-icon);
			}
		}

		&-icon {
			display: grid;
			grid-template-columns: 26px 26px 26px 26px 26px 26px 26px 26px 26px;
			grid-auto-rows: 26px;
			column-gap: 4px;
			row-gap: 4px;
			margin: 0.5rem 0 0;

			input {
				display: none;
				transition: border 0.2s;

				&:checked + label {
					border: solid 1px var(--color-highlight);
				}
			}

			label {
				width: 1.5rem;
				height: 1.5rem;
				display: flex;
				align-items: center;
				justify-content: center;
				margin: 0;
				border: solid 1px transparent;
				border-radius: 5px;
				font-size: 1.2rem;
				font-family: var(--font-icon);
				cursor: pointer;

				&:hover {
					border: solid 1px var(--color-border);
				}
			}
		}

		&-components {
			display: grid;
			grid-template-columns: 85px 85px 85px;
			column-gap: 6px;
			row-gap: 6px;
			overflow-y: scroll;

			button:last-child {
				height: 48px;
				display: flex;
				align-items: center;
				justify-content: center;
				border: dashed 2px var(--color-border);
				border-radius: 5px;
				color: var(--color-complement-text);
				font-size: 1.5rem;
			}
		}

		&-delete {
			margin-top: 8px;
			label {
				color: var(--color-complement-text);
				font-size: 0.9rem;
			}

			input {
				display: none;

				&:checked + label {
					color: white;
				}

				&:hover + label {
					color: var(--color-highlight);
				}
			}
		}

		&-import-hint {
			margin: 8px 0;
			padding: 8px;
			border: solid 1px var(--color-border);
			border-radius: 5px;
			background-color: rgba(90, 156, 248, 0.1);

			p {
				margin: 0;
				font-size: var(--font-s);
				color: var(--color-complement-text);
			}
		}

		&::-webkit-scrollbar {
			width: 4px;
		}
		&::-webkit-scrollbar-thumb {
			background-color: rgba(136, 135, 135, 0.5);
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb:hover {
			background-color: rgba(136, 135, 135, 1);
		}
	}
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
