const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const sitesPerPage = 15;
let currentSitePage = 1;
let currentFilteredSites = [];

const siteColumns = [
  ["application_name", "Tên ứng dụng"],
  ["url_site", "URL Site"],
  ["ip_server", "IP Server"],
  ["note", "Ghi chú"],
  ["type", "Loại"],
  ["status", "Trạng thái"],
  ["ip_server_local", "IP Server nội bộ"],
  ["folder_path", "Đường dẫn thư mục"],
  ["account_info", "Tài khoản"]
];

const siteTypes = {
  1: "Website",
  2: "WebAPI",
  3: "WindowsService",
  4: "WorkerService",
  5: "DesktopApp",
  6: "MobileApp",
};

const siteStatuses = {
  1: "Run",
  0: "Pause",
  "-1": "Stop",
};

function removeAccents(str) {
  var AccentsMap = [
    "aàảãáạăằẳẵắặâầẩẫấậ",
    "AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ",
    "dđ", "DĐ",
    "eèẻẽéẹêềểễếệ",
    "EÈẺẼÉẸÊỀỂỄẾỆ",
    "iìỉĩíị",
    "IÌỈĨÍỊ",
    "oòỏõóọôồổỗốộơờởỡớợ",
    "OÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ",
    "uùủũúụưừửữứự",
    "UÙỦŨÚỤƯỪỬỮỨỰ",
    "yỳỷỹýỵ",
    "YỲỶỸÝỴ"
  ];
  for (var i=0; i<AccentsMap.length; i++) {
    var re = new RegExp('[' + AccentsMap[i].substr(1) + ']', 'g');
    var char = AccentsMap[i][0];
    str = str.replace(re, char);
  }
  return str;
}

let allSitesData = [];
let siteModalMode = "add";
let selectedPublicIps = [];

function getPublicIps(value) {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .filter((ip) => ip != null)
          .map((ip) => String(ip).trim())
          .filter(Boolean),
      ),
    ];
  }

  if (typeof value !== "string" || value.trim() === "") return [];

  const trimmedValue = value.trim();
    const parsedValue = JSON.parse(trimmedValue);
    if (Array.isArray(parsedValue)) {
      return [
        ...new Set(
          parsedValue
            .filter((ip) => ip != null)
            .map((ip) => String(ip).trim())
            .filter(Boolean),
        ),
      ];
    }

  return [trimmedValue];
}

function renderPublicIpDisplay(value) {
  const ips = getPublicIps(value);
  if (ips.length === 0) {
    const emptyIcon = document.createElement("i");
    emptyIcon.className = "fa-solid fa-minus";
    emptyIcon.setAttribute("aria-hidden", "true");
    return emptyIcon;
  }

  const [firstIp, ...remainingIps] = ips;
  const firstBadge = document.createElement("span");
  firstBadge.className = "public-ip-badge";
  firstBadge.textContent = firstIp;

  if (remainingIps.length === 0) return firstBadge;

  const display = document.createElement("span");
  display.className = "public-ip-display";
  display.append(firstBadge);

  const extraIps = document.createElement("span");
  extraIps.className = "public-ip-extra";
  extraIps.hidden = true;
  remainingIps.forEach((ip) => {
    const badge = document.createElement("span");
    badge.className = "public-ip-badge";
    badge.textContent = ip;
    extraIps.append(badge);
  });
  display.append(extraIps);

  const expandButton = document.createElement("button");
  expandButton.type = "button";
  expandButton.className = "public-ip-expand";
  expandButton.setAttribute("onclick", "togglePublicIpDisplay(this)");
  expandButton.textContent = `+${remainingIps.length}`;
  display.append(expandButton);

  const collapseButton = document.createElement("button");
  collapseButton.type = "button";
  collapseButton.className = "public-ip-collapse";
  collapseButton.setAttribute("onclick", "togglePublicIpDisplay(this)");
  collapseButton.setAttribute("aria-expanded", "true");
  collapseButton.setAttribute("aria-label", "Thu gọn danh sách IP");
  collapseButton.title = "Thu gọn";
  collapseButton.hidden = true;
  const collapseIcon = document.createElement("i");
  collapseIcon.className = "fa-solid fa-minus";
  collapseIcon.setAttribute("aria-hidden", "true");
  collapseButton.append(collapseIcon);
  display.append(collapseButton);

  return display;
}

function togglePublicIpDisplay(button) {
  const display = button.closest(".public-ip-display");
  const extraIps = display.querySelector(".public-ip-extra");
  const expandButton = display.querySelector(".public-ip-expand");
  const collapseButton = display.querySelector(".public-ip-collapse");
  const expanded = extraIps.hidden;

  extraIps.hidden = !expanded;
  expandButton.hidden = expanded;
  collapseButton.hidden = !expanded;
  expandButton.setAttribute("aria-expanded", String(expanded));
  collapseButton.setAttribute("aria-expanded", String(expanded));
}

function renderPublicIps(ips) {
  const list = document.getElementById("ip_server_list");
  selectedPublicIps = getPublicIps(ips);
  const badges = selectedPublicIps.map((ip, index) => {
    const badge = document.createElement("span");
    badge.className = "public-ip-badge";
    const label = document.createElement("span");
    label.textContent = ip;
    badge.append(label);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "public-ip-remove-button";
    removeButton.setAttribute("onclick", `removePublicIp(${index})`);
    removeButton.setAttribute("aria-label", `Xóa IP ${ip}`);
    removeButton.textContent = "×";
    badge.append(removeButton);
    return badge;
  });
  list.replaceChildren(...badges);
}

function addPublicIp() {
  const input = document.getElementById("public-ip-input");
  const ip = input.value.trim();
  if (!ip) {
    input.focus();
    return;
  }

  if (!selectedPublicIps.includes(ip)) {
    renderPublicIps([...selectedPublicIps, ip]);
  }
  input.value = "";
  input.focus();
}

function removePublicIp(index) {
  renderPublicIps(selectedPublicIps.filter((_, ipIndex) => ipIndex !== index));
}

function handlePublicIpKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addPublicIp();
  }
}

async function fetchSite() {
  const siteBody = document.getElementById("site-body");
  if (!siteBody) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: siteData, error: siteError } = await supabase
    .from("site")
    .select("*")
    .order("id", { ascending: false });

  if (siteError) {
    console.error("Lỗi khi tải dữ liệu từ bảng site:", siteError);
    return;
  }

  allSitesData = siteData || [];
  addOption(allSitesData);
  renderSites(allSitesData);
}

async function exportSitesJson() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase
    .from("site")
    .select("*")
    .order("id", { ascending: true });

  const filteredData = data.map((item) => ({
    id: item.id,
    pass: item.password,
  }));

  const jsonString = JSON.stringify(filteredData, null, 2);
  const blob = new Blob([jsonString], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sites-export.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function addOption(sites) {
  const ipSelect = document.getElementById("filter-ip");
  const uniqueIps = [
    ...new Set(sites.flatMap((site) => getPublicIps(site.ip_server))),
  ];
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "IP Server";
  const options = [placeholder];
  uniqueIps.forEach((ip) => {
    const option = document.createElement("option");
    option.value = ip;
    option.textContent = ip;
    options.push(option);
  });
  ipSelect.replaceChildren(...options);
}

function renderSites(sites) {
  currentFilteredSites = sites || [];
  currentSitePage = 1;
  renderSitePage();
}

function renderSitePage() {
  const siteBody = document.getElementById("site-body");
  if (!siteBody) return;

  const totalItems = currentFilteredSites.length;
  const totalPages = Math.ceil(totalItems / sitesPerPage);
  currentSitePage = Math.max(1, Math.min(currentSitePage, Math.max(1, totalPages)));

  const paginationInfo = document.getElementById("sitePaginationInfo");
  const paginationControls = document.getElementById("sitePaginationControls");

  if (totalItems === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = siteColumns.length + 1;
    cell.style.textAlign = "center";
    cell.textContent = "Không tìm thấy site phù hợp.";
    row.append(cell);
    siteBody.replaceChildren(row);
    paginationInfo.textContent = "Hiển thị từ 0 đến 0 của 0 bản ghi";
    paginationControls.innerHTML = "";
    return;
  }

  const startIndex = (currentSitePage - 1) * sitesPerPage;
  const endIndex = Math.min(startIndex + sitesPerPage, totalItems);
  const rows = currentFilteredSites.slice(startIndex, endIndex).map((site) => {
    const row = document.createElement("tr");

    siteColumns.forEach(([column]) => {
      const cell = document.createElement("td");
      const value = site?.[column] ?? "";

      if (column === "ip_server") {
        cell.append(renderPublicIpDisplay(value));
      } else if (value === "") {
        const emptyIcon = document.createElement("i");
        emptyIcon.className = "fa-solid fa-minus";
        emptyIcon.setAttribute("aria-hidden", "true");
        cell.append(emptyIcon);
      } else if (column === "type") {
        const typeKey = String(value);
        const badge = document.createElement("span");
        badge.className = `site-type-badge site-type-${typeKey}`;
        badge.textContent = siteTypes[typeKey] ?? String(value);
        cell.append(badge);
      } else if (column === "status") {
        const statusKey = String(value);
        const statusClass =
          statusKey === "1"
            ? "site-status-run"
            : statusKey === "0"
              ? "site-status-pause"
              : "site-status-stop";
        const badge = document.createElement("span");
        badge.className = `site-status ${statusClass}`;
        const dot = document.createElement("span");
        dot.className = "status-dot";
        badge.append(dot, document.createTextNode(siteStatuses[statusKey] ?? String(value)));
        cell.append(badge);
      } else if (column === "url_site") {
        const link = document.createElement("a");
        link.href = String(value);
        link.textContent = String(value);
        cell.append(link);
      } else {
        cell.textContent = String(value);
      }

      row.append(cell);
    });

    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "site-table-button";
    [
      ["site-update", "fa-pen-to-square", "openUpdateModal"],
      ["site-delete", "fa-trash", "deleteModal"],
    ].forEach(([buttonClass, iconClass, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `site-row-button ${buttonClass}`;
      button.setAttribute("onclick", `${action}(${site.id})`);
      const icon = document.createElement("i");
      icon.className = `fa-solid ${iconClass}`;
      icon.setAttribute("aria-hidden", "true");
      button.append(icon);
      actions.append(button);
    });
    actionCell.append(actions);
    row.append(actionCell);
    return row;
  });
  siteBody.replaceChildren(...rows);
  paginationInfo.textContent = `Hiển thị từ ${startIndex + 1} đến ${endIndex} của ${totalItems} bản ghi`;
  renderPageControls(
    paginationControls,
    currentSitePage,
    totalPages,
    "changeSitePage",
  );
}

function renderPageControls(controls, currentPage, totalPages, changePageFunction) {
  if (totalPages <= 1) {
    controls.innerHTML = "";
    return;
  }

  let pages = [];

  if (totalPages <= 6) {
    pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  } else if (currentPage <= 3) {
    pages = [1, 2, 3, 4, 5, totalPages];
  } else if (currentPage >= totalPages - 2) {
    pages = [
      1,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  } else {
    pages = [
      1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
      totalPages,
    ];
  }

  let html = `
    <button class="pagination-btn"
      ${currentPage === 1 ? "disabled" : ""}
      onclick="${changePageFunction}(${currentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      html += `<span class="pagination-dots">...</span>`;
    }

    html += `
      <button
        class="pagination-btn ${page === currentPage ? "active" : ""}"
        onclick="${changePageFunction}(${page})">
        ${page}
      </button>
    `;
  });

  html += `
    <button class="pagination-btn"
      ${currentPage === totalPages ? "disabled" : ""}
      onclick="${changePageFunction}(${currentPage + 1})">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  controls.innerHTML = html;
}

function changeSitePage(page) {
  const totalPages = Math.ceil(currentFilteredSites.length / sitesPerPage);
  if (page < 1 || page > totalPages || page === currentSitePage) return;

  currentSitePage = page;
  renderSitePage();
}

function RenderFilter() {
  const keyword = removeAccents(document
    .getElementById("site-search")
    .value.toLowerCase()
    .trim());
  const selectedIp = document.getElementById("filter-ip").value;
  const selectedType = document.getElementById("filter-type").value;
  const selectedStatus = document.getElementById("filter-status").value;

  const filtered = allSitesData.filter((site) => {
    const name = String(site.application_name || "").toLowerCase();
    const matchKeyword = keyword === "" || name.includes(keyword);
    const matchIp =
      selectedIp === "" || getPublicIps(site.ip_server).includes(selectedIp);
    const matchType = selectedType === "" || String(site.type) === selectedType;
    const matchStatus =
      selectedStatus === "" || String(site.status) === selectedStatus;

    return matchKeyword && matchIp && matchType && matchStatus;
  });

  renderSites(filtered);
}

function deleteModal(siteId) {
  document.getElementById("delete_product_id").value = siteId;
  document.getElementById("deleteSiteModal").style.display = "flex";
}

async function confirmDeleteSite() {
  const siteId = document.getElementById("delete_product_id").value;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: relationData } = await supabase
    .from("product_site")
    .select("*")
    .eq("site_id", siteId);

  if (relationData.length) {
    await supabase.from("product_site").delete().eq("site_id", siteId);
  }

  const { error: siteError } = await supabase
    .from("site")
    .delete()
    .eq("id", siteId);

  if (siteError) {
    alert("Lỗi khi xóa site:", siteError);
    alert("Xóa thất bại!");
    return;
  }

  const siteBody = document.getElementById("site-body");
  siteBody.innerHTML = ``;
  fetchSite();
  closeModal("deleteSiteModal");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function openSiteModal(mode) {
  document.getElementById("siteForm").reset();
  document.getElementById("site_id").value = "";
  renderPublicIps([]);
  siteModalMode = mode;
  document.getElementById("site-modal-title").textContent =
    mode === "add" ? "Thêm Site" : "Cập nhật Site";
  const modal = document.getElementById("siteModal");
  modal.style.display = "flex";
}

function submitSiteModal() {
  if (siteModalMode === "add") {
    addModal();
  } else {
    updateModal();
  }
}

async function addModal() {
  const formData = {
    application_name: document.getElementById("application_name").value,
    url_site: document.getElementById("url_site").value,
    ip_server: getSelectedPublicIps(),
    ip_server_local: document.getElementById("ip_server_local").value,
    type: document.getElementById("type").value
      ? Number(document.getElementById("type").value)
      : null,
    status: document.getElementById("status").value
      ? Number(document.getElementById("status").value)
      : null,
    folder_path: document.getElementById("folder_path").value,
    note: document.getElementById("note").value,
  };

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await supabase.from("site").insert([formData]).select();

  if (error) {
    alert("Lỗi khi thêm vào bảng site:", error);
    return;
  }

  const siteBody = document.getElementById("site-body");
  siteBody.innerHTML = ``;
  fetchSite();
  closeModal("siteModal");

  alert("Thêm mới thành công");
}

async function openUpdateModal(site_id) {
  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
  );
  const idsArray = Array.isArray(site_id) ? site_id : [site_id];

  const { data: siteData, error: siteError } = await supabaseClient
    .from("site")
    .select("*")
    .in("id", idsArray)
    .order("id", { ascending: false });

  if (siteError) {
    throw siteError;
  }
  if (siteData && siteData.length > 0) {
    const site = siteData[0];
    openSiteModal("update");
    document.getElementById("site_id").value = site.id;
    document.getElementById("application_name").value =
      site.application_name || "";
    document.getElementById("url_site").value = site.url_site || "";
    renderPublicIps(getPublicIps(site.ip_server));
    document.getElementById("ip_server_local").value =
      site.ip_server_local || "";
    document.getElementById("type").value = site.type ?? "";
    document.getElementById("status").value = site.status ?? "";
    document.getElementById("folder_path").value = site.folder_path || "";
    document.getElementById("note").value = site.note || "";
  } else {
    console.warn("Không tìm thấy dữ liệu cho ID:", site_id);
  }
}

async function updateModal() {
  const site_id = document.getElementById("site_id").value;

  const formData = {
    application_name: document.getElementById("application_name").value,
    url_site: document.getElementById("url_site").value,
    ip_server: getSelectedPublicIps(),
    ip_server_local: document.getElementById("ip_server_local").value,
    type: Number(document.getElementById("type").value),
    status: document.getElementById("status").value,
    folder_path: document.getElementById("folder_path").value,
    note: document.getElementById("note").value,
  };

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error: siteError } = await supabase
    .from("site")
    .update([formData])
    .eq("id", site_id)
    .select();

  if (siteError) {
    alert("Lỗi khi cập nhật site:", siteError);
    return;
  }

  alert("Cập nhật thành công");

  const siteBody = document.getElementById("site-body");
  siteBody.innerHTML = ``;
  fetchSite();
  closeModal("siteModal");
}

async function logout() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await supabase.auth.signOut();
  localStorage.removeItem("loginData");
  window.location.href = "../../Login.html";
}

function getSelectedPublicIps() {
  return [...selectedPublicIps];
}

document.addEventListener("DOMContentLoaded", () => {
  fetchSite();
});