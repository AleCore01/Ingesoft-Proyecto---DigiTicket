export interface LoginFormData {
  email: string
  password: string
}

export interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export interface LoginFormState {
  data: LoginFormData
  errors: FormErrors
  isLoading: boolean
}

export interface LoginResponse {
  token: string
  id: number
  role: string
  name: string
}
