import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'
import type { AuthState, UserData } from '../../types/Auth'

// Lấy userData từ Cookies
const userData: UserData | null = Cookies.get('userData')
  ? JSON.parse(Cookies.get('userData') as string)
  : null

const userToken = Cookies.get('userToken')

const initialState: AuthState = {
  userData,
  userToken: userToken ? { accessToken: userToken } : null,
  isAuthenticated: !!userData,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    login: (state, action: PayloadAction<{ token: string }>) => {
      const { token } = action.payload

      const decodedToken: any = jwtDecode(token)

      state.userData = {
        email: decodedToken.email,
        id: decodedToken.id,
        role: decodedToken.role,
        name: decodedToken.name,
        phoneNumber: decodedToken.phoneNumber,
        exp: decodedToken.exp,
        facility: {
          _id: decodedToken.facility?._id || '',
          facilityName: decodedToken.facility?.facilityName || '',
          address: decodedToken.facility?.address || '',
        },
        gender: decodedToken.gender,
      }

      state.userToken = { accessToken: token }
      state.isAuthenticated = true

      const expirationDate = new Date(Number(state.userData.exp) * 1000)
      Cookies.set('userData', JSON.stringify(state.userData), {
        expires: expirationDate,
      })
      Cookies.set('userToken', token, { expires: expirationDate })
      if (state.userData.role === 'Customer') {
        window.location.href = '/'
      } else {
        window.location.href = `/${state.userData.role.toLowerCase().replace(/ /g, '-')}`
      }
    },
    logout: (state) => {
      state.userData = null
      state.userToken = null
      state.isAuthenticated = false

      Cookies.remove('userData')
      Cookies.remove('userToken')
    },
  },
})

export const { login, logout, setLoading } = authSlice.actions
export default authSlice.reducer
export const selectAuthUser = (state: { authSlice: AuthState }) => state.authSlice
