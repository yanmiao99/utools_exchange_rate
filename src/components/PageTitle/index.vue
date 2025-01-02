<template>
  <div class="page_title_container">
    <div class="page_info">
      <div class="page_title">{{ title }}</div>
      <div
        class="page_sub_title"
        v-if="subTitle">
        {{ subTitle }}
      </div>
    </div>

    <div class="page_actions">
      <div class="extra_actions">
        <slot name="extra"></slot>
      </div>
      <Appreciate />
      <FishStats />
      <ThemeSwitch />
    </div>
  </div>
</template>

<script setup>
import ThemeSwitch from '@/components/ThemeSwitch/index.vue';
import FishStats from '@/components/FishStats/index.vue';
import Appreciate from '@/components/Appreciate/index.vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    default: '',
  },
});
</script>

<style scoped lang="less">
.page_title_container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background-color: var(--color-bg-2);
  transition: all 0.3s ease;
  margin-bottom: 12px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--color-bg-2);
    opacity: 0.8;
    z-index: -1;
  }

  .page_info {
    display: flex;
    align-items: flex-end;
    gap: 4px;

    .page_title {
      font-size: 24px;
      font-weight: bold;
      text-align: left;
      color: var(--color-text-1);
    }

    .page_sub_title {
      font-size: 14px;
      color: var(--color-text-3);
      margin-top: 4px;
    }
  }

  .page_actions {
    display: flex;
    align-items: center;
    gap: 12px;
    .extra_actions {
      :deep(.arco-btn) {
        color: var(--color-text-1);
        font-size: 14px;

        &:hover {
          background-color: var(--color-fill-3);
        }
      }
    }
  }
}
</style>
