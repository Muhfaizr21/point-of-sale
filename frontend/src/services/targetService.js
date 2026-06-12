import { apiClient } from './apiClient'

export const targetService = {
  getAll: async () => {
    return apiClient.get('/api/targets')
  },
  getByDate: async (date) => {
    return apiClient.get(`/api/targets/${date}`)
  },
  upsert: async (targetData) => {
    return apiClient.post('/api/targets', targetData)
  },
  delete: async (date) => {
    return apiClient.delete(`/api/targets/${date}`)
  }
}

export default targetService
