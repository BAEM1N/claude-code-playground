/**
 * API Service Factory
 *
 * Provides reusable CRUD API functions to reduce code duplication
 * in frontend/src/services/api.ts by ~40%.
 *
 * Usage:
 *   const coursesAPI = createCRUDAPI('/courses');
 *   // Automatically provides: getAll, getOne, create, update, delete
 *
 *   // Add custom methods:
 *   coursesAPI.getMembers = (id) => api.get(`/courses/${id}/members`);
 */

import { AxiosResponse, AxiosInstance } from 'axios';

export interface CRUDAPIOptions {
  idParam?: string;
  listParam?: string | null;
}

export interface QueryParams {
  [key: string]: any;
}

export interface CRUDAPI<T = any> {
  getAll: (params?: QueryParams) => Promise<AxiosResponse<T[]>>;
  getOne: (id: string | number) => Promise<AxiosResponse<T>>;
  create: (data: Partial<T>, params?: QueryParams) => Promise<AxiosResponse<T>>;
  update: (id: string | number, data: Partial<T>) => Promise<AxiosResponse<T>>;
  patch: (id: string | number, data: Partial<T>) => Promise<AxiosResponse<T>>;
  delete: (id: string | number) => Promise<AxiosResponse<void>>;
}

export interface NestedCRUDAPI<T = any> {
  getAll: (parentId: string | number, params?: QueryParams) => Promise<AxiosResponse<T[]>>;
  getOne: (parentId: string | number, id: string | number) => Promise<AxiosResponse<T>>;
  create: (parentId: string | number, data: Partial<T>) => Promise<AxiosResponse<T>>;
  update: (parentId: string | number, id: string | number, data: Partial<T>) => Promise<AxiosResponse<T>>;
  delete: (parentId: string | number, id: string | number) => Promise<AxiosResponse<void>>;
}

export interface BatchAPI<T = any> {
  batchCreate: (items: Partial<T>[]) => Promise<AxiosResponse<T[]>>;
  batchUpdate: (items: Partial<T>[]) => Promise<AxiosResponse<T[]>>;
  batchDelete: (ids: (string | number)[]) => Promise<AxiosResponse<void>>;
}

/**
 * Create a standard CRUD API service
 *
 * @param basePath - Base API path (e.g., '/courses', '/assignments')
 * @param options - Additional options
 * @returns CRUD API methods
 */
export const createCRUDAPI = <T = any>(
  api: AxiosInstance,
  basePath: string,
  _options: CRUDAPIOptions = {}
): CRUDAPI<T> => {
  // Options available for future enhancements
  // const { idParam = 'id', listParam = null } = _options;

  return {
    /**
     * Get all records with optional filtering and pagination
     * @param params - Query parameters
     * @returns API response
     */
    getAll: (params: QueryParams = {}): Promise<AxiosResponse<T[]>> => {
      return api.get(basePath, { params });
    },

    /**
     * Get a single record by ID
     * @param id - Record ID
     * @returns API response
     */
    getOne: (id: string | number): Promise<AxiosResponse<T>> => {
      return api.get(`${basePath}/${id}`);
    },

    /**
     * Create a new record
     * @param data - Record data
     * @param params - Optional query parameters
     * @returns API response
     */
    create: (data: Partial<T>, params: QueryParams = {}): Promise<AxiosResponse<T>> => {
      return api.post(basePath, data, { params });
    },

    /**
     * Update an existing record
     * @param id - Record ID
     * @param data - Updated data
     * @returns API response
     */
    update: (id: string | number, data: Partial<T>): Promise<AxiosResponse<T>> => {
      return api.put(`${basePath}/${id}`, data);
    },

    /**
     * Partially update a record
     * @param id - Record ID
     * @param data - Partial data
     * @returns API response
     */
    patch: (id: string | number, data: Partial<T>): Promise<AxiosResponse<T>> => {
      return api.patch(`${basePath}/${id}`, data);
    },

    /**
     * Delete a record
     * @param id - Record ID
     * @returns API response
     */
    delete: (id: string | number): Promise<AxiosResponse<void>> => {
      return api.delete(`${basePath}/${id}`);
    },
  };
};

/**
 * Create a nested resource API service
 * (e.g., /courses/:courseId/assignments)
 *
 * @param parentPath - Parent resource path (e.g., '/courses')
 * @param resourcePath - Resource path (e.g., '/assignments')
 * @param parentIdParam - Parent ID parameter name (default: 'parentId')
 * @returns Nested CRUD API methods
 */
export const createNestedCRUDAPI = <T = any>(
  api: AxiosInstance,
  parentPath: string,
  resourcePath: string,
  _parentIdParam: string = 'parentId'
): NestedCRUDAPI<T> => {
  return {
    /**
     * Get all records for a parent
     * @param parentId - Parent ID
     * @param params - Query parameters
     * @returns API response
     */
    getAll: (parentId: string | number, params: QueryParams = {}): Promise<AxiosResponse<T[]>> => {
      return api.get(`${parentPath}/${parentId}${resourcePath}`, { params });
    },

    /**
     * Get a single record
     * @param parentId - Parent ID
     * @param id - Record ID
     * @returns API response
     */
    getOne: (parentId: string | number, id: string | number): Promise<AxiosResponse<T>> => {
      return api.get(`${parentPath}/${parentId}${resourcePath}/${id}`);
    },

    /**
     * Create a new record under parent
     * @param parentId - Parent ID
     * @param data - Record data
     * @returns API response
     */
    create: (parentId: string | number, data: Partial<T>): Promise<AxiosResponse<T>> => {
      return api.post(`${parentPath}/${parentId}${resourcePath}`, data);
    },

    /**
     * Update a record
     * @param parentId - Parent ID
     * @param id - Record ID
     * @param data - Updated data
     * @returns API response
     */
    update: (parentId: string | number, id: string | number, data: Partial<T>): Promise<AxiosResponse<T>> => {
      return api.put(`${parentPath}/${parentId}${resourcePath}/${id}`, data);
    },

    /**
     * Delete a record
     * @param parentId - Parent ID
     * @param id - Record ID
     * @returns API response
     */
    delete: (parentId: string | number, id: string | number): Promise<AxiosResponse<void>> => {
      return api.delete(`${parentPath}/${parentId}${resourcePath}/${id}`);
    },
  };
};

/**
 * Create an API service with custom methods
 *
 * @param basePath - Base API path
 * @param customMethods - Additional custom methods
 * @returns Combined CRUD + custom API methods
 */
export const createAPIService = <T = any, C extends object = {}>(
  api: AxiosInstance,
  basePath: string,
  customMethods: C = {} as C
): CRUDAPI<T> & C => {
  const crudMethods = createCRUDAPI<T>(api, basePath);
  return { ...crudMethods, ...customMethods };
};

/**
 * Batch operations helper
 *
 * @param basePath - Base API path
 * @returns Batch operation methods
 */
export const createBatchAPI = <T = any>(
  api: AxiosInstance,
  basePath: string
): BatchAPI<T> => {
  return {
    /**
     * Create multiple records
     * @param items - Array of records to create
     * @returns API response
     */
    batchCreate: (items: Partial<T>[]): Promise<AxiosResponse<T[]>> => {
      return api.post(`${basePath}/batch`, { items });
    },

    /**
     * Update multiple records
     * @param items - Array of records to update
     * @returns API response
     */
    batchUpdate: (items: Partial<T>[]): Promise<AxiosResponse<T[]>> => {
      return api.put(`${basePath}/batch`, { items });
    },

    /**
     * Delete multiple records
     * @param ids - Array of IDs to delete
     * @returns API response
     */
    batchDelete: (ids: (string | number)[]): Promise<AxiosResponse<void>> => {
      return api.delete(`${basePath}/batch`, { data: { ids } });
    },
  };
};

export interface CompleteAPIConfig<C extends object = {}> {
  basePath: string;
  withBatch?: boolean;
  customMethods?: C;
}

/**
 * Helper to create a complete API service with common patterns
 *
 * @param config - Configuration object
 * @returns Complete API service
 */
export const createCompleteAPI = <T = any, C extends object = {}>(
  api: AxiosInstance,
  config: CompleteAPIConfig<C>
): CRUDAPI<T> & Partial<BatchAPI<T>> & C => {
  const { basePath, withBatch = false, customMethods = {} as C } = config;

  let apiService: any = createCRUDAPI<T>(api, basePath);

  if (withBatch) {
    const batchMethods = createBatchAPI<T>(api, basePath);
    apiService = { ...apiService, ...batchMethods };
  }

  apiService = { ...apiService, ...customMethods };

  return apiService;
};

export default {
  createCRUDAPI,
  createNestedCRUDAPI,
  createAPIService,
  createBatchAPI,
  createCompleteAPI,
};
