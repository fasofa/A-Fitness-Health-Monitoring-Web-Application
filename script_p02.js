// ฟังก์ชันโหลด Chart.js แบบ dynamical หากยังไม่ได้โหลด
function loadChartJs(callback) {
    if (window.Chart) { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = callback;
    document.head.appendChild(script);
}

// ฟังก์ชันสร้าง key วันที่ในรูปแบบ YYYY-MM-DD
function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
}

// บันทึกเปอร์เซ็นต์ความคืบหน้า todo ใน localStorage
function saveProgressForDate(dateString, percent) {
    const key = 'todo-stats';
    let stats = JSON.parse(localStorage.getItem(key) || '{}');
    stats[dateString] = percent;
    localStorage.setItem(key, JSON.stringify(stats));
}

function saveTodayProgress(percent) {
    saveProgressForDate(getTodayKey(), percent);
}

// แสดงชื่อผู้ใช้ใน nav-panel จาก localStorage
function setUsernameDisplay() {
    const usernameDisplay = document.getElementById('username-display');
    if (!usernameDisplay) return;
    const username = localStorage.getItem('loggedInUser') || 'Guest';
    usernameDisplay.textContent = username;
}

// ดึงสถิติ 7 วันที่ผ่านมา จาก localStorage
function getLast7DaysStats() {
    const key = 'todo-stats';
    let stats = JSON.parse(localStorage.getItem(key) || '{}');
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const k = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
        days.push(k);
    }
    return days.map(day => ({
        day: day,
        percent: stats[day] !== undefined ? stats[day] : 0
    }));
}

// วาดกราฟ Todo Progress ด้วย Chart.js
function renderTodoStatsChart() {
    loadChartJs(() => {
        const ctx = document.getElementById('todo-stats-chart').getContext('2d');
        const stats = getLast7DaysStats();
        const labels = stats.map(s => s.day.slice(5));
        const data = stats.map(s => s.percent);
        if (window.todoStatsChart) window.todoStatsChart.destroy();
        window.todoStatsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '% Complete',
                    data: data,
                    backgroundColor: '#4caf50',
                    borderRadius: 6,
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const todoList = document.getElementById('todo-list');
    const checkboxes = todoList.querySelectorAll('.todo-checkbox');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const todoTexts = todoList.querySelectorAll('.todo-text');
    const todoDateInput = document.getElementById('todo-date');
    const todoSaveBtn = document.getElementById('todo-save-btn');

    // กำหนดวันที่ใน input เป็นวันนี้
    const todayKey = getTodayKey();
    if (todoDateInput) {
        todoDateInput.value = todayKey;
        todoDateInput.max = todayKey;
    }

    function renderTodoSummaryList() {
        const stats = getLast7DaysStats();
        const summaryList = document.getElementById('todo-summary-list');
        if (!summaryList) return;
        summaryList.innerHTML = '';
        stats.forEach(s => {
            const missedKey = 'todo-missed-' + s.day;
            const missed = JSON.parse(localStorage.getItem(missedKey) || '[]');
            const missedText = missed.length > 0 ? ' | ' + missed.join(', ') : '';
            const li = document.createElement('li');
            li.textContent = `${s.day} : | Completed ${s.percent}% | Missing ${100-s.percent}%${missedText}`;
            summaryList.appendChild(li);
        });
    }

    function updateProgress(dateKey = getTodayKey()) {
        const total = checkboxes.length;
        let completed = 0;
        checkboxes.forEach(cb => { if (cb.checked) completed++; });
        const percent = Math.round((completed / total) * 100);
        progressBar.style.width = percent + '%';
        progressPercent.textContent = 'Progress: ' + percent + '%';
        if (dateKey) {
            saveProgressForDate(dateKey, percent);
            const missed = [];
            checkboxes.forEach((cb, index) => {
                if (!cb.checked) {
                    const text = todoTexts[index].value;
                    missed.push(text);
                }
            });
            localStorage.setItem('todo-missed-' + dateKey, JSON.stringify(missed));
        }
        renderTodoStatsChart();
        renderTodoSummaryList();
    }

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => updateProgress(false));
        // เปลี่ยนสถานะ checkbox จะอัพเดตแถบ progress แต่ยังไม่เซฟ
    });

    if (todoSaveBtn) {
        todoSaveBtn.addEventListener('click', function () {
            const selectedDate = todoDateInput && todoDateInput.value ? todoDateInput.value : getTodayKey();
            updateProgress(selectedDate);
            alert('บันทึกความคืบหน้าแล้ว: ' + selectedDate);
        });
    }

    const clearStatsBtn = document.getElementById('clear-stats-btn');
    if (clearStatsBtn) {
        clearStatsBtn.addEventListener('click', function () {
            if (!confirm('ล้างสถิติทั้งหมด จะไม่สามารถกู้คืนได้ ยืนยัน?')) return;
            localStorage.removeItem('todo-stats');
            // ล้าง missed
            const keys = Object.keys(localStorage).filter(k => k.startsWith('todo-missed-'));
            keys.forEach(k => localStorage.removeItem(k));
            progressBar.style.width = '0%';
            progressPercent.textContent = 'Progress: 0%';
            renderTodoStatsChart();
            renderTodoSummaryList();
            alert('ล้างสถิติเรียบร้อยแล้ว');
        });
    }

    todoTexts.forEach(input => {
        input.addEventListener('input', function () {
            // ช่องข้อความ Todo สามารถแก้ไขได้ แต่ยังไม่ได้บันทึกลง storage อัตโนมัติ
        });
    });

    setUsernameDisplay();
    updateProgress();
    renderTodoStatsChart();
    renderTodoSummaryList();
});

function updateDateTime() {
    const dateElem = document.getElementById('date');
    const timeElem = document.getElementById('time');
    if (dateElem && timeElem) {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        dateElem.textContent = dateStr;
        timeElem.textContent = timeStr;
    }
}

setInterval(updateDateTime, 1000);
updateDateTime();