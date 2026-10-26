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
const api = axios.create({ baseURL: '/api' })

api.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    const { status, data } = error.response
    throw new ApiError(status, readErrorMessage(data, status))
  }
  throw error
})

function readErrorMessage(body: unknown, status: number) {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }
  return `Request failed with status ${status}`
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

export async function send<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const response = await api.request<T>({
    url: path,
    method,
    data: body,
    signal,
  })
  return response.status === 204 ? (undefined as T) : response.data
}

type Options = Omit<RequestOptions, 'method' | 'body'>

export const httpClient = {
  get: <T>(path: string, options?: Options) =>
    send<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Options) =>
    send<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Options) =>
    send<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Options) =>
    send<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Options) =>
    send<T>(path, { ...options, method: 'DELETE' }),
}
