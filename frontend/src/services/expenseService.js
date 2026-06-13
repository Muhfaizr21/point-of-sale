import { apiClient } from './apiClient'

const buildQueryString = (params) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const expenseService = {
  getAll: async ({
    page = 1, limit = 20, dateFrom = '', dateTo = '',
    category = '', search = '', sortBy = 'date', sortOrder = 'desc', branchId,
  } = {}) => {
    const qs = buildQueryString({
      page, limit, date_from: dateFrom, date_to: dateTo,
      category, search, sort_by: sortBy, sort_order: sortOrder,
      branch_id: branchId,
    })
    return apiClient.get(`/api/expenses${qs}`)
  },

  getByID: async (id) => {
    return apiClient.get(`/api/expenses/${id}`)
  },

  create: async (data) => {
    return apiClient.post('/api/expenses', data)
  },

  update: async (id, data) => {
    return apiClient.put(`/api/expenses/${id}`, data)
  },

  delete: async (id) => {
    return apiClient.delete(`/api/expenses/${id}`)
  },
}

export default expenseService
