export interface LoginSchema {
  email: string
  password: string
  [k: string]: any | undefined
}

export interface SignupSchema {
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

export interface ForgotPasswordSchema {
  username: string
  [k: string]: any | undefined
}

export interface ResetPasswordSchema {
  password: string
  token?: string
  [k: string]: any | undefined
}

export interface VerifyAccountSchema {
  token: string
  [k: string]: any | undefined
}
