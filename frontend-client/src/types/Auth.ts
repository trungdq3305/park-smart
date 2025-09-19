export interface UserToken {
  accessToken: string
}

export interface UserData {
  email: string
  id: string
  facility: {
    _id: string
    facilityName: string
    address: string
  }
  role: string
  name: string
  phoneNumber: string
  exp: boolean
  gender: string
}

export interface AuthState {
  userData: UserData | null
  userToken: UserToken | null
  isAuthenticated: boolean
  isLoading: boolean
}
