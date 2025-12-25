// Admin Panel - Production Version with Edge Functions
const SUPABASE_URL = 'https://bgjjpiihsegzjcjrrqyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnampwaWloc2VnempjanJycXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzMzOTgsImV4cCI6MjA4MjI0OTM5OH0.GPMTTsRferWTV_JRJOxZkALbeCttsvXK-VLdDOlzSYY';

// Edge Function URL
const ADMIN_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-action`;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin password (user will enter this)
let adminPassword = null;

// ========================================
// Check Auth
// ========================================
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    const storedPassword = sessionStorage.getItem('admin_password');

    if (isLoggedIn === 'true' && storedPassword) {
        adminPassword = storedPassword;
        showAdminContent();
        loadAdminOptions();
    }
}

// ========================================
// Login Handler
// ========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');

    // Simple validation - in production, this would call Edge Function to verify
    if (password.length < 6) {
        errorEl.textContent = '❌ Mật khẩu quá ngắn! MUDA MUDA!';
        errorEl.classList.remove('hidden');
        return;
    }

    // Store password for Edge Function calls
    adminPassword = password;
    sessionStorage.setItem('admin_logged_in', 'true');
    sessionStorage.setItem('admin_password', password);

    showAdminContent();
    loadAdminOptions();
    errorEl.classList.add('hidden');
});

// ========================================
// Show Admin Content
// ========================================
function showAdminContent() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-content').classList.add('active');
}

// ========================================
// Logout
// ========================================
function logout() {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_password');
    adminPassword = null;
    location.reload();
}

// ========================================
// Load Options
// ========================================
async function loadAdminOptions() {
    try {
        const { data, error } = await supabaseClient
            .from('vote_options')
            .select('*')
            .order('vote_count', { ascending: false });

        if (error) throw error;

        displayAdminOptions(data);
        updateStats(data);
    } catch (error) {
        console.error('Error loading options:', error);
        showToast('❌ Lỗi tải dữ liệu: ' + error.message, 'error');
    }
}

// ========================================
// Display Options
// ========================================
function displayAdminOptions(options) {
    const container = document.getElementById('admin-options-container');

    if (!options || options.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Chưa có nội dung nào</p>';
        return;
    }

    container.innerHTML = options.map(option => `
        <div class="admin-option-card ${option.completed ? 'completed' : ''}" data-id="${option.id}">
            <div class="admin-option-info">
                <div class="admin-option-name">
                    ${escapeHtml(option.content)}
                    ${option.completed ? '<span class="completed-badge">✓ Đã làm</span>' : ''}
                </div>
                <div class="admin-option-meta">
                    <span>🗳️ ${option.vote_count || 0} votes</span>
                    ${option.completed_at ? `<span>📅 ${formatDate(option.completed_at)}</span>` : ''}
                </div>
            </div>
            <div class="admin-option-actions">
                ${!option.completed ? `
                    <button class="admin-btn complete" onclick="markAsCompleted(${option.id})">
                        ✓ Hoàn thành
                    </button>
                ` : `
                    <button class="admin-btn uncomplete" onclick="markAsUncompleted(${option.id})">
                        ↩️ Chưa làm
                    </button>
                `}
                <button class="admin-btn delete" onclick="deleteOption(${option.id})">
                    🗑️ Xóa
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// Update Stats
// ========================================
function updateStats(options) {
    const total = options.length;
    const completed = options.filter(o => o.completed).length;
    const pending = total - completed;
    const totalVotes = options.reduce((sum, o) => sum + (o.vote_count || 0), 0);

    document.getElementById('total-options').textContent = total;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('pending-count').textContent = pending;
    document.getElementById('total-votes').textContent = totalVotes;
}

// ========================================
// Admin Actions (Using Edge Functions)
// ========================================
async function callAdminFunction(action, optionId) {
    try {
        const response = await fetch(ADMIN_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                action,
                optionId,
                adminPassword
            })
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                showToast('❌ Sai mật khẩu admin! Đăng xuất...', 'error');
                setTimeout(() => logout(), 2000);
                return false;
            }
            throw new Error(result.message || 'Action failed');
        }

        return true;
    } catch (error) {
        console.error('Admin action error:', error);
        showToast('❌ Lỗi: ' + error.message, 'error');
        return false;
    }
}

async function markAsCompleted(id) {
    if (!confirm('Đánh dấu nội dung này là đã hoàn thành?')) return;

    const success = await callAdminFunction('mark_completed', id);
    if (success) {
        showToast('✅ Đã đánh dấu hoàn thành! ORA ORA!', 'success');
        loadAdminOptions();
    }
}

async function markAsUncompleted(id) {
    if (!confirm('Đánh dấu nội dung này là chưa hoàn thành?')) return;

    const success = await callAdminFunction('mark_uncompleted', id);
    if (success) {
        showToast('✅ Đã đánh dấu chưa hoàn thành!', 'success');
        loadAdminOptions();
    }
}

async function deleteOption(id) {
    if (!confirm('⚠️ XÓA VĨNH VIỄN nội dung này?\n\nHành động này KHÔNG THỂ HOÀN TÁC!')) return;
    if (!confirm('Bạn CHẮC CHẮN muốn xóa?')) return;

    const success = await callAdminFunction('delete_option', id);
    if (success) {
        showToast('🗑️ Đã xóa nội dung! WRYYY!', 'success');
        loadAdminOptions();
    }
}

// ========================================
// Utility Functions
// ========================================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.className = 'toast toast-' + type;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
