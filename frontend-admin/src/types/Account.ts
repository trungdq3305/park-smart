import type { Driver } from "./Driver"
import type { Operator } from "./Operator"
import type { Admin } from "./Admin"

export interface Account {
  _id: string
  roleName: string
  phoneNumber: string
  lastLoginAt? : string 
  email: string
  isActive: boolean
  driverDetail? : Driver
  operatorDetail? : Operator
  adminDetail? : Admin
}