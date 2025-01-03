<template>
  <a-modal
    :esc-to-close="false"
    v-model:visible="visible"
    title="货币设置"
    @ok="handleSave"
    :draggable="true"
    @cancel="handleCancel"
    :ok-text="'保存设置'"
    :cancel-text="'取消'"
    :modal-style="{ width: '90vw' }">
    <div class="setting_content">
      <div class="search_wrapper">
        <a-input-search
          v-model="searchText"
          :style="{ width: '100%' }"
          placeholder="支持多个搜索，如：CNY,USD 或 人民币,美元"
          allow-clear
          @clear="handleClearSearch" />
      </div>

      <div class="setting_tip">
        <icon-info-circle />
        <span>拖拽排序并选择需要显示的货币（最多9个）</span>
        <span class="enabled_count">已启用: {{ enabledCount }}/9</span>
      </div>

      <VueDraggable
        v-model="filteredSettings"
        item-key="name"
        handle=".drag_handle"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="dragging"
        :animation="300"
        :group="{ name: 'platforms' }"
        class="platform_grid">
        <template #item="{ element }">
          <transition-group-item>
            <div class="platform_item">
              <div class="platform_left">
                <span class="drag_handle">
                  <icon-drag-dot-vertical />
                </span>
                <img
                  class="platform_icon"
                  :src="platformIcon(element.name)"
                  :alt="element.name" />
                <span class="platform_title">
                  {{ element.name }}-{{ element.label }}
                </span>
              </div>
              <div class="platform_right">
                <a-switch
                  type="round"
                  v-model="element.enabled"
                  :disabled="!element.enabled && enabledCount >= 9"
                  @change="() => handleSwitchChange(element)"
                  size="small" />
              </div>
            </div>
          </transition-group-item>
        </template>
      </VueDraggable>

      <div
        v-if="filteredSettings.length === 0"
        class="no_result">
        <icon-exclamation-circle-fill />
        <span>未找到匹配的货币</span>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import VueDraggable from 'vuedraggable';
import TransitionGroupItem from '@/components/TransitionGroupItem/index.vue';
import { useEventListener } from '@vueuse/core';
import { Message } from '@arco-design/web-vue';

useEventListener(document, 'keydown', (e) => handleKeydown(e));

// 监听按下 esc
const handleKeydown = (e) => {
  if (e.key === 'Escape' && visible.value) {
    handleCancel();
    e.stopPropagation();
    e.preventDefault();
  }
};

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  settings: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'save']);

const visible = ref(false);
const localSettings = ref([]);
const searchText = ref('');

// 计算过滤后的列表
const filteredSettings = computed(() => {
  if (!searchText.value) return localSettings.value;

  const searchTerms = searchText.value
    .toLowerCase()
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean); // 过滤掉空字符串

  if (searchTerms.length === 0) return localSettings.value;

  return localSettings.value.filter((item) => {
    return searchTerms.some(
      (term) =>
        item.name.toLowerCase().includes(term) ||
        item.label.toLowerCase().includes(term)
    );
  });
});

// 计算已启用的数量
const enabledCount = computed(() => {
  return localSettings.value.filter((item) => item.enabled).length;
});

// 处理开关切换
const handleSwitchChange = (item) => {
  // 最少保留一个货币
  if (!item.enabled && enabledCount.value < 1) {
    Message.warning('最少保留一个货币');
    item.enabled = true;
    return;
  }

  if (!item.enabled && enabledCount.value >= 9) {
    Message.warning('最多只能启用9个货币');
    item.enabled = false;
    return;
  }
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      // 打开弹窗时，复制设置数据
      localSettings.value = [...props.settings];
    }
  }
);

// 监听 settings 变化
watch(
  () => props.settings,
  (newVal) => {
    if (visible.value) {
      localSettings.value = [...newVal];
    }
  },
  { immediate: true }
);

// 监听 visible 变化，同步到父组件
watch(
  () => visible.value,
  (newVal) => {
    emit('update:modelValue', newVal);
  }
);

// vue3 动态引入图片
const platformIcon = (name) => {
  return `https://files.codelife.cc/itab/widget/exchangerate/${name}.png`;
};

// 保存设置
const handleSave = () => {
  emit('save', localSettings.value);
  handleClearSearch();
  visible.value = false;
};

// 取消设置
const handleCancel = () => {
  handleClearSearch();
  visible.value = false;
};

// 清除搜索
const handleClearSearch = () => {
  searchText.value = '';
};
</script>

<style scoped lang="less">
.setting_content {
  padding: 0 2px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;

  .search_wrapper {
    margin-bottom: 16px;

    :deep(.arco-input-wrapper) {
      background-color: var(--color-bg-2);
      border-color: var(--color-border-2);

      &:hover,
      &:focus {
        border-color: var(--color-primary);
        background-color: var(--color-bg-1);
      }
    }
  }

  .setting_tip {
    margin-bottom: 20px;
    padding: 12px 16px;
    background: var(--color-primary-light-1);
    border-radius: 8px;
    color: var(--color-text-2);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;

    .enabled_count {
      margin-left: auto;
      padding: 2px 8px;
      background: var(--color-fill-2);
      border-radius: 4px;
      font-size: 12px;
      color: var(--color-text-2);
    }
  }

  .platform_item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    margin-bottom: 0;
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    user-select: none;
    transform: translate(0, 0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateX(2px);
      border-color: var(--color-primary-light-3);
      background: var(--color-fill-1);

      .drag_handle {
        color: var(--color-text-1);
      }
    }

    &:active {
      transform: translateX(2px) scale(0.995);
    }

    .platform_left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
    }

    .platform_right {
      padding-left: 16px;
      border-left: 1px solid var(--color-border-1);
    }

    .drag_handle {
      cursor: move;
      color: var(--color-text-3);
      display: flex;
      align-items: center;
      padding: 4px;
      margin: -4px;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--color-fill-2);
      }

      :deep(.arco-icon) {
        font-size: 16px;
      }
    }

    .platform_icon {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      padding: 2px;
      background: var(--color-bg-1);
      border: 1px solid var(--color-border-2);
    }

    .platform_title {
      color: var(--color-text-1);
      font-size: 15px;
      font-weight: 500;
    }

    // 被选中时的样式
    &.chosen {
      background: var(--color-fill-2);
      border-color: var(--color-primary-light-3);
      transform: scale(1.02);
      box-shadow: var(--shadow-2);
      z-index: 1;
    }

    // 正在拖拽时的样式
    &.dragging {
      opacity: 0.8;
      background: var(--color-primary-light-1);
      border: 1px dashed var(--color-primary);
      transform: scale(1.05);
      box-shadow: var(--shadow-2);

      .platform_icon,
      .platform_title,
      .platform_right {
        opacity: 0.6;
      }

      .drag_handle {
        color: var(--color-primary);
      }
    }

    // 其他项目移动时的动画
    &.sortable-ghost {
      opacity: 0;
    }

    &.sortable-fallback {
      opacity: 1 !important;
      background: var(--color-bg-2);
      border: 1px solid var(--color-primary);
    }
  }

  // 拖拽时的占位样式
  :deep(.ghost) {
    opacity: 0.5;
    background: var(--color-primary-light-1);
    border: 1px dashed var(--color-primary);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        45deg,
        var(--color-primary-light-1),
        var(--color-primary-light-1) 10px,
        var(--color-primary-light-2) 10px,
        var(--color-primary-light-2) 20px
      );
      border-radius: 8px;
      opacity: 0.2;
    }

    * {
      visibility: hidden;
    }
  }

  // 添加移动动画
  .sortable-drag {
    transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
  }

  // 列表项移动动画
  .flip-list-move {
    transition: transform 0.3s;
  }

  // 添加网格布局
  .platform_grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 2px;
    position: relative;
    min-height: 100px;
  }

  // 优化拖拽时的动画
  .sortable-ghost {
    transition: all 0.3s ease;
    opacity: 0.3;
    transform: scale(0.95);
  }

  .sortable-drag {
    transition: none;
  }

  // 列表项移动动画
  .flip-list-move {
    transition: transform 0.3s ease;
  }

  // 添加无搜索结果样式
  .no_result {
    padding: 24px;
    text-align: center;
    color: var(--color-text-3);
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--color-fill-2);
    border-radius: 8px;
    margin-top: 16px;

    .arco-icon {
      font-size: 18px;
    }
  }
}

// 拖拽时的占位样式调整
:deep(.ghost) {
  grid-column: span 1; // 确保占位元素只占一格
}

// 拖拽时的样式调整
.dragging {
  grid-column: span 1; // 确保拖拽元素只占一格
}
</style>
