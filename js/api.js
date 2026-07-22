/**
 * ArchFlow AI - Centralized API Client
 * All client pages use this module to communicate with the NestJS server.
 * Base URL goes through Nginx reverse proxy on port 8080.
 */

const ARCHFLOW_API_BASE = 'http://localhost:8080/api';

// --- Core Fetch Wrapper ---
async function _request(method, path, body = null) {
    const url = `${ARCHFLOW_API_BASE}${path}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const res = await fetch(url, options);
        const json = await res.json();
        if (!res.ok) {
            throw new Error(json.message || `HTTP ${res.status}`);
        }
        return json;
    } catch (err) {
        console.error(`[ArchFlowAPI] ${method} ${path} failed:`, err.message);
        throw err;
    }
}

// --- Loading State Helper ---
function _setLoading(elementId, isLoading, originalText = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (isLoading) {
        el.disabled = true;
        el.dataset.originalText = el.textContent;
        el.innerHTML = '<span class="spinner-inline"></span> Loading...';
    } else {
        el.disabled = false;
        el.textContent = originalText || el.dataset.originalText || 'Submit';
    }
}

// --- Public API ---
window.ArchFlowAPI = {
    // ── Dashboard ──────────────────────────────────────────────
    async getDashboardSummary() {
        return _request('GET', '/dashboard/summary');
    },

    async getDashboardProjects(limit = 5) {
        return _request('GET', `/dashboard/projects?limit=${limit}`);
    },

    async getDashboardActivity() {
        return _request('GET', '/dashboard/activity');
    },

    async getDashboardAnalytics() {
        return _request('GET', '/dashboard/analytics');
    },

    // ── Projects ───────────────────────────────────────────────
    async getProjects({ page = 1, limit = 10, status = '', search = '' } = {}) {
        const params = new URLSearchParams({ page, limit });
        if (status && status !== 'all') params.set('status', status);
        if (search) params.set('search', search);
        return _request('GET', `/projects?${params}`);
    },

    async getProject(id) {
        return _request('GET', `/projects/${id}`);
    },

    async createProject(data) {
        return _request('POST', '/projects', data);
    },

    async updateProject(id, data) {
        return _request('PATCH', `/projects/${id}`, data);
    },

    async deleteProject(id) {
        return _request('DELETE', `/projects/${id}`);
    },

    async getProjectStats() {
        return _request('GET', '/projects/stats');
    },

    // ── Notifications ──────────────────────────────────────────
    async getNotifications() {
        return _request('GET', '/notifications');
    },

    async markNotificationRead(id) {
        return _request('PATCH', `/notifications/${id}/read`);
    },

    async markAllNotificationsRead() {
        return _request('PATCH', '/notifications/read-all');
    },

    async deleteNotification(id) {
        return _request('DELETE', `/notifications/${id}`);
    },

    // ── Settings ───────────────────────────────────────────────
    async getSettings() {
        return _request('GET', '/settings');
    },

    async saveSettings(data) {
        return _request('PATCH', '/settings', data);
    },

    // ── Exports ────────────────────────────────────────────────
    async getExports() {
        return _request('GET', '/dashboard/exports');
    },

    // ── Health ─────────────────────────────────────────────────
    async healthCheck() {
        try {
            const res = await fetch(`${ARCHFLOW_API_BASE}/dashboard/summary`, { method: 'GET' });
            return res.ok;
        } catch {
            return false;
        }
    },

    // ── Utilities ──────────────────────────────────────────────
    setLoading: _setLoading,

    showError(message) {
        if (window.ArchFlow && window.ArchFlow.showToast) {
            window.ArchFlow.showToast(message, 'danger');
        } else {
            console.error('[ArchFlowAPI Error]', message);
        }
    },

    showSuccess(message) {
        if (window.ArchFlow && window.ArchFlow.showToast) {
            window.ArchFlow.showToast(message, 'success');
        }
    },

    /** Format date for display */
    formatDate(dateString) {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    /** Relative time (e.g. "2 hours ago") */
    timeAgo(dateString) {
        if (!dateString) return '';
        const now = new Date();
        const then = new Date(dateString);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 30) return `${diffDays}d ago`;
        return this.formatDate(dateString);
    },

    /** Status badge HTML */
    statusBadge(status) {
        const map = {
            'Completed':   'badge-success',
            'In Progress': 'badge-warning',
            'Draft':       'badge-secondary',
            'On Hold':     'badge-danger',
        };
        const cls = map[status] || 'badge-secondary';
        return `<span class="status-badge ${cls}">${status}</span>`;
    },
};
