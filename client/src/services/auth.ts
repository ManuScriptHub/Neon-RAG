
import { toast } from "sonner";

// Base URL for API endpoints
const API_URL = "/api/v1";

// Type definitions
export interface User {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  results?: User;
  message?: string;
  error?: string;
  status_code: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// Auth service
export const authService = {
  login: async (data: LoginData): Promise<User> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(data),
      });
      
      const result: AuthResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }
      
      if (!result.results) {
        throw new Error('Invalid response format');
      }
      
      return result.results;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (data: RegisterData): Promise<User> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(data),
      });
      
      const result: AuthResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      
      if (!result.results) {
        throw new Error('Invalid response format');
      }
      
      return result.results;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(data),
      });
      
      const result: AuthResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
  
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      
      const response = await fetch(`${API_URL}/auth/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({ email }),
      });
      
      const result: AuthResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to request password reset');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }
};

// Helper function to handle auth errors
export const handleAuthError = (error: unknown): string => {
  console.error('Auth Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  toast.error('Authentication Error', {
    description: errorMessage,
  });
  
  return errorMessage;
};
