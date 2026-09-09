import axiosInstance from './axiosInstance'

export const getNotifications = async (params = {}) => {
  const response = await axiosInstance.get('/notifications', { params })
  return response.data
}

export const markAsRead = async (id) => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`)
  return response.data.data
}

export const markAllAsRead = async () => {
  const response = await axiosInstance.patch('/notifications/read-all')
  return response.data.data
}
