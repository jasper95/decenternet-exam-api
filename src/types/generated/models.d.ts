export interface Token {
  id?: string
  created_date?: string
  updated_date?: string
  status?: 'active' | 'inactive'
  type: string
  expiry?: string
  used?: boolean
  [k: string]: any | undefined
}

export interface User {
  id?: string
  created_date?: string
  updated_date?: string
  status?: 'active' | 'inactive'
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'user'
  [k: string]: any | undefined
}

export interface UserAuth {
  id?: string
  created_date?: string
  updated_date?: string
  status?: 'active' | 'inactive'
  user_id: string
  password: string
  [k: string]: any | undefined
}

export interface AuthSession {
  id?: string
  created_date?: string
  updated_date?: string
  status?: 'active' | 'inactive'
  user_id: string
  device_type?: 'Web' | 'Mobile'
  [k: string]: any | undefined
}
