import axios, { isAxiosError } from 'axios'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Same-origin /api prefix: the browser sends the httpOnly session cookie on its own.
export const httpClient = axios.create({ baseURL: '/api' })

httpClient.interceptors.response.use(undefined, (error: unknown) => {
  // The body may be empty or not JSON (e.g. a proxy error page).
  if (isAxiosError<{ message?: unknown } | null>(error) && error.response) {
    const { status, data } = error.response
    const message =
      typeof data?.message === 'string'
        ? data.message
        : `Request failed with status ${status}`
    throw new ApiError(status, message)
  }
  throw error
})
