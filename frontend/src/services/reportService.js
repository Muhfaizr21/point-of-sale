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
  getStockReport: async ({ branchId } = {}) => {
    const qs = buildQueryString({ branch_id: branchId })
    return apiClient.get(`/api/reports/stock${qs}`)
  },

  getCustomerReport: async ({ dateFrom = '', dateTo = '', branchId } = {}) => {
    const qs = buildQueryString({ date_from: dateFrom, date_to: dateTo, branch_id: branchId })
    return apiClient.get(`/api/reports/customers${qs}`)
  },

  getProfitLoss: async ({ dateFrom = '', dateTo = '', branchId } = {}) => {
    const qs = buildQueryString({ date_from: dateFrom, date_to: dateTo, branch_id: branchId })
    return apiClient.get(`/api/reports/profit-loss${qs}`)
  },
}

export default reportService
