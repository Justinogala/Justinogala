/**
 * Shift Management Service
 * Handles all shift-related API operations
 */

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}/api/shifts${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
};

// ============== Shift CRUD ==============

/**
 * Create a new shift
 */
export const createShift = async (shiftData) => {
  return apiRequest('/create', {
    method: 'POST',
    body: JSON.stringify(shiftData),
  });
};

/**
 * Get all shifts for a workspace
 */
export const getWorkspaceShifts = async (workspaceId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.userId) params.append('user_id', filters.userId);
  if (filters.status) params.append('status', filters.status);

  const queryString = params.toString();
  return apiRequest(`/workspace/${workspaceId}${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a single shift
 */
export const getShift = async (shiftId) => {
  return apiRequest(`/${shiftId}`);
};

/**
 * Update a shift
 */
export const updateShift = async (shiftId, updateData) => {
  return apiRequest(`/${shiftId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete a shift
 */
export const deleteShift = async (shiftId, deleteRecurring = false) => {
  return apiRequest(`/${shiftId}?delete_recurring=${deleteRecurring}`, {
    method: 'DELETE',
  });
};

/**
 * Duplicate a shift to a new date
 */
export const duplicateShift = async (shiftId, newDate) => {
  return apiRequest(`/${shiftId}/duplicate?new_date=${newDate}`, {
    method: 'POST',
  });
};

// ============== User Hours ==============

/**
 * Get user's total hours for a period
 */
export const getUserHours = async (workspaceId, userId, period = 'week') => {
  return apiRequest(`/hours/${workspaceId}/${userId}?period=${period}`);
};

/**
 * Get workspace shift summary
 */
export const getWorkspaceSummary = async (workspaceId) => {
  return apiRequest(`/summary/${workspaceId}`);
};

// ============== Swap Requests ==============

/**
 * Create a shift swap request
 */
export const createSwapRequest = async (requestData) => {
  return apiRequest('/swap-request', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

/**
 * Get all swap requests for a workspace
 */
export const getSwapRequests = async (workspaceId, status = null) => {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/swap-requests/${workspaceId}${query}`);
};

/**
 * Approve a swap request
 */
export const approveSwapRequest = async (requestId) => {
  return apiRequest(`/swap-request/${requestId}/approve`, {
    method: 'PUT',
  });
};

/**
 * Reject a swap request
 */
export const rejectSwapRequest = async (requestId) => {
  return apiRequest(`/swap-request/${requestId}/reject`, {
    method: 'PUT',
  });
};

// ============== Time Off Requests ==============

/**
 * Create a time off request
 */
export const createTimeOffRequest = async (requestData) => {
  return apiRequest('/time-off', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

/**
 * Get all time off requests for a workspace
 */
export const getTimeOffRequests = async (workspaceId, status = null, userId = null) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (userId) params.append('user_id', userId);
  const query = params.toString();
  return apiRequest(`/time-off/${workspaceId}${query ? `?${query}` : ''}`);
};

/**
 * Handle time off request (approve/reject)
 */
export const handleTimeOffRequest = async (requestId, action) => {
  return apiRequest(`/time-off/${requestId}/${action}`, {
    method: 'PUT',
  });
};

// ============== Export ==============

/**
 * Export shifts data
 */
export const exportShifts = async (workspaceId, format = 'csv', startDate = null, endDate = null) => {
  const params = new URLSearchParams();
  params.append('format', format);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(`${API_URL}/api/shifts/export/${workspaceId}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Export failed');
  }

  // Return blob for file download
  return response.blob();
};

/**
 * Download export file
 */
export const downloadExport = async (workspaceId, format = 'csv', startDate = null, endDate = null) => {
  const blob = await exportShifts(workspaceId, format, startDate, endDate);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shifts_export_${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// ============== Roles & Departments ==============

/**
 * Get workspace roles
 */
export const getWorkspaceRoles = async (workspaceId) => {
  return apiRequest(`/roles/${workspaceId}`);
};

/**
 * Get workspace departments
 */
export const getWorkspaceDepartments = async (workspaceId) => {
  return apiRequest(`/departments/${workspaceId}`);
};

// ============== Shift Presets ==============

/**
 * Get shift presets for a workspace
 */
export const getShiftPresets = async (workspaceId) => {
  return apiRequest(`/presets/${workspaceId}`);
};

/**
 * Create a custom shift preset
 */
export const createShiftPreset = async (presetData) => {
  return apiRequest('/presets', {
    method: 'POST',
    body: JSON.stringify(presetData),
  });
};

/**
 * Update a shift preset
 */
export const updateShiftPreset = async (presetId, presetData) => {
  return apiRequest(`/presets/${presetId}`, {
    method: 'PUT',
    body: JSON.stringify(presetData),
  });
};

/**
 * Delete a shift preset
 */
export const deleteShiftPreset = async (presetId) => {
  return apiRequest(`/presets/${presetId}`, {
    method: 'DELETE',
  });
};

export default {
  createShift,
  getWorkspaceShifts,
  getShift,
  updateShift,
  deleteShift,
  duplicateShift,
  getUserHours,
  getWorkspaceSummary,
  createSwapRequest,
  getSwapRequests,
  approveSwapRequest,
  rejectSwapRequest,
  createTimeOffRequest,
  getTimeOffRequests,
  handleTimeOffRequest,
  exportShifts,
  downloadExport,
  getWorkspaceRoles,
  getWorkspaceDepartments,
  getShiftPresets,
  createShiftPreset,
  updateShiftPreset,
  deleteShiftPreset,
};
