import { apiClient, API_BASE_URL } from './apiClient'

// Build query string from params
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
  // Get paginated orders with filters
  getOrders: async ({
    page = 1,
    limit = 10,
    search = '',
    paymentMethod = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = {}) => {
    const params = {
      page,
      limit,
      search: search.trim(),
      payment_method: paymentMethod,
      status,
      date_from: dateFrom,
      date_to: dateTo,
      sort_by: sortBy,
      sort_order: sortOrder,
    }
    const queryString = buildQueryString(params)
    return apiClient.get(`/api/orders${queryString}`)
  },

  // Get single order by ID
  getOrderById: async (id) => {
    return apiClient.get(`/api/orders/${id}`)
  },

  // Create new order (checkout)
  createOrder: async (orderData) => {
    return apiClient.post('/api/orders', orderData)
  },

  // Get analytics data
  getAnalytics: async ({ dateFrom = '', dateTo = '' } = {}) => {
    const params = {
      date_from: dateFrom,
      date_to: dateTo,
    }
    const queryString = buildQueryString(params)
    return apiClient.get(`/api/analytics${queryString}`)
  },

  // Build export URL with current filters
  getExportUrl: (params = {}) => {
    const queryString = buildQueryString(params)
    return `${API_BASE_URL}/api/orders/export${queryString}`
  },
}

export default orderService