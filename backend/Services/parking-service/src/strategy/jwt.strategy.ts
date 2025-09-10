// jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { RoleEnum } from 'src/common/enum/role.enum'

interface JwtPayload {
  id: string
  email: string
  role: string[]
  driverId?: string
  fullName?: string
  gender?: string
  licenseNumber?: string
  operatorId?: string
  taxCode?: string
  companyName?: string
  contactEmail?: string
  adminId?: string
  department?: string
  position?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET')
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  validate(payload: JwtPayload) {
    if (payload.role.includes(RoleEnum.DRIVER)) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        driverId: payload.driverId,
        fullName: payload.fullName,
        gender: payload.gender,
        licenseNumber: payload.licenseNumber,
      }
    }
    if (payload.role.includes(RoleEnum.OPERATOR)) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        operatorId: payload.operatorId,
        taxCode: payload.taxCode,
        companyName: payload.companyName,
        contactEmail: payload.contactEmail,
        fullName: payload.fullName,
      }
    }
    if (payload.role.includes(RoleEnum.ADMIN)) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        adminId: payload.adminId,
        fullName: payload.fullName,
        department: payload.department,
        position: payload.position,
      }
    }
  }
}
