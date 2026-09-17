// ==========================================
// CONFIGURATION: ลิงก์เชื่อมต่อ Google Services
// ==========================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxzT410c5UV0QPNwMA3-elaISgyOm4IBr1IBf3ht4wwW7ys1jdRcPUEw7zHde6C_7R9/exec";
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVX1ZbDi1j3LMCGVPGhNWbf_TXyO0tOHsy56RZJe07-rMc0vXgfzdQANELMwxyW1ygAKSFxCm80wtV/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
  // 1. ตรวจสอบการรันในหน้า product.html
  if (document.getElementById("product-list")) {
    initProductPage();
  }

  // 2. ตรวจสอบการรันในหน้า order.html
  if (document.getElementById("orderForm")) {
    initOrderPage();
  }

  // 3. ตรวจสอบการรันในหน้า admin.html
  if (document.getElementById("ordersTable")) {
    initAdminPage();
  }
});

// ==========================================
// 1. ฟังก์ชันสำหรับหน้า PRODUCT (product.html)
// ==========================================
function initProductPage() {
  fetch("products.json")
    .then((response) => response.json())
    .then((products) => {
      const urlParams = new URLSearchParams(window.location.search);
      const moodFilter = urlParams.get("mood");

      renderProducts(products, moodFilter);
      setupFilterButtons(products);
    })
    .catch((error) => console.error("Error loading products:", error));
}

function renderProducts(products, filter = null) {
  const container = document.getElementById("product-list");
  if (!container) return;

  container.innerHTML = "";

  const filtered = filter && filter !== "all" 
    ? products.filter((p) => p.mood.toLowerCase() === filter.toLowerCase())
    : products;

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="description">${product.description || ''}</p>
      <p class="price">${product.price} บาท</p>
      <a href="order.html?item=${encodeURIComponent(product.name)}&price=${product.price}" class="btn-buy">สั่งซื้อ</a>
    `;
    container.appendChild(card);
  });
}

function setupFilterButtons(products) {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;

  filterBar.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const mood = e.target.getAttribute("data-mood");
      renderProducts(products, mood);
    }
  });
}

// ==========================================
// 2. ฟังก์ชันสำหรับหน้า ORDER (order.html)
// ==========================================
function initOrderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get("item");
  const priceParam = urlParams.get("price");

  const itemsInput = document.getElementById("items");
  const totalInput = document.getElementById("total");

  if (itemParam && itemsInput) {
    itemsInput.value = itemParam;
  }
  if (priceParam && totalInput) {
    totalInput.value = priceParam;
  }

  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", handleOrderSubmit);
  }
}

function handleOrderSubmit(e) {
  e.preventDefault();

  const submitButton = e.target.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  const payload = {
    customerName: document.getElementById("customerName") ? document.getElementById("customerName").value : "",
    contact: document.getElementById("contact") ? document.getElementById("contact").value : "",
    items: document.getElementById("items") ? document.getElementById("items").value : "",
    total: document.getElementById("total") ? document.getElementById("total").value : "",
    note: document.getElementById("note") ? document.getElementById("note").value : ""
  };

  // ส่งข้อมูลเข้า Apps Script โดยไม่ใช้ Headers เพื่อป้องกันปัญหา CORS
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(() => {
      window.location.href = "thankyou.html";
    })
    .catch((error) => {
      console.error("Submission error:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
      if (submitButton) submitButton.disabled = false;
    });
}

// ==========================================
// 3. ฟังก์ชันสำหรับหน้า ADMIN (admin.html)
// ==========================================
function initAdminPage() {
  fetch(CSV_URL)
    .then((response) => response.text())
    .then((csvText) => {
      const rows = parseCSV(csvText);
      renderAdminTable(rows);
    })
    .catch((error) => console.error("Error loading CSV:", error));
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  return lines.map((line) => {
    // แยกคอลัมน์จาก CSV รองรับข้อความที่มีเครื่องหมายคำพูด (Quotes)
    const regex = /(?:\"([^\"]*)\"|([^,]+))/g;
    const row = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      row.push(match[1] || match[2] || "");
    }
    return row;
  });
}

function renderAdminTable(rows) {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // ข้ามข้อมูลแถวแรก (Header) แล้วแสดงรายการล่าสุดขึ้นก่อน
  const dataRows = rows.slice(1).reverse();

  dataRows.forEach((row) => {
    if (row.length < 2) return; // ข้ามแถวที่ไม่มีข้อมูล
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row[0] || ""}</td>
      <td>${row[1] || ""}</td>
      <td>${row[2] || ""}</td>
      <td>${row[3] || ""}</td>
      <td>${row[4] || ""}</td>
      <td>${row[5] || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}
