// ========================================
// Production Script with Edge Functions
// ========================================
const SUPABASE_URL = 'https://bgjjpiihsegzjcjrrqyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnampwaWloc2VnempjanJycXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzMzOTgsImV4cCI6MjA4MjI0OTM5OH0.GPMTTsRferWTV_JRJOxZkALbeCttsvXK-VLdDOlzSYY';

// Edge Function URLs (replace with your deployed function URLs)
const VOTE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/vote-action`;
const ADD_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/add-option`;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// DOM Elements
// ========================================
const optionsContainer = document.getElementById('options-container');
const voteStatus = document.getElementById('vote-status');
const addOptionForm = document.getElementById('add-option-form');
const newOptionInput = document.getElementById('new-option-input');
const addBtn = document.getElementById('add-btn');
const charCount = document.getElementById('char-count');
const formError = document.getElementById('form-error');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// ========================================
// Browser Fingerprint
// ========================================
let browserFingerprint = null;

async function initFingerprint() {
    if (!browserFingerprint) {
        browserFingerprint = await BrowserFingerprint.generate();
    }
    return browserFingerprint;
}

// ========================================
// State
// ========================================
// ========================================
// State
// ========================================
const VOTE_HISTORY_KEY = 'vote_history';
let voteHistory = JSON.parse(localStorage.getItem(VOTE_HISTORY_KEY) || '{}');

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    await initFingerprint();
    await init();
});

async function init() {
    await loadOptions();
    setupEventListeners();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    newOptionInput.addEventListener('input', (e) => {
        const length = e.target.value.length;
        charCount.textContent = length;

        const charCounter = document.querySelector('.char-counter');
        charCounter.classList.remove('warning', 'max');

        if (length >= 20) {
            charCounter.classList.add('max');
        } else if (length >= 15) {
            charCounter.classList.add('warning');
        }
    });

    addOptionForm.addEventListener('submit', handleAddOption);

    // Toggle Completed Options
    const toggleBtn = document.getElementById('toggle-completed-btn');
    const completedContainer = document.getElementById('completed-options-container');

    if (toggleBtn && completedContainer) {
        toggleBtn.addEventListener('click', () => {
            completedContainer.classList.toggle('hidden');
            if (completedContainer.classList.contains('hidden')) {
                toggleBtn.textContent = 'Hiện nội dung';
            } else {
                toggleBtn.textContent = 'Ẩn nội dung';
            }
        });
    }
}

// ========================================
// Load Options from Supabase
// ========================================
async function loadOptions() {
    try {
        showLoading();

        const { data, error } = await supabaseClient
            .from('vote_options')
            .select('*')
            .order('vote_count', { ascending: false });

        if (error) throw error;

        const completedOptions = data.filter(opt => opt.completed);
        const activeOptions = data.filter(opt => !opt.completed);

        renderCompletedOptions(completedOptions);
        renderOptions(activeOptions);

    } catch (error) {
        console.error('Error loading options:', error);
        showError('Không thể tải danh sách! MUDA MUDA! Thử lại!');
    }
}

// ========================================
// Render Completed Options
// ========================================
function renderCompletedOptions(options) {
    const completedContainer = document.getElementById('completed-options-container');

    if (!options || options.length === 0) {
        completedContainer.innerHTML = '<p class="empty-message">Chưa có nội dung nào hoàn thành</p>';
        return;
    }

    completedContainer.innerHTML = options.map(option => {
        const completedDate = option.completed_at
            ? new Date(option.completed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '';

        return `
            <div class="completed-option-item">
                <span class="check-icon">✓</span>
                <span class="completed-option-text">${escapeHtml(option.content)}</span>
                <span class="completed-option-date">${completedDate}</span>
            </div>
        `;
    }).join('');
}

// ========================================
// Render Options
// ========================================
function renderOptions(options) {
    if (!options || options.length === 0) {
        optionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">⭐</div>
                <p>Chưa có nội dung nào! Hãy đề xuất nội dung đầu tiên! ゴゴゴ</p>
            </div>
        `;
        return;
    }

    optionsContainer.innerHTML = options.map((option, index) => {
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'top-1';
        else if (rank === 2) rankClass = 'top-2';
        else if (rank === 3) rankClass = 'top-3';

        // Check if voted within last 1 hour
        const lastVoted = voteHistory[option.id];
        const now = Date.now();
        const isVoted = lastVoted && (now - lastVoted < 3600000); // 1 hour in ms

        const buttonText = isVoted ? 'ĐÃ VOTE' : 'VOTE';
        const buttonClass = isVoted ? 'vote-btn voted' : 'vote-btn';
        const buttonDisabled = isVoted ? 'disabled' : '';

        return `
            <div class="option-card" data-id="${option.id}">
                <span class="option-rank ${rankClass}">#${rank}</span>
                <div class="option-info">
                    <div class="option-name">${escapeHtml(option.content)}</div>
                    <div class="option-votes">
                        <span class="vote-icon">♥</span>
                        <span class="vote-count">${option.vote_count} lượt</span>
                    </div>
                </div>
                <button
                    class="${buttonClass}"
                    onclick="handleVote(${option.id}, this)"
                    ${buttonDisabled}
                >
                    <span class="btn-text">${buttonText}</span>
                    <div class="spinner-small hidden"></div>
                </button>
            </div>
        `;
    }).join('');
}

// ========================================
// Handle Vote (Using Edge Function)
// ========================================
async function handleVote(optionId, button) {
    const lastVoted = voteHistory[optionId];
    const now = Date.now();

    if (lastVoted && (now - lastVoted < 3600000)) {
        showToast('⚠️ Bạn đã vote cho nội dung này rồi! Đợi 1 tiếng nhé! WRYYY!', 'warning');
        return;
    }

    try {
        // Disable button and show loading
        button.disabled = true;
        button.querySelector('.btn-text').style.display = 'none';
        button.querySelector('.spinner-small').classList.remove('hidden');

        const fingerprint = await initFingerprint();

        // Call Edge Function
        const response = await fetch(VOTE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                optionId,
                clientFingerprint: fingerprint
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Vote failed');
        }

        // Mark as voted for this option
        voteHistory[optionId] = Date.now();
        localStorage.setItem(VOTE_HISTORY_KEY, JSON.stringify(voteHistory));

        showToast('✅ Vote thành công! ORA ORA ORA!', 'success');

        // Reload options
        setTimeout(() => loadOptions(), 1000);

    } catch (error) {
        console.error('Error voting:', error);
        showToast('❌ ' + error.message, 'error');

        // Re-enable button
        button.disabled = false;
        button.querySelector('.btn-text').style.display = 'inline';
        button.querySelector('.spinner-small').classList.add('hidden');
    }
}

// ========================================
// Handle Add Option (Using Edge Function)
// ========================================
async function handleAddOption(e) {
    e.preventDefault();

    const content = newOptionInput.value.trim();

    if (!content) {
        showFormError('⚠️ Vui lòng nhập nội dung! MUDA!');
        return;
    }

    if (content.length > 100) {
        showFormError('⚠️ Nội dung quá dài! Tối đa 100 ký tự!');
        return;
    }

    try {
        // Show loading
        addBtn.disabled = true;
        addBtn.querySelector('.btn-text').textContent = 'ĐANG GỬI...';
        addBtn.querySelector('.btn-loading').classList.remove('hidden');

        const fingerprint = await initFingerprint();

        // Call Edge Function
        const response = await fetch(ADD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                content,
                clientFingerprint: fingerprint
            })
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 429 && result.timeLeft) {
                showFormError(`⏱️ ${result.message}`);
                startCooldownTimer(result.timeLeft, addBtn);
                return;
            }
            throw new Error(result.message || 'Add failed');
        }

        // Success
        showToast('✅ ' + result.message, 'success');
        newOptionInput.value = '';
        charCount.textContent = '0';
        formError.classList.add('hidden');

        // Start cooldown
        startCooldownTimer(10, addBtn);

        // Reload options
        setTimeout(() => loadOptions(), 1000);

    } catch (error) {
        console.error('Error adding option:', error);
        showFormError('❌ ' + error.message);

        // Reset button
        addBtn.disabled = false;
        addBtn.querySelector('.btn-text').textContent = 'ĐỀ XUẤT';
        addBtn.querySelector('.btn-loading').classList.add('hidden');
    }
}

// ========================================
// Cooldown Timer
// ========================================
function startCooldownTimer(seconds, button) {
    let timeLeft = seconds;
    button.disabled = true;

    const btnText = button.querySelector('.btn-text');
    const originalText = 'ĐỀ XUẤT';

    const interval = setInterval(() => {
        btnText.textContent = `ĐỢI ${timeLeft}S`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            button.disabled = false;
            btnText.textContent = originalText;
            button.querySelector('.btn-loading').classList.add('hidden');
        }
    }, 1000);
}

// ========================================
// UI Helper Functions
// ========================================
function showLoading() {
    optionsContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <span>Đang tải danh sách...</span>
        </div>
    `;
}

function showError(message) {
    optionsContainer.innerHTML = `
        <div class="error-state">
            <div class="icon">⚠️</div>
            <p>${message}</p>
            <button onclick="loadOptions()" class="retry-btn">Thử lại</button>
        </div>
    `;
}

function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove('hidden');

    setTimeout(() => {
        formError.classList.add('hidden');
    }, 5000);
}

function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast toast-' + type;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

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
