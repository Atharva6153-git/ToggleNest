import axiosInstance from './axiosInstance'

export const getActivityLogs = async (params = {}) => {
  const response = await axiosInstance.get('/activity-logs', { params })
  return response.data.data
}