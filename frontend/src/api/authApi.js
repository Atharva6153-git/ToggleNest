import axiosInstance, { TOKEN_KEY } from './axiosInstance'

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

export const getUsers = async () => {
  const response = await axiosInstance.get('/auth/users')
  return response.data.data
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('user')
}