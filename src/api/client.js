import axios from 'axios'
import { setupMockServer } from './mockServer'

const normalizedBaseUrl = (() => {
  const value = import.meta.env.VITE_API_BASE_URL
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed.replace(/\/+$/, '') : undefined
})()

const client = axios.create({
  baseURL: normalizedBaseUrl ?? 'https://api.pornwatchtv.com',
  timeout: 8000,
})

const shouldUseMockServer = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'

if (shouldUseMockServer) {
  setupMockServer(client)
}

export default client

