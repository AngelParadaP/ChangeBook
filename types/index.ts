/**
 * Global type definitions
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  author?: User;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}
