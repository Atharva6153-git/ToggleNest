import axiosInstance from './axiosInstance'

export const getTasks = async (projectId, params = {}) => {
  const query = { ...params }
  if (projectId) {
    query.project = projectId
  }
  if (query.limit === undefined) {
    query.limit = 1000
  }
  const response = await axiosInstance.get('/tasks', { params: query })
  return response.data.data
}

export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData)
  return response.data.data
}

export const updateTask = async (taskId, updates) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, updates)
  return response.data.data
}

export const updateTaskStatus = async (taskId, status) => {
  const response = await axiosInstance.patch(`/tasks/${taskId}/status`, { status })
  return response.data.data
}

export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`)
  return response.data.data
}