// เลือกทุก element ที่มี class panel
const panels = document.querySelectorAll('.panel');

// วนลูปผ่านแต่ละ panel
panels.forEach((panel) => {
  panel.addEventListener('click', () => {
    // เมื่อคลิก panel จะลบ class active จากทุก panel
    removeActiveClasses();
    // และเพิ่ม class active ให้ panel ที่ถูกคลิก
    panel.classList.add('active');
  })
}); 

// ฟังก์ชันลบ class active จาก panel ทั้งหมด
function removeActiveClasses() {
    panels.forEach(panel  => {
      panel.classList.remove('active');
    })
}

// ฟังก์ชันอัพเดตวันที่และเวลาแบบ realtime ในส่วน Item 5
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

// ฟังก์ชันแปลงวันที่ให้เป็น key string แบบ YYYY-MM-DD
function formatDateKey(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// สร้างเนื้อหาสรุปสถิติ Todo
function buildTodoSummary() {
  const summaryElem = document.getElementById('todo-stats-summary');
  if (!summaryElem) return;
  const rawStats = JSON.parse(localStorage.getItem('todo-stats') || '{}');
  const keys = Object.keys(rawStats).sort();
  if (keys.length === 0) {
    summaryElem.innerHTML = '<strong>Todo stats:</strong> No data';
    return;
  }
  const latestDate = keys[keys.length - 1];
  const latestPercent = rawStats[latestDate];
  const averages = keys.reduce((acc, cur) => acc + Number(rawStats[cur] || 0), 0) / keys.length;
  summaryElem.innerHTML = `
    <strong>Todo stats:</strong><br>
    Latest (${latestDate})  ${latestPercent}%<br>
    Average ${averages.toFixed(1)}% from  <br>
    ${keys.length} days
  `;
}

// สร้างเนื้อหาสรุปสถิติ Weight
function buildWeightSummary() {
  const summaryElem = document.getElementById('weight-stats-summary');
  if (!summaryElem) return;
  const weightData = JSON.parse(localStorage.getItem('weightData') || '[]');
  if (!Array.isArray(weightData) || weightData.length === 0) {
    summaryElem.innerHTML = '<strong>Weight stats:</strong> No data';
    return;
  }
  const sorted = weightData.slice().sort((a,b)=> new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const latest = sorted[sorted.length-1];
  let diffLabel = '';
  if (sorted.length > 1) {
    const delta = Number(latest.weight) - Number(first.weight);
    const sign = delta > 0 ? '+' : '';
    diffLabel = ` (${sign}${delta.toFixed(1)}kg change)`;
  }
  summaryElem.innerHTML = `
    <strong>Weight stats:</strong><br>
    Start (${first.date})  ${Number(first.weight).toFixed(1)} kg<br>
    Latest (${latest.date})  ${Number(latest.weight).toFixed(1)} kg${diffLabel}
  `;
}

// เรียกสร้างสถิติทั้ง Todo และ Weight
function renderCombinedStats() {
  buildTodoSummary();
  buildWeightSummary();
}

// แสดงชื่อผู้ใช้ที่ล็อกอินจาก localStorage
function setUsernameDisplay() {
  const usernameDisplay = document.getElementById('username-display');
  if (!usernameDisplay) return;
  const username = localStorage.getItem('loggedInUser');
  usernameDisplay.textContent = username ? username : 'Guest';
}

// โหลดข้อมูลเมื่อเปิดหน้า
setUsernameDisplay();
renderCombinedStats();

// อัพเดตเวลาแบบนาทีต่อวินาที
setInterval(updateDateTime, 1000);
updateDateTime();