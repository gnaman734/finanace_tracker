const healthEl = document.getElementById('health');
const refreshBtn = document.getElementById('refresh');

async function loadHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    healthEl.textContent = `status=${data.status}, db=${data.db}, at=${data.timestamp}`;
  } catch (err) {
    healthEl.textContent = `Health check failed: ${err.message}`;
  }
}

refreshBtn.addEventListener('click', loadHealth);
loadHealth();
