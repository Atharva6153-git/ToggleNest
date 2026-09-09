import axiosInstance from './axiosInstance'

export const getDashboardSummary = async (params = {}) => {
  const response = await axiosInstance.get('/dashboard/summary', { params })
  return response.data.data
}
