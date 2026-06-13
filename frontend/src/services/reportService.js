import { apiClient } from './apiClient'

const buildQueryString = (params) => {
  const qp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qp.append(key, value)
    }
  })
  const qs = qp.toString()
  return qs ? `?${qs}` : ''
}

export const reportService = {
  getStockReport: async () => {
    return apiClient.get('/api/reports/stock')
  },

  getCustomerReport: async ({ dateFrom = '', dateTo = '' } = {}) => {
    const qs = buildQueryString({ date_from: dateFrom, date_to: dateTo })
    return apiClient.get(`/api/reports/customers${qs}`)
  },

  getProfitLoss: async ({ dateFrom = '', dateTo = '' } = {}) => {
    const qs = buildQueryString({ date_from: dateFrom, date_to: dateTo })
    return apiClient.get(`/api/reports/profit-loss${qs}`)
  },
}

export default reportService
