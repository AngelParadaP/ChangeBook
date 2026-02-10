/**
 * User Service
 * Handles all user-related API calls
 */

import { api } from './api';
import type { User, ApiResponse } from '@/types';

export class UserService {
  /**
   * Get all users
   */
  static async getUsers(): Promise<ApiResponse<User[]>> {
    return api.get<ApiResponse<User[]>>('/users');
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(id: number): Promise<ApiResponse<User>> {
    return api.get<ApiResponse<User>>(`/users/${id}`);
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return api.post<ApiResponse<User>>('/users', userData);
  }

  /**
   * Update a user
   */
  static async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return api.patch<ApiResponse<User>>(`/users/${id}`, userData);
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/users/${id}`);
  }
}
