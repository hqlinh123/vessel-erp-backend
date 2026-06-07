// src/auth/jwt.service.ts
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  tenant: string;
  roles: string[];
}

interface RefreshTokenPayload {
  userId: string;
  companyId: string;
}

@Injectable()
export class JwtService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  private readonly jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';

  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, this.jwtRefreshSecret) as RefreshTokenPayload;
    } catch {
      return null;
    }
  }
}
