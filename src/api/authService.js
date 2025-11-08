import client from './client'

export async function registerUser({ email, username, password, gender }) {
  const payload = {
    email,
    username,
    password,
    ...(gender ? { gender } : {}),
  }

  const response = await client.post('/v1/auth/register', payload)
  return response.data
}

export async function loginUser({ email, password, remember }) {
  const payload = {
    email,
    password,
    ...(remember !== undefined ? { remember } : {}),
  }

  const response = await client.post('/v1/auth/login', payload)
  return response.data
}

export default {
  registerUser,
  loginUser,
}

