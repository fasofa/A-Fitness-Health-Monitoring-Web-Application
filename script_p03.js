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

function setUsernameDisplay() {
    const usernameDisplay = document.getElementById('username-display');
    if (!usernameDisplay) return;
    const username = localStorage.getItem('loggedInUser') || 'Guest';
    usernameDisplay.textContent = username;
}

setInterval(updateDateTime, 1000);
updateDateTime();
setUsernameDisplay();

// โหลดข้อมูล weightData จาก localStorage ถ้ายังไม่มี ให้เป็นอาร์เรย์เปล่า
let weightData = JSON.parse(localStorage.getItem('weightData')) || [];

const weightForm = document.getElementById('weight-form');
const weightHistory = document.getElementById('weight-history');
const chartCanvas = document.getElementById('weight-chart');

weightForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const date = document.getElementById('weight-date').value;
    const weight = parseFloat(document.getElementById('weight-value').value);
    
    if (date && weight) {
        weightData.push({ date, weight });
        localStorage.setItem('weightData', JSON.stringify(weightData));
        updateChart();
        updateHistory();
        weightForm.reset();
    }
    // หากกรอกข้อมูลครบ จะเพิ่มข้อมูลน้ำหนักและรีเซ็ตฟอร์ม
});

function updateChart() {
    const sortedData = weightData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => item.date);
    const data = sortedData.map(item => item.weight);
    
    if (window.weightChart) {
        window.weightChart.destroy();
    }
    
    window.weightChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (kg)',
                data: data,
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function updateHistory() {
    weightHistory.innerHTML = '';
    if (weightData.length === 0) {
        weightHistory.style.display = 'none';
        return;
    }
    const sortedData = weightData.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sortedData[0];
    let diffText = '';
    if (sortedData.length > 1) {
        const prev = sortedData[1];
        const diff = latest.weight - prev.weight;
        diffText = ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)}kg from previous)`;
    }
    const latestDiv = document.createElement('div');
    latestDiv.textContent = `Latest: ${latest.date} - ${latest.weight}kg${diffText}`;
    latestDiv.style.fontWeight = 'bold';
    latestDiv.style.color = '#e67e22';
    latestDiv.style.marginBottom = '12px';
    weightHistory.appendChild(latestDiv);

    const list = document.createElement('ul');
    list.className = 'history-list';
    sortedData.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.date}: ${item.weight}kg`;
        list.appendChild(li);
    });
    weightHistory.appendChild(list);
    weightHistory.style.display = 'flex';
}

// ทำงานเมื่อกดปุ่มล้างข้อมูล
const clearWeightStatsBtn = document.getElementById('clear-weight-stats');
if (clearWeightStatsBtn) {
    clearWeightStatsBtn.addEventListener('click', function () {
        if (!confirm('ลบข้อมูลน้ำหนักทั้งหมดและรีเซ็ตกราฟ/ประวัติ?')) return;
        weightData = [];
        localStorage.removeItem('weightData');
        updateChart();
        updateHistory();
    });
}

updateChart();
updateHistory();