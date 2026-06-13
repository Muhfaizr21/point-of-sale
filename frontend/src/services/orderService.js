import { apiClient, API_BASE_URL } from './apiClient'

const buildQueryString = (params) => {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value)
    }
  })
  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const orderService = {
  getOrders: async ({
    page = 1, limit = 10, search = '', paymentMethod = '',
    status = '', dateFrom = '', dateTo = '',
    sortBy = 'created_at', sortOrder = 'desc', branchId,
  } = {}) => {
    const params = {
      page, limit, search: search.trim(),
      payment_method: paymentMethod, status,
      date_from: dateFrom, date_to: dateTo,
      sort_by: sortBy, sort_order: sortOrder,
      branch_id: branchId,
    }
    const queryString = buildQueryString(params)
    return apiClient.get(`/api/orders${queryString}`)
  },

  getOrderById: async (id) => {
    return apiClient.get(`/api/orders/${id}`)
  },

  createOrder: async (orderData) => {
    return apiClient.post('/api/orders', orderData)
  },

  updateOrder: async (id, updateData) => {
    return apiClient.put(`/api/orders/${id}`, updateData)
  },

  getAnalytics: async ({ dateFrom = '', dateTo = '', branchId } = {}) => {
    const params = { date_from: dateFrom, date_to: dateTo, branch_id: branchId }
    const queryString = buildQueryString(params)
    return apiClient.get(`/api/analytics${queryString}`)
  },

  getExportUrl: (params = {}) => {
    const queryString = buildQueryString(params)
    return `${API_BASE_URL}/api/orders/export${queryString}`
  },
}

export default orderService
