/**
 * Auth service interfaces (auth-microservice contract)
 */

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: AuthUser;
}
