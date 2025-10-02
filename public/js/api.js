// API Client Module
const API_BASE = window.location.origin;

// Token management
const TokenManager = {
    get: () => localStorage.getItem('token'),
    set: (token) => localStorage.setItem('token', token),
    remove: () => localStorage.removeItem('token'),
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    removeUser: () => localStorage.removeItem('user')
};

// HTTP client with auth
const http = async (url, options = {}) => {
    const token = TokenManager.get();

    const headers = {
        ...options.headers
    };

    // Add authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add content-type for JSON if not multipart form data
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
    });

    // Handle unauthorized
    if (response.status === 401 || response.status === 403) {
        const error = await response.json();
        if (error.error.includes('token')) {
            TokenManager.remove();
            TokenManager.removeUser();
            window.location.reload();
        }
    }

    // Parse JSON response
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
};

// API methods
const API = {
    // Authentication
    auth: {
        login: async (email, password, role, department) => {
            const body = { email, password };
            if (role) body.role = role;
            if (department) body.department = department;

            const data = await http('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            TokenManager.set(data.token);
            TokenManager.setUser(data.user);
            return data;
        },

        logout: () => {
            TokenManager.remove();
            TokenManager.removeUser();
            window.location.reload();
        }
    },

    // Users
    users: {
        getAll: () => http('/api/users'),

        create: (userData) => http('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        resetPassword: (userId, newPassword) => http(`/api/users/${userId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword })
        }),

        delete: (userId) => http(`/api/users/${userId}`, {
            method: 'DELETE'
        })
    },

    // Complaints
    complaints: {
        getAll: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'All') {
                params.append('status', filters.status);
            }
            if (filters.department) {
                params.append('department', filters.department);
            }

            const queryString = params.toString();
            return http(`/api/complaints${queryString ? '?' + queryString : ''}`);
        },

        getById: (id) => http(`/api/complaints/${id}`),

        create: (formData) => http('/api/complaints', {
            method: 'POST',
            body: formData // FormData for file upload
        }),

        update: (id, data) => http(`/api/complaints/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })
    },

    // Statistics
    stats: {
        getDashboard: () => http('/api/stats/dashboard'),
        getByDepartment: () => http('/api/stats/by-department'),
        getByStatus: () => http('/api/stats/by-status'),
        getByFacultyDepartment: () => http('/api/stats/by-faculty-department')
    }
};
