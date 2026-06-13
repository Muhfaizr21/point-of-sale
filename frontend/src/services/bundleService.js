import { apiClient } from './apiClient'

export const bundleService = {
  getAll: async () => {
    return apiClient.get('/api/bundles')
  },
  getById: async (id) => {
    return apiClient.get(`/api/bundles/${id}`)
  },
  create: async (data) => {
    return apiClient.post('/api/bundles', data)
  },
  update: async (id, data) => {
    return apiClient.put(`/api/bundles/${id}`, data)
  },
  delete: async (id) => {
    return apiClient.delete(`/api/bundles/${id}`)
  },
}
