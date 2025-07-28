export interface UserSignUpData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'host' | 'guard';
}

export interface UserLoginData {
    email: string;
    password: string;
}

export interface TokenPayload {
    userId: number;
    role: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    success: boolean;
    data?: {
        user: UserResponse;
        tokens: AuthTokens;
    };
    message?: string;
}
