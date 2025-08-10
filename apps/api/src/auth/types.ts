import { Request } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export type RequestWithUser = Request & { user: AuthUser };
