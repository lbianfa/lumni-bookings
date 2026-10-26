import { ApiError, httpClient } from '../lib/http-client'
import type { Credentials, User } from './auth.types'

export function login(credentials: Credentials): Promise<User> {
  return httpClient.post<User>('/auth/login', credentials)
}

export function logout(): Promise<void> {
  return httpClient.post<void>('/auth/logout')
}

// A missing or expired session is a normal state, not an error.
export async function fetchMe(): Promise<User | null> {
  try {
    return await httpClient.get<User>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
