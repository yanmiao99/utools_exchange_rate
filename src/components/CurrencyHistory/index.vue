<template>
  <a-modal
    v-if="currency"
    v-model:visible="visible"
    @cancel="handleCancel"
    :footer="false"
    :esc-to-close="false"
    :modal-style="{ width: '90vw' }">
    <template #title> 汇率趋势 </template>

    <div class="history_content">
      <div class="history_header">
        <div class="currency_info">
          <img
            class="currency_icon"
            :src="getCurrencyIcon(currency.name)"
            :alt="currency.name" />
          <div class="currency_rate">
            <div class="rate_info">
              {{ currency.name }} - {{ currency.label }}
            </div>
            <div class="rate_info">
              <span class="label">当前汇率：</span>
              <span class="value">{{ currency.value || '--' }}</span>
            </div>
          </div>
        </div>

        <div class="currency_right">
          <div class="stats_info">
            <div class="stat_item">
              <span class="label">最高：</span>
              <span
                class="value"
                style="color: #ff7d00"
                >{{ stats.max?.toFixed(4) || '--' }}</span
              >
            </div>
            <div class="stat_item">
              <span class="label">最低：</span>
              <span
                class="value"
                style="color: #00b42a"
                >{{ stats.min?.toFixed(4) || '--' }}</span
              >
            </div>
            <div class="stat_item">
              <span class="label">平均：</span>
              <span
                class="value"
                style="color: #00b42a"
                >{{ stats.avg?.toFixed(4) || '--' }}</span
              >
            </div>
          </div>

          <div class="date_select">
            <a-radio-group
              v-model="dateRange"
              type="button">
              <a-radio value="48h">48小时</a-radio>
              <a-radio value="1w">一周</a-radio>
              <a-radio value="1m">一个月</a-radio>
              <a-radio value="6m">六个月</a-radio>
              <a-radio value="1y">一年</a-radio>
            </a-radio-group>
          </div>
        </div>
      </div>

      <a-spin
        :loading="loading"
        dot>
        <BaseCharts
          height="300px"
          :options="chartOptions" />
      </a-spin>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { Message } from '@arco-design/web-vue';
import { queryExchangeRateHistory } from '@/api/index';
import BaseCharts from '@/components/BaseCharts/index.vue';
import { useEventListener } from '@vueuse/core';

useEventListener(document, 'keydown', (e) => handleKeydown(e));

// 监听按下 esc
const handleKeydown = (e) => {
  if (e.key === 'Escape' && visible.value) {
    e.stopPropagation();
    e.preventDefault();
    visible.value = false;
  }
};

// 时间范围配置
const timeRangeConfig = {
  '48h': { length: 2, resolution: 'hourly', unit: 'day' },
  '1w': { length: 7, resolution: 'hourly', unit: 'day' },
  '1m': { length: 30, resolution: 'hourly', unit: 'day' },
  '6m': { length: 6, resolution: 'daily', unit: 'month' },
  '1y': { length: 1, resolution: 'daily', unit: 'year' },
};

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  currency: {
    type: Object,
    default: null,
  },
  sourceCurrency: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const visible = ref(false);
const dateRange = ref('48h'); // 默认显示
const historyData = ref([]);
const chartOptions = ref({});
const loading = ref(false); // 添加 loading 状态

// 添加统计数据
const stats = ref({
  max: null,
  min: null,
  avg: null,
});

// 获取货币图标
const getCurrencyIcon = (name) => {
  return `https://files.codelife.cc/itab/widget/exchangerate/${name}.png`;
};

// 计算统计数据
const calculateStats = (values) => {
  if (!values?.length) return;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  stats.value = { max, min, avg };
};

// 监听显示状态
watch(
  () => props.modelValue,
  async (newVal) => {
    visible.value = newVal;
    if (newVal && props.currency) {
      await fetchHistoryData();
      // 给弹窗一点时间来渲染
      await nextTick();
    }
  }
);

// 监听visible变化
watch(
  () => visible.value,
  (newVal) => {
    emit('update:modelValue', newVal);
  }
);

// 监听日期范围变化
watch(dateRange, () => {
  if (props.currency) {
    fetchHistoryData();
  }
});

// 获取历史数据
const fetchHistoryData = async () => {
  if (!props.currency) return;

  loading.value = true; // 开始加载
  try {
    const timeConfig = timeRangeConfig[dateRange.value];
    const params = {
      source: props.sourceCurrency,
      target: props.currency.name,
      lang: 'cn',
      length: timeConfig.length,
      resolution: timeConfig.resolution,
      unit: timeConfig.unit,
    };

    const res = await queryExchangeRateHistory(params);
    historyData.value = res;
    updateChartOptions();
  } catch (error) {
    Message.error('获取历史数据失败');
  } finally {
    loading.value = false; // 结束加载
  }
};

// 更新图表配置
const updateChartOptions = () => {
  const dates = historyData.value.time;
  const values = historyData.value.value;

  if (!dates?.length || !values?.length) return;

  // 计算统计数据
  calculateStats(values);

  chartOptions.value = {
    grid: {
      top: 40,
      right: 20,
      bottom: 0,
      left: 20,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      show: true,
      axisPointer: {
        type: 'line',
        snap: true,
      },
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false, // 坐标轴两边留白策略
      axisLabel: {
        rotate: 45,
        hideOverlap: true, // 隐藏重叠的标签
        color: '#4993FF',
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      color: 'skyblue',
      axisLabel: {
        color: '#4993FF',
        formatter: (value) => value.toFixed(4),
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'grey',
        },
      },
    },
    series: [
      {
        name: '汇率',
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2,
        },
        areaStyle: {
          opacity: 0.1,
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            borderWidth: 2,
            borderColor: '#fff',
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 4,
          },
          label: {
            position: 'top',
            distance: 8,
            formatter: (params) => {
              return `${params.name}\n${params.value.toFixed(4)}`;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: [4, 8],
            borderRadius: 4,
            color: '#333',
          },
          data: [
            {
              type: 'max',
              name: '最高',
              itemStyle: {
                color: '#ff7d00',
              },
            },
            {
              type: 'min',
              name: '最低',
              itemStyle: {
                color: '#00b42a',
              },
            },
          ],
        },
      },
    ],
  };
};

// 关闭弹窗
const handleCancel = () => {
  visible.value = false;
};
</script>

<style scoped lang="less">
.history_content {
  .history_header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .currency_info {
      display: flex;
      align-items: center;
      gap: 12px;

      .currency_icon {
        width: 45px;
        height: 45px;
        border-radius: 6px;
        border: 1px solid var(--color-border-2);
      }

      .currency_rate {
        .rate_info {
          .label {
            color: var(--color-text-2);
            margin-right: 8px;
          }

          .value {
            font-size: 20px;
            font-weight: 500;
            color: var(--color-text-1);
          }
        }
      }
    }

    .currency_right {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .stats_info {
        display: flex;
        gap: 16px;
        padding: 10px;
        background: var(--color-fill-2);
        border-radius: 8px;

        .stat_item {
          position: relative;
          padding-right: 16px;
          white-space: nowrap;

          &:not(:last-child)::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 1px;
            height: 14px;
            background: var(--color-border-2);
          }

          .label {
            color: var(--color-text-3);
            font-size: 13px;
            margin-right: 4px;
          }

          .value {
            color: var(--color-text-1);
            font-size: 13px;
            font-weight: 500;
          }
        }
      }

      .date_select {
        white-space: nowrap;
        :deep(.arco-radio-group-button) {
          .arco-radio {
            padding: 0 12px;
          }
        }
      }
    }
  }

  :deep(.arco-spin) {
    display: block;

    // 调整加载动画的位置
    .arco-spin-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    // 确保图表容器在加载时有正确的高度
    .arco-spin-children {
      display: block;
      min-height: 300px;
    }
  }
}
</style>
