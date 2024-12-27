<template>
  <div
    ref="chartRef"
    :style="{ height }"
    class="charts" />
</template>

<script setup>
import {
  onMounted,
  onBeforeMount,
  onBeforeUnmount,
  nextTick,
  watchEffect,
  ref,
  watch,
} from 'vue';

import * as echarts from 'echarts';
import { useColorMode } from '@/hooks/useColorMode';

const colorMode = useColorMode();
const chartRef = ref(null);
const chartsDom = ref(null);

const props = defineProps({
  height: {
    type: String,
    default: '300px',
  },
  options: {
    type: Object,
    default: () => ({}),
  },
});

// 监听主题变化
watch(
  () => ({
    darkMode: colorMode.value,
  }),
  (newVal, oldVal) => {
    if (newVal.darkMode !== oldVal.darkMode) {
      nextTick(() => {
        disposeCharts();
        initCharts();
      });
    }
  },
  {
    deep: true,
  }
);

// 监听 options 变化
watch(
  () => props.options,
  () => {
    nextTick(() => {
      if (chartsDom.value) {
        updateChartOptions();
      } else {
        initCharts();
      }
    });
  },
  {
    deep: true,
  }
);

const initCharts = () => {
  if (!chartRef.value) return;

  let theme = colorMode.value === 'dark' ? 'dark' : '';

  // 确保容器有宽高
  const container = chartRef.value;
  if (container.offsetHeight === 0) {
    container.style.height = props.height;
  }

  // 初始化图表
  const myChart = echarts.init(container, theme);
  chartsDom.value = myChart;
  updateChartOptions();
};

const updateChartOptions = () => {
  if (!chartsDom.value) return;

  chartsDom.value.setOption(
    {
      backgroundColor: 'rgba(0,0,0,0)',
      ...props.options,
    },
    true
  ); // true 表示不合并之前的配置
};

// 窗口resize事件
const handleChartResize = () => {
  chartsDom.value?.resize();
};

const disposeCharts = () => {
  if (chartsDom.value) {
    chartsDom.value.dispose();
    chartsDom.value = null;
  }
};

onMounted(() => {
  nextTick(() => {
    initCharts();
    window.addEventListener('resize', handleChartResize);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize);
  disposeCharts();
});
</script>

<style lang="less" scoped>
.charts {
  width: 100%;
  min-height: 100px;
}
</style>
