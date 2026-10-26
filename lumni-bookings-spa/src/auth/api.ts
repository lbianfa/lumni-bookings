import { ApiError, httpClient } from '../api/http-client'
import type { Credentials, User } from './auth.types'

export async function login(credentials: Credentials): Promise<User> {
  const { data } = await httpClient.post<User>('/auth/login', credentials)
  return data
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout')
}

// A missing or expired session is a normal state, not an error.
export async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await httpClient.get<User>('/auth/me')
    return data
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
