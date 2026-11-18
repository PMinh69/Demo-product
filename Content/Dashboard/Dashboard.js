const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const logsColumns = [
  ["created_at", "Thời gian"],
  ["user_email", "Người thực hiện"],
  ["table_name", "Tên bảng"],
  ["action", "Hành động"],
  ["description", "Ghi chú"],
];

const actionBadges = {
  INSERT: { icon: "fa-plus", className: "audit-tag-insert" },
  UPDATE: { icon: "fa-pen-to-square", className: "audit-tag-update" },
  DELETE: { icon: "fa-trash", className: "audit-tag-delete" },
};

const tableBadges = {
  product_site: { icon: "fa-link", className: "audit-tag-product-site" },
  product: { icon: "fa-box", className: "audit-tag-product" },
  site: { icon: "fa-globe", className: "audit-tag-site" },
};

let allLogsData = [];

async function fetchLogs() {
  const tableHead = document.getElementById("audit-log-head");
  const tbody = document.getElementById("audit-log-body");
  if (!tableHead || !tbody) return;

  tableHead.innerHTML = `
    <tr>
      ${logsColumns.map(([, label]) => `<th scope="col">${label}</th>`).join("")}
    </tr>
  `;

  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Lỗi khi tải nhật ký hoạt động:", error);
      allLogsData = [];
      filterLogs();
      return;
    }

    allLogsData = logs || [];
    filterLogs();
  } catch (error) {
    console.error("Lỗi khi tải nhật ký hoạt động:", error);
    allLogsData = [];
    filterLogs();
  }
}

function filterLogs() {
  const searchInput = document.getElementById("audit-user-search");
  const tableFilter = document.getElementById("audit-table-filter");
  const actionFilter = document.getElementById("audit-action-filter");
  if (!searchInput || !tableFilter || !actionFilter) return;

  const keyword = searchInput.value.trim().toLowerCase();
  const selectedTable = tableFilter.value;
  const selectedAction = actionFilter.value;

  const filteredLogs = allLogsData.filter((log) => {
    const userEmail = String(log.user_email || "").toLowerCase();
    const matchesEmail = !keyword || userEmail.includes(keyword);
    const matchesTable =
      !selectedTable ||
      String(log.table_name || "").toLowerCase() === selectedTable;
    const matchesAction =
      !selectedAction ||
      String(log.action || "").toUpperCase() === selectedAction;

    return matchesEmail && matchesTable && matchesAction;
  });

  renderLogs(filteredLogs);
}

function renderLogs(logs) {
  const tbody = document.getElementById("audit-log-body");
  if (!tbody) return;

  const totalItems = logs.length;

  if (totalItems === 0) {
    const message = allLogsData.length
      ? "Không tìm thấy nhật ký phù hợp."
      : "Chưa có hoạt động nào được ghi nhận.";

    tbody.innerHTML = `
      <tr>
        <td colspan="${logsColumns.length}" style="text-align: center;">
          ${message}
        </td>
      </tr>
    `;
    return;
  }

  const limitToDisplay = 15;
  const displayedLogs = logs.slice(0, limitToDisplay);

  tbody.innerHTML = displayedLogs
    .map(
      (log) => `
      <tr>
        ${logsColumns
          .map(([column]) => {
            let value = log?.[column] ?? "";

            if (typeof value === "string" && value.trim() === "") {
              return `<td><span class="empty-value">Chưa cập nhật</span></td>`;
            }

            if (column === "created_at") {
              const date = new Date(value);
              value = new Intl.DateTimeFormat("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "Asia/Ho_Chi_Minh",
                hour12: false,
              }).format(date);
            } else if (column === "action") {
              const badge = actionBadges[value] || {};
              return `<td><span class="audit-tag ${badge.className || ""}"><i class="fa-solid ${badge.icon || "fa-info"}" aria-hidden="true"></i>${value}</span></td>`;
            } else if (column === "table_name") {
              const badge = tableBadges[value] || {};
              return `<td><span class="audit-tag ${badge.className || ""}"><i class="fa-solid ${badge.icon || "fa-table"}" aria-hidden="true"></i>${value}</span></td>`;
            }

            return `<td>${value}</td>`;
          })
          .join("")}
      </tr>
    `,
    )
    .join("");
}

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
  const active = productData.filter(
    (product) => product.is_live === true,
  ).length;
  const inactive = total - active;
  const activePercent = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

  const running = siteData.filter((site) => Number(site.status) === 1).length;
  const paused = siteData.filter((site) => Number(site.status) === 0).length;
  const stopped = siteData.filter((site) => Number(site.status) === -1).length;
  const runningPercent = ((running / siteData.length) * 100).toFixed(2);
  const pausedPercent = ((paused / siteData.length) * 100).toFixed(2);
  const stoppedPercent = ((stopped / siteData.length) * 100).toFixed(2);

  document.getElementById("total-products").textContent = total;
  document.getElementById("total-active-products").textContent = active;
  document.getElementById("total-inactive-products").textContent = inactive;
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
  fetchLogs();
});
