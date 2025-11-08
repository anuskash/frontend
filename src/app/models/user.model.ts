import { UserProfileRequest } from './user-profile.model';

export interface User {
  userId: number;
  role: string;
  passwordHash: string | null;
  status: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AppUserRequest {
  email: string;
  password: string;
}

// Alias for consistency - both interfaces are identical
export type UserCredentials = LoginRequest;

export interface LoginResponse extends User {
  // The response is the User object itself
}

export interface CreateUserRequest {
  appUser: AppUserRequest;
  userProfile: UserProfileRequest;
}

export interface AppUserResponse extends User {
  // Response when creating a new user - extends the base User interface
}