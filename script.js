/*
  SMART CAMPUS TRACKER - LOGIC CORE
  ZERO FRAMEWORK. PURE JAVASCRIPT.
*/

// --- INITIAL STATE ---
let state = {
    students: JSON.parse(localStorage.getItem('sct_students')) || [],
    attendance: JSON.parse(localStorage.getItem('sct_attendance')) || [],
    complaints: JSON.parse(localStorage.getItem('sct_complaints')) || [],
    notices: JSON.parse(localStorage.getItem('sct_notices')) || [],
    events: JSON.parse(localStorage.getItem('sct_events')) || [],
    buses: JSON.parse(localStorage.getItem('sct_buses')) || [],
    placements: JSON.parse(localStorage.getItem('sct_placements')) || [],
    themeSettings: JSON.parse(localStorage.getItem('sct_theme')) || { hue: '#00ffff' }
};

// --- SYSTEM INITIALIZATION ---
function startSystem() {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app-container');
    
    splash.style.opacity = '0';
    setTimeout(() => {
        splash.style.display = 'none';
        app.style.display = 'grid';
        initDashboard();
        startClock();
        applyTheme();
    }, 1000);
}

function startClock() {
    const clockEl = document.getElementById('system-clock');
    const dateEl = document.getElementById('system-date');
    
    setInterval(() => {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('en-US', { hour12: false });
        dateEl.innerText = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    }, 1000);
}

// --- NAVIGATION ---
function showPage(pageId) {
    // Update Nav
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${pageId}`).classList.add('active');
    
    // Update Page
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    // Refresh page data
    renderPage(pageId);
}

function renderPage(pageId) {
    switch(pageId) {
        case 'dashboard': initDashboard(); break;
        case 'students': renderStudents(); break;
        case 'attendance': renderAttendance(); break;
        case 'complaints': renderComplaints(); break;
        case 'notices': renderNotices(); break;
        case 'events': renderEvents(); break;
        case 'transport': renderBuses(); break;
        case 'placements': renderPlacements(); break;
    }
}

// --- DASHBOARD ---
function initDashboard() {
    const grid = document.getElementById('stats-grid');
    const stats = [
        { label: 'Total Students', value: state.students.length, icon: '👥' },
        { label: 'Present Today', value: state.attendance.filter(a => a.present).length, icon: '✅' },
        { label: 'Pending Complaints', value: state.complaints.filter(c => c.status === 'Pending').length, icon: '⚠️' },
        { label: 'Upcoming Events', value: state.events.length, icon: '🎉' },
        { label: 'Available Buses', value: state.buses.filter(b => b.status === 'Active').length, icon: '🚌' },
        { label: 'Placement Drives', value: state.placements.length, icon: '💼' }
    ];
    
    grid.innerHTML = stats.map(s => `
        <div class="card">
            <h3>${s.label} <span>${s.icon}</span></h3>
            <div class="value">${s.value}</div>
        </div>
    `).join('');
    
    drawChart();
}

function drawChart() {
    const canvas = document.getElementById('activity-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    
    // Simple glitchy bar chart
    ctx.clearRect(0, 0, width, height);
    const data = [40, 70, 45, 90, 65, 85, 30];
    const barWidth = width / data.length - 10;
    
    data.forEach((val, i) => {
        const h = (val / 100) * (height - 50);
        const x = i * (barWidth + 10) + 5;
        const y = height - h - 10;
        
        ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 255, 0.5)';
        ctx.fillRect(x, y, barWidth, h);
        
        // Glitch effect on top of bar
        if (Math.random() > 0.8) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 2, y + 5, barWidth + 4, 2);
        }
    });
}

// --- DATA PERSISTENCE ---
function saveState() {
    localStorage.setItem('sct_students', JSON.stringify(state.students));
    localStorage.setItem('sct_attendance', JSON.stringify(state.attendance));
    localStorage.setItem('sct_complaints', JSON.stringify(state.complaints));
    localStorage.setItem('sct_notices', JSON.stringify(state.notices));
    localStorage.setItem('sct_events', JSON.stringify(state.events));
    localStorage.setItem('sct_buses', JSON.stringify(state.buses));
    localStorage.setItem('sct_placements', JSON.stringify(state.placements));
    localStorage.setItem('sct_theme', JSON.stringify(state.themeSettings));
    initDashboard();
    showToast('DATABASE_SYNC_SUCCESSFUL');
}

// --- STUDENT MANAGEMENT ---
function renderStudents(filter = '') {
    const list = document.getElementById('student-list');
    const filtered = state.students.filter(s => 
        s.name.toLowerCase().includes(filter.toLowerCase()) || 
        s.rollNo.includes(filter)
    );
    
    list.innerHTML = filtered.map(s => `
        <tr>
            <td><img src="${s.photo || 'https://via.placeholder.com/40'}" style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--cyan);"></td>
            <td>${s.name}</td>
            <td>${s.rollNo}</td>
            <td>${s.branch}</td>
            <td>${s.year}</td>
            <td>
                <button onclick="editStudent('${s.id}')" style="background: none; border: none; color: var(--cyan); margin-right: 10px;">EDIT</button>
                <button onclick="deleteStudent('${s.id}')" style="background: none; border: none; color: var(--magenta);">DELETE</button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('student-search').oninput = (e) => renderStudents(e.target.value);
}

// --- MODAL SYSTEM ---
let currentModalType = '';
let currentEditId = null;

function openModal(type, data = null) {
    currentModalType = type;
    currentEditId = data ? data.id : null;
    const overlay = document.getElementById('modal-overlay');
    const form = document.getElementById('modal-form');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('modal-submit-btn');
    
    overlay.style.display = 'flex';
    form.innerHTML = '';
    
    switch(type) {
        case 'student':
            title.innerText = data ? 'EDIT_STUDENT' : 'ADD_NEW_STUDENT';
            form.innerHTML = `
                <div><label>FULL_NAME</label><input type="text" id="f-name" value="${data?.name || ''}" required></div>
                <div><label>ROLL_NUMBER</label><input type="text" id="f-roll" value="${data?.rollNo || ''}" required></div>
                <div><label>BRANCH</label><input type="text" id="f-branch" value="${data?.branch || ''}" required></div>
                <div><label>YEAR</label><input type="number" id="f-year" value="${data?.year || '1'}" required></div>
                <div><label>PHOTO_URL</label><input type="url" id="f-photo" value="${data?.photo || ''}"></div>
                <div><label>EMAIL</label><input type="email" id="f-email" value="${data?.email || ''}"></div>
            `;
            break;
        case 'complaint':
            title.innerText = 'RAISE_COMPLAINT';
            form.innerHTML = `
                <div><label>CATEGORY</label><select id="f-cat"><option>Cleanliness</option><option>WiFi</option><option>Hostel</option><option>Classroom</option><option>Water</option><option>Bus</option></select></div>
                <div><label>DESCRIPTION</label><textarea id="f-desc" rows="3"></textarea></div>
                <div><label>PRIORITY</label><select id="f-pri"><option>Low</option><option>Medium</option><option>High</option></select></div>
            `;
            break;
        case 'notice':
            title.innerText = 'ADD_NOTICE';
            form.innerHTML = `
                <div><label>TITLE</label><input type="text" id="f-title" required></div>
                <div><label>CONTENT</label><textarea id="f-content" rows="4"></textarea></div>
                <div><label>URGENT</label><select id="f-urgent"><option value="false">No</option><option value="true">Yes</option></select></div>
            `;
            break;
        case 'event':
            title.innerText = 'ADD_EVENT';
            form.innerHTML = `
                <div><label>EVENT_NAME</label><input type="text" id="f-ename" required></div>
                <div><label>DATE</label><input type="date" id="f-edate" required></div>
                <div><label>VENUE</label><input type="text" id="f-evenue"></div>
            `;
            break;
        case 'bus':
            title.innerText = 'ADD_BUS_ROUTE';
            form.innerHTML = `
                <div><label>BUS_NO</label><input type="text" id="f-bno" required></div>
                <div><label>ROUTE</label><input type="text" id="f-broute" required></div>
                <div><label>DRIVER</label><input type="text" id="f-bdriver"></div>
                <div><label>CONTACT</label><input type="text" id="f-bcontact"></div>
            `;
            break;
        case 'placement':
            title.innerText = 'ADD_PLACEMENT_DRIVE';
            form.innerHTML = `
                <div><label>COMPANY</label><input type="text" id="f-pcompany" required></div>
                <div><label>ROLE</label><input type="text" id="f-prole"></div>
                <div><label>PACKAGE (LPA)</label><input type="text" id="f-ppackage"></div>
                <div><label>DATE</label><input type="date" id="f-pdate"></div>
            `;
            break;
    }
    
    submitBtn.onclick = handleFormSubmit;
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function handleFormSubmit(e) {
    e.preventDefault();
    const data = {};
    const inputs = document.getElementById('modal-form').querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const id = input.id.replace('f-', '');
        data[id] = input.value;
    });

    data.id = currentEditId || Date.now().toString();
    data.timestamp = new Date().toISOString();

    processSubmit(currentModalType, data);
    closeModal();
    saveState();
    renderPage(getCurrentPage());
}

function getCurrentPage() {
    const activeBtn = document.querySelector('nav button.active');
    return activeBtn ? activeBtn.id.replace('nav-', '') : 'dashboard';
}

function processSubmit(type, data) {
    switch(type) {
        case 'student':
            if (currentEditId) {
                const idx = state.students.findIndex(s => s.id === currentEditId);
                state.students[idx] = data;
            } else {
                state.students.push(data);
                // Also create an attendance entry placeholder
                state.attendance.push({ id: data.id, rollNo: data.rollNo, name: data.name, present: false });
            }
            break;
        case 'complaint':
            data.status = 'Pending';
            state.complaints.push(data);
            break;
        case 'notice':
            state.notices.push(data);
            break;
        case 'event':
            state.events.push(data);
            break;
        case 'bus':
            data.status = 'Active';
            data.seats = 40;
            state.buses.push(data);
            break;
        case 'placement':
            state.placements.push(data);
            break;
    }
}

// --- ATTENDANCE ---
function renderAttendance() {
    const list = document.getElementById('attendance-list');
    list.innerHTML = state.attendance.map(a => `
        <tr>
            <td>${a.rollNo}</td>
            <td>${a.name}</td>
            <td>
                <span style="color: ${a.present ? 'var(--cyan)' : 'var(--magenta)'}">
                    ${a.present ? 'PRESENT' : 'ABSENT'}
                </span>
            </td>
            <td>
                <button onclick="toggleAttendance('${a.id}')" class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.7rem;">
                    TOGGLE
                </button>
            </td>
        </tr>
    `).join('');
}

function toggleAttendance(id) {
    const item = state.attendance.find(a => a.id === id);
    if (item) item.present = !item.present;
    saveState();
    renderAttendance();
}

function markAllPresent() {
    state.attendance.forEach(a => a.present = true);
    saveState();
    renderAttendance();
}

function exportAttendance() {
    const header = "Roll No,Name,Status\n";
    const body = state.attendance.map(a => `${a.rollNo},${a.name},${a.present ? 'Present' : 'Absent'}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// --- COMPLAINTS, NOTICES, EVENTS, BUSES, PLACEMENTS ---
function renderComplaints() {
    const grid = document.getElementById('complaints-list');
    grid.innerHTML = state.complaints.map(c => `
        <div class="card">
            <h3>${c.cat} <span style="background: ${c.pri === 'High' ? 'var(--magenta)' : 'var(--cyan)'}; padding: 2px 5px; color: #000; font-size: 0.6rem;">${c.pri}</span></h3>
            <p style="margin: 1rem 0; opacity: 0.8;">${c.desc}</p>
            <div style="font-size: 0.8rem; color: var(--cyan);">STATUS: ${c.status}</div>
            <button onclick="resolveComplaint('${c.id}')" style="margin-top: 1rem; border: 1px solid var(--cyan); background: none; color: var(--cyan); padding: 5px; width: 100%;">MARK_RESOLVED</button>
        </div>
    `).join('');
}

function resolveComplaint(id) {
    const item = state.complaints.find(c => c.id === id);
    if (item) item.status = 'Resolved';
    saveState();
    renderComplaints();
}

function renderNotices() {
    const container = document.getElementById('notices-container');
    container.innerHTML = state.notices.map(n => `
        <div class="card" style="border-color: ${n.urgent === 'true' ? 'var(--magenta)' : 'var(--glass-border)'}">
            <h3>${n.title} ${n.urgent === 'true' ? '🚨' : ''}</h3>
            <p style="margin: 1rem 0; opacity: 0.8; font-size: 0.9rem;">${n.content}</p>
            <div style="font-size: 0.7rem; opacity: 0.5;">${new Date(n.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

function renderEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = state.events.map(e => `
        <div class="card">
            <h3>${e.ename}</h3>
            <div style="margin: 1rem 0;">
                <div style="font-family: var(--font-mono); color: var(--cyan);">DATE: ${e.edate}</div>
                <div style="opacity: 0.8;">VENUE: ${e.evenue}</div>
            </div>
            <div class="countdown" data-date="${e.edate}" style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--magenta);">TIME REMAINING...</div>
        </div>
    `).join('');
    updateCountdowns();
}

function updateCountdowns() {
    setInterval(() => {
        document.querySelectorAll('.countdown').forEach(el => {
            const target = new Date(el.dataset.date).getTime();
            const now = new Date().getTime();
            const diff = target - now;
            if (diff < 0) {
                el.innerText = "EVENT_ACTIVE";
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            el.innerText = `${days}D ${hours}H REMAINING`;
        });
    }, 1000);
}

function renderBuses() {
    const list = document.getElementById('bus-list');
    list.innerHTML = state.buses.map(b => `
        <tr>
            <td>${b.bno}</td>
            <td>${b.broute}</td>
            <td>${b.bdriver}</td>
            <td>${b.bcontact}</td>
            <td>${b.seats}</td>
            <td style="color: var(--cyan);">${b.status}</td>
            <td><button onclick="deleteBus('${b.id}')" style="background:none; border:none; color:var(--magenta);">REMOVE</button></td>
        </tr>
    `).join('');
}

function renderPlacements() {
    const grid = document.getElementById('placements-list');
    grid.innerHTML = state.placements.map(p => `
        <div class="card">
            <h3>${p.pcompany}</h3>
            <div style="margin: 1rem 0;">
                <div style="font-size: 1.2rem; font-weight: bold;">${p.prole}</div>
                <div style="color: var(--cyan);">PACKAGE: ${p.ppackage} LPA</div>
                <div style="opacity: 0.7;">DRIVE_DATE: ${p.pdate}</div>
            </div>
            <button class="btn-primary" style="width:100%;">APPLY_NOW</button>
        </div>
    `).join('');
}

// --- SETTINGS & HELPERS ---
function changeThemeHue(hue) {
    state.themeSettings.hue = hue;
    saveState();
    applyTheme();
}

function applyTheme() {
    const hue = state.themeSettings.hue;
    document.documentElement.style.setProperty('--cyan', hue);
    document.documentElement.style.setProperty('--glass-border', `rgba(${hexToRgb(hue)}, 0.3)`);
    document.documentElement.style.setProperty('--neon-shadow', `0 0 10px rgba(${hexToRgb(hue)}, 0.5), 0 0 20px rgba(${hexToRgb(hue)}, 0.2)`);
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

function downloadBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sct_system_backup_${Date.now()}.json`;
    a.click();
}

// --- DELETE WRAPPERS ---
function deleteStudent(id) {
    if (confirm('TERMINATE_STUDENT_RECORD?')) {
        state.students = state.students.filter(s => s.id !== id);
        state.attendance = state.attendance.filter(a => a.id !== id);
        saveState();
        renderStudents();
    }
}
function deleteBus(id) {
    state.buses = state.buses.filter(b => b.id !== id);
    saveState();
    renderBuses();
}

// --- TOAST SYSTEM ---
function showToast(msg) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = `> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- KEYBOARD SHORTCUTS ---
window.addEventListener('keydown', (e) => {
    // Ctrl + S -> Search Students
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showPage('students');
        document.getElementById('student-search')?.focus();
        showToast('SEARCH_INTERFACE_ACTIVE');
    }
    // Ctrl + D -> Dashboard
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        showPage('dashboard');
        showToast('REDIRECTING_TO_MAINFRAME');
    }
});

// Global scope expose for buttons
window.startSystem = startSystem;
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.markAllPresent = markAllPresent;
window.exportAttendance = exportAttendance;
window.toggleAttendance = toggleAttendance;
window.resolveComplaint = resolveComplaint;
window.changeThemeHue = changeThemeHue;
window.downloadBackup = downloadBackup;
window.deleteStudent = deleteStudent;
window.deleteBus = deleteBus;
window.handleFormSubmit = handleFormSubmit;
