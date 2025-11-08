export interface UserProfile {
  profileId: number;
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface CreateUserProfileRequest {
  userId: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface UserProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImageUrl: string;
}