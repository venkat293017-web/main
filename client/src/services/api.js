const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('winarena_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.error ||
      (response.status === 500
        ? 'Backend server error or server is unavailable (port 5000)'
        : `Request failed with status ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request('/auth/me'),
    updateProfile: (profileData) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
  },

  // Tournaments
  tournaments: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/tournaments${query ? `?${query}` : ''}`);
    },
    getByIdOrSlug: (idOrSlug) => request(`/tournaments/${idOrSlug}`),
    getLeaderboard: (id) => request(`/tournaments/${id}/leaderboard`),
    create: (data) =>
      request('/tournaments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/tournaments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateStatus: (id, status) =>
      request(`/tournaments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    declareWinner: (id) =>
      request(`/tournaments/${id}/declare-winner`, {
        method: 'POST',
      }),
    setFeatured: (id) =>
      request(`/tournaments/${id}/feature`, {
        method: 'PUT',
      }),
    delete: (id) =>
      request(`/tournaments/${id}`, {
        method: 'DELETE',
      }),
  },

  // Guaranteed Gifts
  gifts: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/gifts${query ? `?${query}` : ''}`);
    },
    getAllAdmin: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/gifts/admin/all${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/gifts/${id}`),
    create: (data) =>
      request('/gifts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/gifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateStatus: (id, is_active) =>
      request(`/gifts/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active }),
      }),
    delete: (id) =>
      request(`/gifts/${id}`, {
        method: 'DELETE',
      }),
  },

  // Orders & Guaranteed Reward Fulfillment
  orders: {
    checkout: (orderData) =>
      request('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    getMy: () => request('/orders/my'),
    getById: (id) => request(`/orders/${id}`),
    getAllAdmin: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/orders/admin/all${query ? `?${query}` : ''}`);
    },
    updateStatus: (id, statusData) =>
      request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
      }),
  },

  // Nokia Snake II Game
  game: {
    getSettings: () => request('/game/settings'),
    startSession: (tournamentId) =>
      request('/game/start-session', {
        method: 'POST',
        body: JSON.stringify({ tournament_id: tournamentId }),
      }),
    submitScore: (scoreData) =>
      request('/game/submit-score', {
        method: 'POST',
        body: JSON.stringify(scoreData),
      }),
  },

  // Admin & Role Management
  admin: {
    getOverview: () => request('/admin/overview'),
    getUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/users${query ? `?${query}` : ''}`);
    },
    updateUserRole: (userId, role) =>
      request(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    toggleBlockUser: (userId, isBlocked, reason = '') =>
      request(`/admin/users/${userId}/block`, {
        method: 'PUT',
        body: JSON.stringify({ is_blocked: isBlocked, reason }),
      }),
    bulkBlockUsers: (userIds, isBlocked, reason = '') =>
      request('/admin/users/bulk-block', {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds, is_blocked: isBlocked, reason }),
      }),

    updateGameSettings: (settingsData) =>
      request('/admin/game-settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      }),
    getFinancials: () => request('/admin/financials'),
    getCompetitionParticipants: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/competitions-participants${query ? `?${query}` : ''}`);
    },
    getTournamentParticipants: (tournamentId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/tournaments/${tournamentId}/participants${query ? `?${query}` : ''}`);
    },
    uploadImage: (uploadData) =>
      request('/admin/upload-image', {
        method: 'POST',
        body: JSON.stringify(uploadData),
      }),
    uploadLogo: (uploadData) =>
      request('/admin/upload-logo', {
        method: 'POST',
        body: JSON.stringify(uploadData),
      }),
    getAppSettings: () => request('/admin/app-settings'),
    updateAppSettings: (settingsData) =>
      request('/admin/app-settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      }),
  },

  // Global Application Settings
  settings: {
    getPublic: () => request('/app-settings'),
    getAdmin: () => request('/admin/app-settings'),
    update: (settingsData) =>
      request('/admin/app-settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      }),
    uploadLogo: (uploadData) =>
      request('/admin/upload-logo', {
        method: 'POST',
        body: JSON.stringify(uploadData),
      }),
  },
};

