<template>
  <a-modal
    v-if="currency"
    v-model:visible="visible"
    :title="`${currency.name} - ${currency.label} 汇率走势`"
    @cancel="handleCancel"
    :footer="false"
    :modal-style="{ width: '90vw' }">
    <div class="history_content">
      <div class="history_header">
        <div class="current_rate">
          <div class="currency_info">
            <img
              class="currency_icon"
              :src="getCurrencyIcon(currency.name)"
              :alt="currency.name" />
            <div class="rate_info">
              <span class="label">当前汇率：</span>
              <span class="value">{{ currency.value || '--' }}</span>
            </div>
          </div>
          <div class="stats_info">
            <div class="stat_item">
              <span class="label">最高：</span>
              <span class="value">{{ stats.max?.toFixed(4) || '--' }}</span>
            </div>
            <div class="stat_item">
              <span class="label">最低：</span>
              <span class="value">{{ stats.min?.toFixed(4) || '--' }}</span>
            </div>
            <div class="stat_item">
              <span class="label">平均：</span>
              <span class="value">{{ stats.avg?.toFixed(4) || '--' }}</span>
            </div>
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

      <a-spin
        :loading="loading"
        dot>
        <BaseCharts
          style="width: 100%"
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

const event = useEventListener(document, 'keydown', (e) => handleKeydown(e));

// 监听按下 esc
const handleKeydown = (e) => {
  if (e.key === 'Escape' && visible.value) {
    closeModal();
    e.stopPropagation();
    e.preventDefault();
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

  // 计算统计数据
  calculateStats(values);

  chartOptions.value = {
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 60,
      containLabel: true, // 确保坐标轴标签不超出容器
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333',
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#ccc',
          width: 1,
          type: 'dashed',
        },
      },
      formatter: (params) => {
        const data = params[0];
        if (!data) return '';

        const date = new Date(data.axisValue);
        let timeStr;

        // 根据时间范围显示不同格式
        if (dateRange.value === '48h' || dateRange.value === '1w') {
          timeStr = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}-${String(date.getDate()).padStart(
            2,
            '0'
          )} ${String(date.getHours()).padStart(2, '0')}:00`;
        } else {
          timeStr = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        return `
          <div style="padding: 8px">
            <div style="margin-bottom: 8px; font-size: 13px; color: #666;">
              ${timeStr}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${
                data.color
              };"></span>
              <span style="color: #333;">汇率：${Number(data.value).toFixed(
                4
              )}</span>
            </div>
          </div>
        `;
      },
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: (value) => value.toFixed(4),
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
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
          data: [
            { type: 'max', name: '最高值' },
            { type: 'min', name: '最低值' },
          ],
        },
        markLine: {
          data: [{ type: 'average', name: '平均值' }],
          label: {
            formatter: '{b}: {c}',
          },
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
    align-items: flex-start;
    margin-bottom: 24px;

    .current_rate {
      .currency_info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .currency_icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
        }

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

      .stats_info {
        display: flex;
        gap: 16px;

        .stat_item {
          .label {
            color: var(--color-text-3);
            font-size: 13px;
            margin-right: 4px;
          }

          .value {
            color: var(--color-text-2);
            font-size: 13px;
          }
        }
      }
    }

    .date_select {
      :deep(.arco-radio-group-button) {
        .arco-radio {
          padding: 0 12px;
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
