import axios from 'axios'
import { setupMockServer } from './mockServer'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const client = axios.create({
  baseURL,
  timeout: 8000,
})

const shouldUseMockServer = import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL

if (shouldUseMockServer) {
  setupMockServer(client)
}

export default client

