export type Role = 'customer' | 'admin'

export interface User {
  id: string
  email: string
  role: Role
}

export interface Credentials {
  email: string
  password: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function send(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  return response
}

async function readErrorMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null)
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }
  return `Request failed with status ${response.status}`
}

export async function login(credentials: Credentials): Promise<User> {
  const response = await send('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return response.json()
}

export async function logout(): Promise<void> {
  await send('/auth/logout', { method: 'POST' })
}

// A missing or expired session is a normal state, not an error.
export async function fetchMe(): Promise<User | null> {
  try {
    const response = await send('/auth/me')
    return await response.json()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
