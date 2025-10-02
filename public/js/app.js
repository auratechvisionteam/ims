// Main Application Controller
class AppController {
    constructor() {
        this.currentView = null;
        this.currentUser = TokenManager.getUser();
        this.currentFilter = 'All';
        this.currentComplaint = null;
        this.charts = {};

        this.init();
    }

    init() {
        // Check if user is logged in
        if (this.currentUser) {
            this.showDashboard();
        } else {
            this.showView('landing');
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Landing page
        document.getElementById('get-started-btn')?.addEventListener('click', () => {
            this.showView('role-selection');
        });

        // Role selection
        document.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const role = e.currentTarget.dataset.role;
                this.showLogin(role);
            });
        });

        // Login form
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('back-to-role-btn')?.addEventListener('click', () => {
            this.showView('role-selection');
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            API.auth.logout();
        });

        // Faculty complaint form
        document.getElementById('complaint-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateComplaint();
        });

        // User management role change
        document.getElementById('new-user-role')?.addEventListener('change', (e) => {
            this.updateDepartmentOptions(e.target.value);
        });

        // Create user form
        document.getElementById('create-user-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateUser();
        });

        // Update complaint form
        document.getElementById('update-complaint-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateComplaint();
        });

        // Modal close
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('complaint-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'complaint-modal') {
                this.closeModal();
            }
        });

        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.handleFilter(e.target);
            }
        });

        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAdminTab(e.target.dataset.tab);
            });
        });
    }

    showView(viewName) {
        // Hide all views
        const views = ['landing', 'role-selection', 'login', 'faculty-dashboard', 'maintenance-dashboard', 'admin-dashboard'];
        views.forEach(view => {
            const element = document.getElementById(`${view}-view`) || document.getElementById(view);
            if (element) element.classList.add('hidden');
        });

        // Show requested view
        const targetView = document.getElementById(`${viewName}-view`) || document.getElementById(viewName);
        if (targetView) {
            targetView.classList.remove('hidden');
            this.currentView = viewName;
        }

        // Show/hide navbar
        const navbar = document.getElementById('navbar');
        if (['faculty-dashboard', 'maintenance-dashboard', 'admin-dashboard'].includes(viewName)) {
            navbar.classList.remove('hidden');
        } else {
            navbar.classList.add('hidden');
        }
    }

    showLogin(role) {
        this.showView('login');
        document.getElementById('login-role').value = role;

        // Show department field for Maintenance
        const deptField = document.getElementById('maintenance-dept-field');
        if (role === 'Maintenance') {
            deptField.classList.remove('hidden');
            document.getElementById('login-department').required = true;
        } else {
            deptField.classList.add('hidden');
            document.getElementById('login-department').required = false;
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.getElementById('login-role').value;
        const department = document.getElementById('login-department').value;

        this.showLoading(true);

        try {
            const data = await API.auth.login(email, password, role, department);
            this.currentUser = data.user;
            this.showDashboard();
            this.showToast('Login successful!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showDashboard() {
        // Update navbar
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-role').textContent = this.currentUser.role + (this.currentUser.department ? ' - ' + this.currentUser.department : '');

        // Hide user management tab for non-SuperAdmin
        const userMgmtTab = document.getElementById('user-mgmt-tab');
        if (this.currentUser.role !== 'SuperAdmin') {
            userMgmtTab.classList.add('hidden');
        } else {
            userMgmtTab.classList.remove('hidden');
        }

        // Show appropriate dashboard
        switch (this.currentUser.role) {
            case 'Faculty':
                this.showView('faculty-dashboard');
                this.loadFacultyDashboard();
                break;
            case 'Maintenance':
                this.showView('maintenance-dashboard');
                this.loadMaintenanceDashboard();
                break;
            case 'Admin':
            case 'SuperAdmin':
                this.showView('admin-dashboard');
                this.loadAdminDashboard();
                break;
        }
    }

    async loadFacultyDashboard() {
        this.showLoading(true);
        try {
            const complaints = await API.complaints.getAll();
            this.renderFacultyStats(complaints);
            this.renderComplaintsList(complaints, 'faculty-complaints-list');
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadMaintenanceDashboard() {
        this.showLoading(true);
        try {
            const complaints = await API.complaints.getAll();
            this.renderComplaintsList(complaints, 'maintenance-complaints-list');
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadAdminDashboard() {
        this.showLoading(true);
        try {
            const [stats, byDept, byStatus, complaints] = await Promise.all([
                API.stats.getDashboard(),
                API.stats.getByDepartment(),
                API.stats.getByStatus(),
                API.complaints.getAll()
            ]);

            this.renderAdminStats(stats);
            this.renderCharts(byDept, byStatus);
            this.renderComplaintsList(complaints, 'admin-complaints-list');
            this.renderRecentActivity(stats.recentActivity);
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderFacultyStats(complaints) {
        const total = complaints.length;
        const newCount = complaints.filter(c => c.status === 'New').length;
        const inProgress = complaints.filter(c => c.status === 'In Progress').length;
        const resolved = complaints.filter(c => c.status === 'Resolved').length;

        document.getElementById('faculty-total').textContent = total;
        document.getElementById('faculty-new').textContent = newCount;
        document.getElementById('faculty-in-progress').textContent = inProgress;
        document.getElementById('faculty-resolved').textContent = resolved;
    }

    renderAdminStats(stats) {
        document.getElementById('admin-total').textContent = stats.total;
        document.getElementById('admin-open').textContent = stats.open;
        document.getElementById('admin-resolved').textContent = stats.resolved;
        document.getElementById('admin-avg-time').textContent = stats.avgResolutionTime + 'h';
    }

    renderCharts(byDept, byStatus) {
        // Status Chart
        const statusCtx = document.getElementById('status-chart');
        if (this.charts.status) this.charts.status.destroy();

        this.charts.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: byStatus.map(s => s.status),
                datasets: [{
                    data: byStatus.map(s => s.count),
                    backgroundColor: ['#fee2e2', '#fef3c7', '#d1fae5']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Department Chart
        const deptCtx = document.getElementById('department-chart');
        if (this.charts.department) this.charts.department.destroy();

        this.charts.department = new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: byDept.map(d => d.department),
                datasets: [{
                    label: 'Complaints',
                    data: byDept.map(d => d.count),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderComplaintsList(complaints, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (complaints.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No complaints found</p>';
            return;
        }

        container.innerHTML = complaints.map(complaint => `
            <div class="border rounded-lg p-4 hover:shadow-md transition cursor-pointer complaint-card" data-id="${complaint.id}">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg">${this.escapeHtml(complaint.title)}</h3>
                    <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
                </div>
                <p class="text-gray-600 mb-2">${this.escapeHtml(complaint.description.substring(0, 100))}${complaint.description.length > 100 ? '...' : ''}</p>
                <div class="grid grid-cols-2 gap-2 text-sm text-gray-500">
                    <div><strong>Reported by:</strong> ${this.escapeHtml(complaint.reported_by_name)}</div>
                    <div><strong>Department:</strong> ${this.escapeHtml(complaint.reported_by_department)}</div>
                    <div><strong>Location:</strong> ${complaint.block ? `Block ${complaint.block}` : ''} ${complaint.floor ? `Floor ${complaint.floor}` : ''} ${complaint.room ? `Room ${complaint.room}` : ''}</div>
                    <div><strong>Assigned to:</strong> ${this.escapeHtml(complaint.assigned_to)}</div>
                    <div><strong>Created:</strong> ${new Date(complaint.created_at).toLocaleString()}</div>
                    ${complaint.resolved_at ? `<div><strong>Resolved:</strong> ${new Date(complaint.resolved_at).toLocaleString()}</div>` : ''}
                </div>
            </div>
        `).join('');

        // Attach click handlers
        container.querySelectorAll('.complaint-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showComplaintDetail(card.dataset.id);
            });
        });
    }

    async showComplaintDetail(id) {
        this.showLoading(true);
        try {
            const complaint = await API.complaints.getById(id);
            this.currentComplaint = complaint;

            document.getElementById('modal-title').textContent = complaint.title;

            let content = `
                <div class="space-y-4">
                    <div>
                        <h4 class="font-bold text-gray-700">Status</h4>
                        <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-700">Description</h4>
                        <p class="text-gray-600">${this.escapeHtml(complaint.description)}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-bold text-gray-700">Reported By</h4>
                            <p class="text-gray-600">${this.escapeHtml(complaint.reported_by_name)}</p>
                            <p class="text-gray-500 text-sm">${this.escapeHtml(complaint.reported_by_department)}</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-700">Assigned To</h4>
                            <p class="text-gray-600">${this.escapeHtml(complaint.assigned_to)}</p>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-700">Location</h4>
                            <p class="text-gray-600">
                                ${complaint.block ? `Block ${complaint.block}` : ''}
                                ${complaint.floor ? `Floor ${complaint.floor}` : ''}
                                ${complaint.room ? `Room ${complaint.room}` : ''}
                            </p>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-700">Created</h4>
                            <p class="text-gray-600">${new Date(complaint.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    ${complaint.photo_path ? `
                        <div>
                            <h4 class="font-bold text-gray-700">Photo</h4>
                            <img src="${complaint.photo_path}" alt="Complaint photo" class="mt-2 max-w-full h-auto rounded-lg">
                        </div>
                    ` : ''}
                    ${complaint.resolution_notes ? `
                        <div>
                            <h4 class="font-bold text-gray-700">Resolution Notes</h4>
                            <p class="text-gray-600">${this.escapeHtml(complaint.resolution_notes)}</p>
                        </div>
                    ` : ''}
                    ${complaint.resolved_at ? `
                        <div>
                            <h4 class="font-bold text-gray-700">Resolved At</h4>
                            <p class="text-gray-600">${new Date(complaint.resolved_at).toLocaleString()}</p>
                        </div>
                    ` : ''}
                </div>
            `;

            document.getElementById('modal-content').innerHTML = content;

            // Show update form for maintenance staff
            const updateForm = document.getElementById('update-form-container');
            if (this.currentUser.role === 'Maintenance') {
                updateForm.classList.remove('hidden');
                document.getElementById('update-status').value = complaint.status;
                document.getElementById('update-notes').value = complaint.resolution_notes || '';
            } else {
                updateForm.classList.add('hidden');
            }

            document.getElementById('complaint-modal').classList.add('active');
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    closeModal() {
        document.getElementById('complaint-modal').classList.remove('active');
        this.currentComplaint = null;
    }

    async handleCreateComplaint() {
        const description = document.getElementById('complaint-description').value;
        const block = document.getElementById('complaint-block').value;
        const floor = document.getElementById('complaint-floor').value;
        const room = document.getElementById('complaint-room').value;
        const assigned_to = document.getElementById('complaint-assigned-to').value;
        const photo = document.getElementById('complaint-photo').files[0];

        const formData = new FormData();
        formData.append('description', description);
        formData.append('block', block);
        formData.append('floor', floor);
        formData.append('room', room);
        formData.append('assigned_to', assigned_to);
        if (photo) {
            formData.append('photo', photo);
        }

        this.showLoading(true);

        try {
            await API.complaints.create(formData);
            this.showToast('Complaint submitted successfully!', 'success');
            document.getElementById('complaint-form').reset();
            this.loadFacultyDashboard();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleUpdateComplaint() {
        const status = document.getElementById('update-status').value;
        const resolution_notes = document.getElementById('update-notes').value;

        this.showLoading(true);

        try {
            await API.complaints.update(this.currentComplaint.id, {
                status,
                resolution_notes
            });
            this.showToast('Complaint updated successfully!', 'success');
            this.closeModal();
            this.loadMaintenanceDashboard();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleFilter(button) {
        // Update button styles
        const container = button.parentElement;
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        button.classList.remove('bg-gray-200', 'text-gray-700');
        button.classList.add('bg-blue-600', 'text-white');

        // Apply filter
        this.currentFilter = button.dataset.status;
        this.applyFilter();
    }

    async applyFilter() {
        this.showLoading(true);
        try {
            const complaints = await API.complaints.getAll({ status: this.currentFilter });

            if (this.currentUser.role === 'Faculty') {
                this.renderComplaintsList(complaints, 'faculty-complaints-list');
            } else if (this.currentUser.role === 'Maintenance') {
                this.renderComplaintsList(complaints, 'maintenance-complaints-list');
            } else {
                this.renderComplaintsList(complaints, 'admin-complaints-list');
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    switchAdminTab(tabName) {
        // Update tab styles
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600');
            tab.classList.add('text-gray-600');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        activeTab.classList.add('border-b-2', 'border-blue-600', 'text-blue-600');
        activeTab.classList.remove('text-gray-600');

        // Show tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');

        // Load data for specific tabs
        if (tabName === 'by-faculty') {
            this.loadFacultyDepartmentView();
        } else if (tabName === 'user-management') {
            this.loadUserManagement();
        }
    }

    async loadFacultyDepartmentView() {
        this.showLoading(true);
        try {
            const data = await API.stats.getByFacultyDepartment();
            const container = document.getElementById('faculty-dept-list');

            container.innerHTML = data.map(item => `
                <div class="p-4 bg-gray-50 rounded-lg mb-2">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-lg">${this.escapeHtml(item.department)}</span>
                        <span class="text-2xl font-bold text-blue-600">${item.count}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderRecentActivity(activities) {
        const container = document.getElementById('recent-activity-list');

        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No recent activity</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="p-4 border-b">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-medium">${this.escapeHtml(activity.action)}</p>
                        <p class="text-gray-600 text-sm">${this.escapeHtml(activity.details)}</p>
                        <p class="text-gray-500 text-xs mt-1">
                            ${activity.user_name ? `by ${this.escapeHtml(activity.user_name)}` : ''}
                            ${activity.complaint_title ? `- ${this.escapeHtml(activity.complaint_title)}` : ''}
                        </p>
                    </div>
                    <span class="text-xs text-gray-500">${new Date(activity.timestamp).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    async loadUserManagement() {
        this.showLoading(true);
        try {
            const users = await API.users.getAll();
            this.renderUsersList(users);
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderUsersList(users) {
        const container = document.getElementById('users-list');

        if (users.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No users found</p>';
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-2 text-left">Name</th>
                            <th class="px-4 py-2 text-left">Email</th>
                            <th class="px-4 py-2 text-left">Role</th>
                            <th class="px-4 py-2 text-left">Department</th>
                            <th class="px-4 py-2 text-left">Last Login</th>
                            <th class="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr class="border-t">
                                <td class="px-4 py-2">${this.escapeHtml(user.name)}</td>
                                <td class="px-4 py-2">${this.escapeHtml(user.email)}</td>
                                <td class="px-4 py-2">${this.escapeHtml(user.role)}</td>
                                <td class="px-4 py-2">${user.department ? this.escapeHtml(user.department) : '-'}</td>
                                <td class="px-4 py-2">${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                                <td class="px-4 py-2">
                                    <button class="text-blue-600 hover:underline mr-2 reset-password-btn" data-id="${user.id}">Reset Password</button>
                                    ${user.id !== 1 && user.id !== this.currentUser.id ? `<button class="text-red-600 hover:underline delete-user-btn" data-id="${user.id}">Delete</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Attach event handlers
        container.querySelectorAll('.reset-password-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleResetPassword(btn.dataset.id));
        });

        container.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleDeleteUser(btn.dataset.id));
        });
    }

    updateDepartmentOptions(role) {
        const deptSelect = document.getElementById('new-user-department');
        deptSelect.innerHTML = '<option value="">Select Department</option>';

        let options = [];
        if (role === 'Faculty') {
            options = ['CSD', 'CSM', 'CSC', 'CSE', 'ECE', 'IT', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'ADMIN'];
            deptSelect.required = true;
        } else if (role === 'Maintenance') {
            options = ['Electrical', 'IT & Network', 'Carpentry', 'Sanitary & Plumbing', 'Housekeeping', 'Maintenance', 'Other'];
            deptSelect.required = true;
        } else {
            deptSelect.required = false;
        }

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            deptSelect.appendChild(option);
        });
    }

    async handleCreateUser() {
        const email = document.getElementById('new-user-email').value;
        const name = document.getElementById('new-user-name').value;
        const password = document.getElementById('new-user-password').value;
        const role = document.getElementById('new-user-role').value;
        const department = document.getElementById('new-user-department').value;

        this.showLoading(true);

        try {
            await API.users.create({ email, name, password, role, department });
            this.showToast('User created successfully!', 'success');
            document.getElementById('create-user-form').reset();
            this.loadUserManagement();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleResetPassword(userId) {
        const newPassword = prompt('Enter new password:');
        if (!newPassword) return;

        this.showLoading(true);

        try {
            await API.users.resetPassword(userId, newPassword);
            this.showToast('Password reset successfully!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleDeleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        this.showLoading(true);

        try {
            await API.users.delete(userId);
            this.showToast('User deleted successfully!', 'success');
            this.loadUserManagement();
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loader = document.getElementById('loading');
        if (show) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});
