// Import the functions you need from the SDKs you need
// นำเข้าโมดูล Firebase ที่จำเป็นสำหรับแอปนี้
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore-lite.js";

// เลือกป้าย label ทั้งหมดภายใน .form-control
const labels = document.querySelectorAll(".form-control label");

labels.forEach(label => {
    // เปลี่ยนข้อความใน label ให้แต่ละตัวอักษรถูกห่อด้วย <span>
    // เพื่อให้สามารถใส่ transition-delay ทีละตัวอักษรได้
    label.innerHTML = label.innerText
        .split('')
        // แยกข้อความออกเป็นอาร์เรย์ของตัวอักษร
        .map((letter, idx) => `<span style="transition-delay:${idx * 50}ms">${letter}</span>`)
        // สร้าง <span> สำหรับตัวอักษรแต่ละตัว พร้อมตั้ง delay เพิ่มทีละ 50ms
        .join('');
        // รวมกลับเป็นสตริง HTML ใหม่
});

// Your app's Firebase project configuration
// ค่าคอนฟิก Firebase ของโปรเจกต์
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase App
// เริ่มต้น Firebase App ด้วยคอนฟิกด้านบน
const app = initializeApp(firebaseConfig);

// สร้างอินสแตนซ์ Firestore
const db = getFirestore(app);

// Function to get customer data from Firestore
// ฟังก์ชันสำหรับดึงข้อมูลลูกค้าทั้งหมดจากคอลเลกชัน customer
async function getcustomerData(dbInstance) {
  const customersCol = collection(dbInstance, 'customer');
  // เลือกคอลเลกชัน customer
  const customerSnapshot = await getDocs(customersCol);
  // ขอเอกสารทั้งหมดในคอลเลกชัน
  const customerList = customerSnapshot.docs.map(doc => doc.data());
  // แปลงเอกสารเป็นข้อมูล JSON
  return customerList;
}

async function findCustomerByCredentials(username, password) {
  const customersCol = collection(db, 'customer');
  // สร้าง query เพื่อค้นหาผู้ใช้ตามชื่อและรหัสผ่าน
  const customersQuery = query(
    customersCol,
    where('user', '==', username),
    where('pass', '==', password)
  );
  const customerSnapshot = await getDocs(customersQuery);
  // ดึงเอกสารที่ตรงกับเงื่อนไข

  return customerSnapshot.docs.length > 0 ? customerSnapshot.docs[0].data() : null;
  // ถ้ามีข้อมูลผู้ใช้ให้คืนข้อมูลแรก ถ้าไม่มีให้คืน null
}

function showLoginMessage(message, isError = true) {
  const messageElement = document.getElementById('login-message');
  // หาองค์ประกอบที่จะแสดงข้อความ
  if (!messageElement) return;
  // หากไม่พบองค์ประกอบ ให้หยุดทำงาน
  messageElement.textContent = message;
  // ตั้งข้อความใหม่
  messageElement.style.color = isError ? '#ff5252' : '#00b894';
  // สีข้อความจะเป็นแดงเมื่อเป็นข้อผิดพลาด หรือเขียวเมื่อสำเร็จ
}

async function handleLogin(event) {
  event.preventDefault();
  // ป้องกันการส่งฟอร์มแบบปกติ เพื่อจัดการด้วย JavaScript

  const usernameInput = document.querySelector('input[name="username"]');
  const passwordInput = document.querySelector('input[name="password"]');
  // เลือกช่องกรอกชื่อผู้ใช้และรหัสผ่าน

  const username = usernameInput?.value.trim();
  const password = passwordInput?.value;
  // อ่านค่าจากอินพุต ถ้าไม่มีช่องให้เป็น undefined

  if (!username || !password) {
    showLoginMessage('กรุณากรอกชื่อและรหัสผ่านให้ครบถ้วน');
    return;
  }
  // ถ้าช่องว่าง ให้แสดงข้อความเตือนและไม่ทำการ login

  try {
    const matchedUser = await findCustomerByCredentials(username, password);
    // ค้นหาผู้ใช้ที่ตรงกับชื่อและรหัสผ่าน

    if (matchedUser) {
      localStorage.setItem('loggedInUser', username);
      // บันทึกชื่อผู้ใช้ที่ล็อกอินสำเร็จลง localStorage
      showLoginMessage('ล็อกอินสำเร็จ กำลังไปยังหน้าแรก...', false);
      window.location.href = 'index_p01.html';
      // เปลี่ยนหน้าไปยังหน้า index_p01.html
      return;
    }

    showLoginMessage('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    // ถ้าไม่พบข้อมูล ให้แสดงข้อความข้อผิดพลาด
  } catch (error) {
    console.error('Login error:', error);
    showLoginMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ กรุณาลองใหม่อีกครั้ง');
    // ถ้าการเชื่อมต่อหรืออ่านข้อมูล Firestore ล้มเหลว ให้แจ้งผู้ใช้
  }
}

// Attach login handler after DOM is ready
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
  // ผูก event submit ของฟอร์มกับฟังก์ชัน handleLogin
}

// Main asynchronous function to initialize all Firebase services and run app logic
async function initializeAndRunApp() {
  let analytics;
  // ประกาศตัวแปร analytics เพื่อใช้งานภายหลัง

  // Conditionally initialize Analytics if supported (for browser environments)
  if (await isSupported()) {
    console.log("Firebase Analytics is supported. Initializing...");
    analytics = getAnalytics(app);
    // หากเบราว์เซอร์รองรับ Analytics ให้เริ่มใช้งาน
  } else {
    console.log("Firebase Analytics is NOT supported in this environment (likely Node.js). Skipping initialization.");
    // ถ้าไม่รองรับ ให้ข้ามการเริ่ม Analytics
  }

  try {
    const customer = await getcustomerData(db);
    console.log("Customer Data:", customer);
    // ดึงข้อมูลลูกค้าจาก Firestore มาแสดงในคอนโซล
  } catch (error) {
    console.error("Error fetching customer data:", error);
    // ถ้าดึงข้อมูลล้มเหลว ให้แสดงข้อผิดพลาด
  }

  // TODO: Add other application logic here
  // For example, if you need to use 'analytics', you can use it here
  // if (analytics) {
  //   logEvent(analytics, 'data_fetched');
  // }
  // หมายเหตุ: หากต้องการใช้งาน analytics ให้ใส่โค้ดในส่วนนี้
}

// Call the main function to start the application
initializeAndRunApp();
// เรียกใช้งาน main function เพื่อเริ่มการทำงานของแอป

// **สำคัญ:** ส่วนของ Firebase Admin SDK (admin.initializeApp) ถูกลบออก
// เพราะ Firebase Admin SDK ใช้สำหรับสภาพแวดล้อมฝั่งเซิร์ฟเวอร์ (Node.js backend, Cloud Functions)
// ไม่ได้ใช้ในฝั่งไคลเอนต์ (Web browser) โดยตรง เนื่องจากจะมีความเสี่ยงด้านความปลอดภัย
/*
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://YOUR_PROJECT.firebaseio.com"
});
*/