import request from '@/utils/request/request';

// 货币查询
export const queryExchangeRate = (param) => {
  return request({
    method: 'get',
    url: '/query',
    data: param,
  });
};

// 货币历史
export const queryExchangeRateHistory = (param) => {
  return request({
    method: 'get',
    url: '/history',
    data: param,
  });
};