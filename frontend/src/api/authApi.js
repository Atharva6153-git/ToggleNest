import axiosInstance, { USER_KEY } from './axiosInstance'

const persistUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData)
  return response.data
}

export const login = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials)
  const { user } = response.data.data
  persistUser(user)
  return response.data.data
}

export const firebaseLogin = async (idToken) => {
  const response = await axiosInstance.post('/auth/firebase-login', { idToken })
  const { user } = response.data.data
  persistUser(user)
  return response.data.data
}

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me')
  return response.data.data
}

export const getProfile = async () => {
  const response = await axiosInstance.get('/auth/profile')
  return response.data.data.user
}

export const updateProfile = async (payload) => {
  const response = await axiosInstance.put('/auth/profile', payload)
  return response.data.data
}

export const changePassword = async (payload) => {
  const response = await axiosInstance.put('/auth/change-password', payload)
  return response.data.data
}

export const uploadProfilePicture = async (formData) => {
  const response = await axiosInstance.post('/auth/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export const getUsers = async () => {
  const response = await axiosInstance.get('/auth/users')
  return response.data.data
}

export const getAssigneeUsers = async () => {
  const response = await axiosInstance.get('/auth/users/assignees')
  return response.data.data
}

export const updateUserRole = async (userId, role) => {
  const response = await axiosInstance.patch(`/auth/users/${userId}/role`, { role })
  return response.data.data
}

export const logout = async () => {
  try {
    await axiosInstance.post('/auth/logout')
  } catch {
    // Even if the server call fails, clear local state.
  } finally {
    localStorage.removeItem(USER_KEY)
  }
}
