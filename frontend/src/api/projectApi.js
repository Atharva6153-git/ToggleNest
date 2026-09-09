import axiosInstance from './axiosInstance'

export const getProjects = async () => {
  const response = await axiosInstance.get('/projects', { params: { limit: 100 } })
  return response.data.data
}

export const getProject = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}`)
  return response.data.data
}

export const createProject = async (projectData) => {
  const response = await axiosInstance.post('/projects', projectData)
  return response.data.data
}

export const updateProject = async (projectId, projectData) => {
  const response = await axiosInstance.put(`/projects/${projectId}`, projectData)
  return response.data.data
}

export const deleteProject = async (projectId) => {
  const response = await axiosInstance.delete(`/projects/${projectId}`)
  return response.data.data
}