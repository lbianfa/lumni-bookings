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
