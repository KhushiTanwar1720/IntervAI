const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('intervai_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && !options.isFormData && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    getMe: () => request('/auth/me')
  },

  // Profile
  profile: {
    get: () => request('/profile'),
    update: (profileData) => request('/profile', { method: 'PUT', body: profileData }),
    getCompleteness: () => request('/profile/completeness')
  },

  // Resume
  resume: {
    upload: (file) => {
      const formData = new FormData();
      formData.append('resume', file);
      return request('/resume/upload', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
    },
    merge: (mergePayload) => request('/resume/merge', { method: 'POST', body: mergePayload }),
    getHistory: () => request('/resume/history')
  },

  // Roles
  roles: {
    getAll: () => request('/roles'),
    getRecommendations: () => request('/roles/recommendations'),
    getSelected: () => request('/roles/selected'),
    select: (roleTitle, isPrimary = false, matchScore = 0) =>
      request('/roles/select', { method: 'POST', body: { roleTitle, isPrimary, matchScore } }),
    unselect: (roleTitle) =>
      request(`/roles/select/${encodeURIComponent(roleTitle)}`, { method: 'DELETE' })
  },

  // Job Description
  jd: {
    analyze: (jdData) => request('/jd/analyze', { method: 'POST', body: jdData }),
    getHistory: () => request('/jd/history'),
    getById: (id) => request(`/jd/${id}`)
  },

  // Roadmap
  roadmap: {
    get: () => request('/roadmap'),
    generate: (payload) => request('/roadmap/generate', { method: 'POST', body: payload }),
    toggleTask: (taskId) => request(`/roadmap/tasks/${taskId}/toggle`, { method: 'PATCH' })
  },

  // Resources
  resources: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.category) searchParams.append('category', params.category);
      if (params.type) searchParams.append('type', params.type);
      if (params.search) searchParams.append('search', params.search);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request(`/resources${query}`);
    },
    getBookmarks: () => request('/resources/bookmarks'),
    toggleBookmark: (id) => request(`/resources/${id}/bookmark`, { method: 'POST' }),
    toggleCompleted: (id) => request(`/resources/${id}/complete`, { method: 'POST' })
  },

  // Interviews
  interview: {
    create: (config) => request('/interview/create', { method: 'POST', body: config }),
    getById: (id) => request(`/interview/${id}`),
    submitAnswer: (id, payload) => request(`/interview/${id}/answer`, { method: 'POST', body: payload }),
    finish: (id) => request(`/interview/${id}/finish`, { method: 'POST' }),
    getHistory: () => request('/interview/history')
  },

  // Analytics
  analytics: {
    getDashboard: () => request('/analytics/dashboard')
  },

  // Settings
  settings: {
    get: () => request('/settings'),
    update: (settingsData) => request('/settings', { method: 'PUT', body: settingsData })
  }
};
