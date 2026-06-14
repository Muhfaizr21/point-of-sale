import { apiClient } from './apiClient'

const qs = (branchId) => branchId ? `?branch_id=${branchId}` : ''

export const targetService = {
  getAll: async (branchId) => {
    return apiClient.get(`/api/targets${qs(branchId)}`)
  },
  getByDate: async (date, branchId) => {
    return apiClient.get(`/api/targets/${date}${qs(branchId)}`)
  },
  upsert: async (targetData, branchId) => {
    const url = branchId ? `/api/targets?branch_id=${branchId}` : '/api/targets'
    return apiClient.post(url, targetData)
  },
  delete: async (date, branchId) => {
    return apiClient.delete(`/api/targets/${date}${qs(branchId)}`)
  }
}

export default targetService
