export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
