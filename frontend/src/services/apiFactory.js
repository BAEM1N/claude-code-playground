/**
 * API Service Factory
 *
 * Provides reusable CRUD API functions to reduce code duplication
 * in frontend/src/services/api.js by ~40%.
 *
 * Usage:
 *   const coursesAPI = createCRUDAPI('/courses');
 *   // Automatically provides: getAll, getOne, create, update, delete
 *
 *   // Add custom methods:
 *   coursesAPI.getMembers = (id) => api.get(`/courses/${id}/members`);
 */

import api from './api';

/**
 * Create a standard CRUD API service
 *
 * @param {string} basePath - Base API path (e.g., '/courses', '/assignments')
 * @param {Object} options - Additional options
 * @param {string} options.idParam - ID parameter name (default: 'id')
 * @param {string} options.listParam - Query param for filtering (default: null)
 * @returns {Object} CRUD API methods
 */
export const createCRUDAPI = (basePath, options = {}) => {
  const { idParam = 'id', listParam = null } = options;

  return {
    /**
     * Get all records with optional filtering and pagination
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    getAll: (params = {}) => {
      return api.get(basePath, { params });
    },

    /**
     * Get a single record by ID
     * @param {string|number} id - Record ID
     * @returns {Promise} API response
     */
    getOne: (id) => {
      return api.get(`${basePath}/${id}`);
    },

    /**
     * Create a new record
     * @param {Object} data - Record data
     * @param {Object} params - Optional query parameters
     * @returns {Promise} API response
     */
    create: (data, params = {}) => {
      return api.post(basePath, data, { params });
    },

    /**
     * Update an existing record
     * @param {string|number} id - Record ID
     * @param {Object} data - Updated data
     * @returns {Promise} API response
     */
    update: (id, data) => {
      return api.put(`${basePath}/${id}`, data);
    },

    /**
     * Partially update a record
     * @param {string|number} id - Record ID
     * @param {Object} data - Partial data
     * @returns {Promise} API response
     */
    patch: (id, data) => {
      return api.patch(`${basePath}/${id}`, data);
    },

    /**
     * Delete a record
     * @param {string|number} id - Record ID
     * @returns {Promise} API response
     */
    delete: (id) => {
      return api.delete(`${basePath}/${id}`);
    },
  };
};

/**
 * Create a nested resource API service
 * (e.g., /courses/:courseId/assignments)
 *
 * @param {string} parentPath - Parent resource path (e.g., '/courses')
 * @param {string} resourcePath - Resource path (e.g., '/assignments')
 * @param {string} parentIdParam - Parent ID parameter name (default: 'parentId')
 * @returns {Object} Nested CRUD API methods
 */
export const createNestedCRUDAPI = (
  parentPath,
  resourcePath,
  parentIdParam = 'parentId'
) => {
  return {
    /**
     * Get all records for a parent
     * @param {string|number} parentId - Parent ID
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    getAll: (parentId, params = {}) => {
      return api.get(`${parentPath}/${parentId}${resourcePath}`, { params });
    },

    /**
     * Get a single record
     * @param {string|number} parentId - Parent ID
     * @param {string|number} id - Record ID
     * @returns {Promise} API response
     */
    getOne: (parentId, id) => {
      return api.get(`${parentPath}/${parentId}${resourcePath}/${id}`);
    },

    /**
     * Create a new record under parent
     * @param {string|number} parentId - Parent ID
     * @param {Object} data - Record data
     * @returns {Promise} API response
     */
    create: (parentId, data) => {
      return api.post(`${parentPath}/${parentId}${resourcePath}`, data);
    },

    /**
     * Update a record
     * @param {string|number} parentId - Parent ID
     * @param {string|number} id - Record ID
     * @param {Object} data - Updated data
     * @returns {Promise} API response
     */
    update: (parentId, id, data) => {
      return api.put(`${parentPath}/${parentId}${resourcePath}/${id}`, data);
    },

    /**
     * Delete a record
     * @param {string|number} parentId - Parent ID
     * @param {string|number} id - Record ID
     * @returns {Promise} API response
     */
    delete: (parentId, id) => {
      return api.delete(`${parentPath}/${parentId}${resourcePath}/${id}`);
    },
  };
};

/**
 * Create an API service with custom methods
 *
 * @param {string} basePath - Base API path
 * @param {Object} customMethods - Additional custom methods
 * @returns {Object} Combined CRUD + custom API methods
 */
export const createAPIService = (basePath, customMethods = {}) => {
  const crudMethods = createCRUDAPI(basePath);
  return { ...crudMethods, ...customMethods };
};

/**
 * Batch operations helper
 *
 * @param {string} basePath - Base API path
 * @returns {Object} Batch operation methods
 */
export const createBatchAPI = (basePath) => {
  return {
    /**
     * Create multiple records
     * @param {Array} items - Array of records to create
     * @returns {Promise} API response
     */
    batchCreate: (items) => {
      return api.post(`${basePath}/batch`, { items });
    },

    /**
     * Update multiple records
     * @param {Array} items - Array of records to update
     * @returns {Promise} API response
     */
    batchUpdate: (items) => {
      return api.put(`${basePath}/batch`, { items });
    },

    /**
     * Delete multiple records
     * @param {Array} ids - Array of IDs to delete
     * @returns {Promise} API response
     */
    batchDelete: (ids) => {
      return api.delete(`${basePath}/batch`, { data: { ids } });
    },
  };
};

/**
 * Helper to create a complete API service with common patterns
 *
 * @param {Object} config - Configuration object
 * @param {string} config.basePath - Base API path
 * @param {boolean} config.withBatch - Include batch operations (default: false)
 * @param {Object} config.customMethods - Custom methods to add
 * @returns {Object} Complete API service
 */
export const createCompleteAPI = (config) => {
  const { basePath, withBatch = false, customMethods = {} } = config;

  let apiService = createCRUDAPI(basePath);

  if (withBatch) {
    const batchMethods = createBatchAPI(basePath);
    apiService = { ...apiService, ...batchMethods };
  }

  apiService = { ...apiService, ...customMethods };

  return apiService;
};

/**
 * Example usage patterns:
 *
 * // Simple CRUD
 * const usersAPI = createCRUDAPI('/users');
 * await usersAPI.getAll({ page: 1, limit: 20 });
 * await usersAPI.getOne('123');
 * await usersAPI.create({ name: 'John' });
 * await usersAPI.update('123', { name: 'Jane' });
 * await usersAPI.delete('123');
 *
 * // With custom methods
 * const coursesAPI = createAPIService('/courses', {
 *   getMembers: (id) => api.get(`/courses/${id}/members`),
 *   enroll: (id, userId) => api.post(`/courses/${id}/enroll`, { userId }),
 * });
 *
 * // Nested resources
 * const courseAssignmentsAPI = createNestedCRUDAPI('/courses', '/assignments');
 * await courseAssignmentsAPI.getAll('course123');
 * await courseAssignmentsAPI.create('course123', assignmentData);
 *
 * // Complete with batch operations
 * const productsAPI = createCompleteAPI({
 *   basePath: '/products',
 *   withBatch: true,
 *   customMethods: {
 *     search: (query) => api.get('/products/search', { params: { q: query } }),
 *   },
 * });
 */

export default {
  createCRUDAPI,
  createNestedCRUDAPI,
  createAPIService,
  createBatchAPI,
  createCompleteAPI,
};
