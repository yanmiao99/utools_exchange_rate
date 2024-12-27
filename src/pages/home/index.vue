<script setup>
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { queryExchangeRate, queryExchangeRateHistory } from '@/api/index';
import HotListSetting from '@/components/HotListSetting/index.vue';
import rateList from './rateList';

// 本地存储的 key
const STORAGE_KEY = 'RATE_LIST_SETTINGS';

const settingVisible = ref(false);

onMounted(() => {
  queryRate();
});

// 查询汇率
const queryRate = async () => {
  let params = {
    lang: 'cn',
    money: 1,
    source: 'USD',
    target: 'CNY',
  };
  const res = await queryExchangeRate(params);
};

// 保存设置到本地存储
const handleSettingSave = (settings) => {
  const cleanSettings = settings.map((item, index) => ({
    name: item.name,
    label: item.label,
    enabled: item.enabled,
    order: index,
  }));
  window.utools.dbStorage.setItem(STORAGE_KEY, cleanSettings);
};

// 获取平台设置
const getSettings = () => {
  const settings = window.utools.dbStorage.getItem(STORAGE_KEY);
  if (settings) {
    // 处理新增平台的情况
    const existingPlatforms = new Set(settings.map((s) => s.name));
    const newPlatforms = rateList
      .filter((p) => !existingPlatforms.has(p.name))
      .map((p) => ({
        name: p.name,
        label: p.label,
        enabled: true,
        order: settings.length + 1,
      }));

    return [...settings, ...newPlatforms];
  }

  // 首次使用时的默认设置
  return rateList.map((item, index) => ({
    ...item,
    enabled: true,
    order: index,
  }));
};
</script>

<template>
  <div class="rate_wrapper">
    <a-button
      type="primary"
      @click="settingVisible = true">
      设置
    </a-button>

    <!-- 使用新的设置组件 -->
    <HotListSetting
      v-model="settingVisible"
      :settings="getSettings()"
      @save="handleSettingSave" />
  </div>
</template>

<style scoped lang="less">
.rate_wrapper {
  padding: 20px;
}
</style>
