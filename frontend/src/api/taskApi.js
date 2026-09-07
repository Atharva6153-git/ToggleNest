import axiosInstance from './axiosInstance'

export const getTasks = async (projectId) => {
  const params = projectId ? { project: projectId } : {}
  const response = await axiosInstance.get('/tasks', { params })
  return response.data
}

export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData)
  return response.data
}

export const updateTask = async (taskId, updates) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, updates)
  return response.data
}

export const updateTaskStatus = async (taskId, status) => {
  const response = await axiosInstance.patch(`/tasks/${taskId}/status`, { status })
  return response.data
}

export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`)
  return response.data
}
