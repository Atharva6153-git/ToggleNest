import axiosInstance from './axiosInstance'

export const getComments = async (projectId) => {
  const response = await axiosInstance.get('/comments', { params: { project: projectId } })
  return response.data.data
}

export const createComment = async (projectId, text) => {
  const response = await axiosInstance.post('/comments', { project: projectId, text })
  return response.data.data
}

export const deleteComment = async (commentId) => {
  const response = await axiosInstance.delete(`/comments/${commentId}`)
  return response.data.data
}