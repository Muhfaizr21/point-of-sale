import { apiClient } from './apiClient'

export const promoService = {
  getAll: async () => {
    return apiClient.get('/api/promos')
  },
  getById: async (id) => {
    return apiClient.get(`/api/promos/${id}`)
  },
  create: async (data) => {
    return apiClient.post('/api/promos', data)
  },
  update: async (id, data) => {
    return apiClient.put(`/api/promos/${id}`, data)
  },
  delete: async (id) => {
    return apiClient.delete(`/api/promos/${id}`)
  },
}
