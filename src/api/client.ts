// src/api/client.ts
import axios from 'axios'
import { API_BASE_URL } from '../lib/config'

function normalizeBaseUrl(raw?: string) {
  const v = (raw || '').trim()

  // fallback for local dev
  const base = v || 'http://localhost:8000'

  // remove trailing slashes
  const noTrailing = base.replace(/\/+$/, '')

  // IMPORTANT:
  // if someone set API_BASE_URL="https://api.arcflow.space/api"
  // strip the ending "/api" so our calls can remain "/api/..."
  const withoutApiSuffix = noTrailing.replace(/\/api$/i, '')

  return withoutApiSuffix
}

export const api = axios.create({
  baseURL: normalizeBaseUrl(API_BASE_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Debug interceptor (keeps logs clean + shows full resolved URL)
api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'GET').toUpperCase()
    const base = config.baseURL || ''
    const url = config.url || ''
    const full = `${base}${url.startsWith('/') ? '' : '/'}${url}`
    console.log('API Request:', method, full)
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export type ApiError = {
  detail?: string
  message?: string
}
