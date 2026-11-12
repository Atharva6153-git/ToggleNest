import axios from 'axios'

export const USER_KEY = 'user'
export const CSRF_COOKIE_NAME = 'tn_csrf'

const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`

const SAFE_METHODS = new Set(['get', 'head', 'options'])

const readCookie = (name) => {
  if (typeof document === 'undefined') return ''
  const prefix = `${name}=`
  const match = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
  return match ? decodeURIComponent(match.slice(prefix.length)) : ''
}

let csrfRequest = null

const ensureCsrfToken = async () => {
  const existing = readCookie(CSRF_COOKIE_NAME)
  if (existing) return existing

  if (!csrfRequest) {
    csrfRequest = axios
      .get(`${API_BASE_URL}/auth/csrf`, { withCredentials: true, timeout: 10000 })
      .then((response) => response?.data?.data?.csrfToken || readCookie(CSRF_COOKIE_NAME))
      .catch(() => '')
      .finally(() => {
        csrfRequest = null
      })
  }

  return csrfRequest
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(async (config) => {
  const method = String(config.method || 'get').toLowerCase()

  // The session lives in an httpOnly cookie. Unsafe requests additionally need
  // the double-submit CSRF token echoed from the readable CSRF cookie.
  if (!SAFE_METHODS.has(method)) {
    const csrfToken = await ensureCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (status === 401 && typeof window !== 'undefined') {
      // Session expired/revoked. AuthContext will observe the next /auth/me
      // failure and render the signed-out state.
      localStorage.removeItem(USER_KEY)
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
