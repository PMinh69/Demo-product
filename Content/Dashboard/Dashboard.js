const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

async function count() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const [
    { data: products, error: productError },
    { data: sites, error: siteError },
  ] = await Promise.all([
    supabase.from("product").select("is_live, team_code"),
    supabase.from("site").select("status"),
  ]);

  if (productError || siteError) {
    console.error("Lỗi khi tải thống kê dashboard:", {
      productError,
      siteError,
    });
    return;
  }

  const productData = products || [];
  const siteData = sites || [];
  const total = productData.length;
  const active = productData.filter((product) => product.is_live === true).length;
  const inactive = total - active;
  const activePercent = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

  const running = siteData.filter((site) => Number(site.status) === 1).length;
  const paused = siteData.filter((site) => Number(site.status) === 0).length;
  const stopped = siteData.filter((site) => Number(site.status) === -1).length;
  const runningPercent =((running / siteData.length) * 100).toFixed(2);
  const pausedPercent =((paused / siteData.length) * 100).toFixed(2);
  const stoppedPercent =((stopped / siteData.length) * 100).toFixed(2);

  document.getElementById("total-products").textContent = total;
  document.getElementById("total-active-products").textContent = active;
  document.getElementById("total-inactive-products").textContent =
    inactive;
  document.getElementById("product-progress-bar").style.width =
    `${activePercent}%`;

  document.getElementById("total-sites").textContent = siteData.length;
  document.getElementById("running-sites").textContent = running;
  document.getElementById("paused-sites").textContent = paused;
  document.getElementById("stopped-sites").textContent = stopped;
  document.getElementById("running-percent").textContent = `${runningPercent}%`;
  document.getElementById("paused-percent").textContent = `${pausedPercent}%`;
  document.getElementById("stopped-percent").textContent = `${stoppedPercent}%`;
  document.querySelector(".segment-running").style.width = `${runningPercent}%`;
  document.querySelector(".segment-paused").style.width = `${pausedPercent}%`;
  document.querySelector(".segment-stopped").style.width = `${stoppedPercent}%`;

  renderSquads(productData);
  initChart(Number(activePercent));
}

async function logout() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await supabase.auth.signOut();
  localStorage.removeItem("loginData");
  window.location.href = "../../Login.html";
}

function renderSquads(products) {
  const squadList = document.getElementById("squad-list");
  if (!squadList) return;

  const counts = products.reduce((result, product) => {
    const teamCode = String(product.team_code || "").trim();
    const squad =
      teamCode.toLowerCase() === "mscrum"
        ? "Chưa phân đội"
        : teamCode || "Chưa phân đội";
    result[squad] = (result[squad] || 0) + 1;
    return result;
  }, {});

  squadList.innerHTML = Object.entries(counts)
    .map(
      ([squad, count], index) => `
        <span class="squad-item">
          <i class="dot ${index % 3 === 0 ? "dot-cyan" : index % 3 === 1 ? "dot-purple" : "dot-gray"}"></i>
          ${squad}
          <strong>${count}</strong>
        </span>`,
    )
    .join("");
}

function initChart(stability = 0) {
  const ctx = document.getElementById("stabilityChart")?.getContext("2d");
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, 60);
  gradient.addColorStop(0, "rgba(56, 189, 248, 0.4)");
  gradient.addColorStop(1, "rgba(56, 189, 248, 0)");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      datasets: [
        {
          data: Array(7).fill(stability),
          borderColor: "#38bdf8",
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          pointRadius: 0,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{ display: false }],
        yAxes: [{ display: false, ticks: { min: 0, max: 100 } }],
      },
      tooltips: { enabled: false },
    },
  });

  const average = document.getElementById("stability-average");
  if (average) average.textContent = `${stability.toFixed(1)}% Avg`;
}

document.addEventListener("DOMContentLoaded", () => {
  count();
});
