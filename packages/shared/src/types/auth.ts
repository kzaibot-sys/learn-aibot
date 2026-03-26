export interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TelegramAuthDto {
  initData: string;
}

export interface TelegramLinkDto {
  initData: string;
}
