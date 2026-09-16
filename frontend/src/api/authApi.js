import axios from 'axios'
import axiosInstance, { TOKEN_KEY, API_BASE_URL } from './axiosInstance'

export const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData)
  return response.data
}

export const login = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials)
  const { token, user } = response.data.data
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem('user', JSON.stringify(user))
  return response.data.data
}

export const firebaseLogin = async (idToken) => {
  const response = await axiosInstance.post('/auth/firebase-login', { idToken })
  const { token, user } = response.data.data
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem('user', JSON.stringify(user))
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
  const token = localStorage.getItem(TOKEN_KEY)

  const response = await axios.post(`${API_BASE_URL}/auth/profile/picture`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data.data
}

export const getUsers = async () => {
  const response = await axiosInstance.get('/auth/users')
  return response.data.data
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('user')
}