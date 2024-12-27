<script setup>
import { ref, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { queryExchangeRate, queryExchangeRateHistory } from '@/api/index';
import HotListSetting from '@/components/HotListSetting/index.vue';
import rateList from './rateList';
import PageTitle from '@/components/PageTitle/index.vue';
import CurrencyHistory from '@/components/CurrencyHistory/index.vue';
// 本地存储的 key
const STORAGE_KEY = 'RATE_LIST_SETTINGS';

const settingVisible = ref(false);
const sourceAmount = ref(1); // 默认金额
const sourceCurrency = ref('CNY'); // 默认源货币
const enabledCurrencies = ref([]); // 存储启用的货币列表
const showHistory = ref(false);
const selectedCurrency = ref(null);

onMounted(() => {
  const settings = getSettings();
  updateEnabledCurrencies(settings);
  queryRate();
});

// 查询汇率
const queryRate = async () => {
  if (!sourceAmount.value) return;
  // 获取所有启用货币的代码，用逗号连接
  const targetCurrencies = enabledCurrencies.value.map((c) => c.name).join(',');

  // 一次性查询所有目标货币的汇率
  let params = {
    lang: 'cn',
    money: sourceAmount.value,
    source: sourceCurrency.value,
    target: targetCurrencies,
  };

  const res = await queryExchangeRate(params);

  // 判断 res 的 c 是否等于 enabledCurrencies 的 name , 如果是, 则给 enabledCurrencies 增加 value
  enabledCurrencies.value.forEach((item) => {
    const index = res.findIndex((c) => c.c === item.name);
    if (index !== -1) {
      item.value = res[index].v;
    }
  });
};

// 监听输入值变化
watch([sourceAmount, sourceCurrency], () => {
  queryRate();
});

// 保存设置到本地存储
const handleSettingSave = (settings) => {
  const cleanSettings = settings.map((item, index) => ({
    name: item.name,
    label: item.label,
    enabled: item.enabled,
    order: index,
  }));
  window.utools.dbStorage.setItem(STORAGE_KEY, cleanSettings);

  // 更新启���的货币列表
  updateEnabledCurrencies(cleanSettings);

  // 查询汇率
  queryRate();
};

// 更新启用的货币列表
const updateEnabledCurrencies = (settings) => {
  enabledCurrencies.value = settings
    .filter((item) => item.enabled)
    .slice(0, 9) // 最多取9个
    .sort((a, b) => a.order - b.order);
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

// 获取货币图标
const getCurrencyIcon = (name) => {
  return `https://files.codelife.cc/itab/widget/exchangerate/${name}.png`;
};

const handleCurrencyClick = (currency) => {
  selectedCurrency.value = currency;
  showHistory.value = true;
};
</script>

<template>
  <div class="rate_wrapper">
    <PageTitle title="货币汇率">
      <!-- 添加设置按钮 -->
      <template #extra>
        <a-tooltip content="设置">
          <a-button
            type="text"
            size="small">
            <template #icon>
              <icon-settings @click="settingVisible = true" />
            </template>
          </a-button>
        </a-tooltip>
      </template>
    </PageTitle>

    <div class="rate_calculator">
      <div class="calculator_main">
        <a-input-number
          v-model="sourceAmount"
          :min="0"
          placeholder="请输入金额"
          allow-clear
          class="amount_input" />

        <a-select
          v-model="sourceCurrency"
          placeholder="选择货币"
          class="currency_select">
          <a-option
            v-for="item in rateList"
            :key="item.name"
            :value="item.name">
            <div class="select_option">
              <img
                :src="getCurrencyIcon(item.name)"
                :alt="item.name"
                class="currency_icon_small" />
              {{ item.name }} - {{ item.label }}
            </div>
          </a-option>
        </a-select>
      </div>
    </div>

    <!-- 货币展示网格 -->
    <div class="currency_grid">
      <div
        v-for="currency in enabledCurrencies"
        :key="currency.name"
        class="currency_item"
        @click="handleCurrencyClick(currency)">
        <div class="currency_icon">
          <img
            :src="getCurrencyIcon(currency.name)"
            :alt="currency.name" />
        </div>
        <div class="currency_info">
          <div class="currency_name">
            {{ currency.name }} - {{ currency.label }}
          </div>
          <div class="currency_value">
            {{ currency.value || '0.00' }}
          </div>
        </div>
      </div>
    </div>

    <HotListSetting
      v-model="settingVisible"
      :settings="getSettings()"
      @save="handleSettingSave" />

    <CurrencyHistory
      v-model="showHistory"
      :currency="selectedCurrency"
      :source-currency="sourceCurrency" />
  </div>
</template>

<style scoped lang="less">
.rate_wrapper {
  padding: 20px;
  .rate_calculator {
    padding: 24px;
    background: var(--color-bg-2);
    border-radius: 8px;
    border: 1px solid var(--color-border-2);

    .calculator_main {
      display: flex;
      gap: 16px;
      align-items: center;

      .amount_input {
        flex: 1;
      }
    }
  }
}

// 将选择器相关样式单独提取出来
:deep(.currency_select) {
  width: 200px;

  .arco-select-view {
    height: 40px;
    line-height: 38px;
  }

  .arco-select-option {
    padding: 6px 12px;
  }
}

// 选项样式
.select_option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  .currency_icon_small {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }
}

// 下拉菜单样式
:deep(.arco-select-dropdown) {
  .arco-select-option {
    &:hover {
      background-color: var(--color-fill-2);
    }

    &.arco-select-option-selected {
      background-color: var(--color-primary-light-1);
      color: var(--color-primary);
    }
  }
}

// 选中值的样式
:deep(.arco-select-view-value) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.currency_grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 2px;

  .currency_item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      border-color: var(--color-primary-light-3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .currency_icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .currency_info {
      flex: 1;
      min-width: 0;

      .currency_name {
        font-size: 14px;
        color: var(--color-text-2);
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .currency_value {
        font-size: 16px;
        font-weight: 500;
        color: var(--color-text-1);
      }
    }
  }
}
</style>
