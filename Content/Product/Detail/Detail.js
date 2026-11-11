const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const productColumns = [
  ["name", "tên dự án"],
  ["description", "mô tả"],
  ["partner_name", "đối tác"],
  ["team_code", "đội phụ trách"],
  ["environment_type", "môi trường test"],
  ["main_server", "server"],
];

const envMap = {
  0: "test",
  1: "test uat",
  2: "product",
};

let siteModalMode = "add";
let currentProduct = null;

const productTeamBadgeClasses = {
  team1: "project-team-1",
  team2: "project-team-2",
  team3: "project-team-3",
  team4: "project-team-4",
  mscscrum: "project-team-mscrum",
};

async function fetchProduct() {
  const productContainer = document.getElementById("product-info");
  if (!productContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  if (!productId) {
    productContainer.innerHTML =
      "<p>Không tìm thấy ID sản phẩm trên đường dẫn.</p>";
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: productData, error: productError } = await supabase
    .from("product")
    .select("*")
    .eq("id", productId);

  if (productError) {
    console.error("Lỗi khi tải dữ liệu:", productError);
    productContainer.innerHTML = `<p class="error-text">Lỗi khi tải dữ liệu sản phẩm.</p>`;
    return;
  }

  if (!productData || productData.length === 0) {
    productContainer.innerHTML = `<p>Không tìm thấy sản phẩm này.</p>`;
    return;
  }

  currentProduct = productData[0];
  const product = currentProduct;
  const teamCode = String(product.team_code || "").trim();
  const teamClass =
    productTeamBadgeClasses[teamCode.toLowerCase()] || "project-team-default";
  const environmentLabel =
    envMap[product.environment_type] || "Chưa chọn môi trường";
  const isActive = Boolean(product.is_live);
  const renderMetaValue = (value) =>
    value
      ? value
      : `<span class="project-overview-empty">Chưa cập nhật</span>`;

  productContainer.innerHTML = `
    <article class="product-card" id="product-card-${Number(product.id)}">
      <header class="project-hero-header">
        <div class="project-hero-heading">
          <div class="project-hero-title-row">
            <h1 class="project-hero-title">${product.name}</h1>
            <span class="badge env-badge env-${Number(product.environment_type)}">
              ${environmentLabel}
            </span>
          </div>
          <div class="project-hero-identifiers">
            ${product.project_code ? `<span class="project-code">${product.project_code}</span>` : ""}
          </div>
          <p class="project-description">Mô tả: ${product.description}</p>
        </div>
        <span class="project-product-status ${isActive ? "badge-active" : "badge-inactive"}">
          <span class="status-dot" aria-hidden="true"></span>
          ${isActive ? "Active" : "Inactive"}
        </span>
      </header>

      <div class="project-overview-meta">
        <span class="project-meta-item">
          <strong>Đối tác:</strong> ${product.partner_name}
        </span>
        <span class="project-meta-item">
          <strong>Đội phụ trách:</strong>
          ${teamCode ? `<span class="project-team-badge ${teamClass}">${teamCode}</span>` : `<span class="project-overview-empty">Chưa cập nhật</span>`}
        </span>
        <span class="project-meta-item">
          <strong>Server:</strong>
          ${product.main_server ? `<code class="project-server">${product.main_server}</code>` : `<span class="project-overview-empty">Chưa cập nhật</span>`}
        </span>
      </div>
    </article>
  `;
}

const siteColumns = [
  ["application_name", "Tên ứng dụng"],
  ["url_site", "URL Site"],
  ["ip_server", "IP Server"],
  ["note", "Ghi chú"],
  ["type", "Loại"],
  ["status", "Trạng thái"],
  ["ip_server_local", "IP Server nội bộ"],
  ["folder_path", "Đường dẫn thư mục"],
];

const siteExistedColumns = [
  ["application_name", "Tên ứng dụng"],
  ["url_site", "URL Site"],
  ["ip_server", "IP Server"],
  ["type", "Loại"],
  ["status", "Trạng thái"],
  ["ip_server_local", "IP Server nội bộ"],
  ["folder_path", "Đường dẫn thư mục"],
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

let allSitesData = [];
let allRelationsData = [];
let availableSitesData = [];
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
  try {
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
  } catch {
    // Existing rows may contain a single IP stored as plain text.
  }

  return [trimmedValue];
}

function renderPublicIpDisplay(value) {
  const ips = getPublicIps(value);
  if (ips.length === 0) {
    return `<i class="fa-solid fa-minus" aria-hidden="true"></i>`;
  }

  const [firstIp, ...remainingIps] = ips;
  const badges = (items) =>
    items
      .map((ip) => `<span class="public-ip-badge">${ip}</span>`)
      .join("");

  if (remainingIps.length === 0) return badges(ips);

  return `
    <span class="public-ip-display">
      ${badges([firstIp])}
      <span class="public-ip-extra" hidden>${badges(remainingIps)}</span>
      <button
        type="button"
        class="public-ip-expand"
        onclick="togglePublicIpDisplay(this)"
        aria-expanded="false"
        aria-label="Hiển thị thêm ${remainingIps.length} IP"
      >+${remainingIps.length}</button>
      <button
        type="button"
        class="public-ip-collapse"
        onclick="togglePublicIpDisplay(this)"
        aria-expanded="true"
        aria-label="Thu gọn danh sách IP"
        title="Thu gọn"
        hidden
      ><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
    </span>
  `;
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
  list.replaceChildren();

  selectedPublicIps.forEach((ip) => {
    const badge = document.createElement("span");
    badge.className = "public-ip-badge";
    const text = document.createElement("span");
    text.textContent = ip;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "public-ip-remove-button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Xóa IP ${ip}`);
    removeButton.addEventListener("click", () => {
      renderPublicIps(selectedPublicIps.filter((selectedIp) => selectedIp !== ip));
      renderPublicIpOptions();
    });

    badge.append(text, removeButton);
    list.append(badge);
  });
}

function renderPublicIpOptions() {
  const options = document.getElementById("ip_server_options");
  const availableIps = [
    ...new Set([...window.ipPublicAddresses, ...selectedPublicIps]),
  ];
  options.replaceChildren();

  availableIps.forEach((ip) => {
    const label = document.createElement("label");
    label.className = "public-ip-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedPublicIps.includes(ip);
    checkbox.addEventListener("change", () => {
      const nextIps = checkbox.checked
        ? [...selectedPublicIps, ip]
        : selectedPublicIps.filter((selectedIp) => selectedIp !== ip);
      renderPublicIps(nextIps);
      renderPublicIpOptions();
    });

    const text = document.createElement("span");
    text.textContent = ip;
    label.append(checkbox, text);
    options.append(label);
  });
}

function togglePublicIpOptions() {
  const options = document.getElementById("ip_server_options");
  const toggle = document.getElementById("public-ip-toggle");
  options.hidden = !options.hidden;
  toggle.setAttribute("aria-expanded", String(!options.hidden));
  if (!options.hidden) renderPublicIpOptions();
}

async function fetchSite() {
  const siteBody = document.getElementById("site-body");
  if (!siteBody) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const { data: relationData } = await supabase
    .from("product_site")
    .select("*")
    .eq("product_id", productId)
    .order("id", { ascending: false });

  if (!relationData) {
    siteBody.innerHTML = `<tr><td colspan="${siteColumns.length + 1}" style="text-align: center;">Không có site nào thuộc dự án này.</td></tr>`;
    return;
  }

  allRelationsData = relationData;
  const siteIds = relationData.map((item) => item.site_id).filter(Boolean);

  const { data: siteData } = await supabase
    .from("site")
    .select("*")
    .in("id", siteIds);

  allSitesData = (siteData || []).sort((a, b) => {
    const relationA = relationData.find((item) => item.site_id === a.id);
    const relationB = relationData.find((item) => item.site_id === b.id);
    return (relationB?.id ?? 0) - (relationA?.id ?? 0);
  });

  addOption(allSitesData);

  if (allSitesData.length === 0) {
    siteBody.innerHTML = `<tr><td colspan="${siteColumns.length + 1}" style="text-align: center;">Không tìm thấy site phù hợp.</td></tr>`;
    return;
  }

  renderSites(allSitesData);
}

function renderSites(sites) {
  const siteBody = document.getElementById("site-body");
  if (!siteBody) return;

  siteBody.innerHTML = sites
    .map((site) => {
      return `
      <tr>
        ${siteColumns
          .map(([column]) => {
            let value = site?.[column] ?? "";

            if (column === "ip_server") {
              return `<td>${renderPublicIpDisplay(value)}</td>`;
            }

            if (column !== "note" && value === "")
              return `<td><i class="fa-solid fa-minus" aria-hidden="true"></i></td>`;

            if (column === "type") {
              const typeClass = `site-type-${value}`;
              value = `<span class="site-type-badge ${typeClass}">${siteTypes[value] ?? value}</span>`;
            }

            if (column === "status") {
              const statusClass =
                value === "1"
                  ? "site-status-run"
                  : value === "0"
                    ? "site-status-pause"
                    : "site-status-stop";
              value = `<span class="site-status ${statusClass}"><span class="status-dot"></span>${siteStatuses[value] ?? value}</span>`;
            }

            if (column === "url_site") {
              return `<td><a href="${value}" target="_blank">${value}</a></td>`;
            }

            if (column === "note") {
              const relation = allRelationsData.find(
                (item) => item.site_id === site.id,
              );
              const note = relation?.note;
              return `<td>${note == null || note === "" ? `<i class="fa-solid fa-minus" aria-hidden="true"></i>` : note}</td>`;
            }

            return `<td>${value}</td>`;
          })
          .join("")}
          <td>
            <div class="site-table-button">
              <button type="button" class="site-row-button site-update" onclick="openUpdateModal(${site.id})">
                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
              </button>
              <button type="button" class="site-row-button site-delete" onclick="deleteModal(${site.id})">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </td>
      </tr>
    `;
    })
    .join("");
}

function addOption(sites) {
  const ipSelect = document.getElementById("filter-ip");

  const uniqueIps = [
    ...new Set(sites.flatMap((site) => getPublicIps(site.ip_server))),
  ];
  ipSelect.innerHTML =
    `<option value="">IP Server</option>` +
    uniqueIps
      .map((ip) => `<option value="${ip}">${ip}</option>`)
      .join("");
}

function RenderFilter() {
  const keyword = document
    .getElementById("site-search")
    .value.toLowerCase()
    .trim();
  const selectedIp = document.getElementById("filter-ip").value;
  const selectedType = document.getElementById("filter-type").value;
  const selectedStatus = document.getElementById("filter-status").value;

  const filtered = allSitesData.filter((site) => {
    const appName = site.application_name
      ? String(site.application_name).toLowerCase()
      : "";
    const matchKeyword = keyword === "" || appName.includes(keyword);

    const matchIp =
      selectedIp === "" || getPublicIps(site.ip_server).includes(selectedIp);
    const matchType =
      selectedType === "" || String(site.type) === String(selectedType);
    const matchStatus =
      selectedStatus === "" || String(site.status) === String(selectedStatus);

    return matchKeyword && matchIp && matchType && matchStatus;
  });

  renderSites(filtered);

  const existedKeyword = (
    document.getElementById("searchExistedSite")?.value || ""
  )
    .toLowerCase()
    .trim();
  const existedIp = document.getElementById("existed-filter-ip")?.value || "";
  const existedType =
    document.getElementById("existed-filter-type")?.value || "";
  const existedStatus =
    document.getElementById("existed-filter-status")?.value || "";

  const filteredExisted = availableSitesData.filter((site) => {
    const searchableText = [
      site.application_name,
      site.url_site,
      getPublicIps(site.ip_server).join(" "),
      site.ip_server_local,
    ]
      .join(" ")
      .toLowerCase();
    const matchKeyword =
      existedKeyword === "" || searchableText.includes(existedKeyword);
    const matchIp =
      existedIp === "" || getPublicIps(site.ip_server).includes(existedIp);
    const matchType =
      existedType === "" || String(site.type) === String(existedType);
    const matchStatus =
      existedStatus === "" || String(site.status) === String(existedStatus);

    return matchKeyword && matchIp && matchType && matchStatus;
  });

  renderExistedSites(filteredExisted);
}

let pendingDeleteSiteId = null;

function deleteModal(siteId) {
  pendingDeleteSiteId = siteId;
  document.getElementById("deleteSiteModal").style.display = "flex";
}

function cancelDeleteSite() {
  pendingDeleteSiteId = null;
  document.getElementById("deleteSiteModal").style.display = "none";
}

async function confirmDeleteSite() {
  if (pendingDeleteSiteId === null) return;

  const siteId = pendingDeleteSiteId;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");
  const { error: relationError } = await supabase
    .from("product_site")
    .delete()
    .eq("site_id", siteId)
    .eq("product_id", productId);

  if (relationError) {
    alert(`Lỗi khi xóa liên kết site: ${relationError.message}`);
    return;
  }

  pendingDeleteSiteId = null;
  document.getElementById("deleteSiteModal").style.display = "none";
  fetchSite();
  fetchExistedSite();

  alert("Xóa thành công!");
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "flex";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "none";
}

async function fetchExistedSite() {
  const tbody = document.getElementById("existed-site-body");
  const totalCols = siteExistedColumns.length + 1;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const { data: relationData, error: relationError } = await supabase
    .from("product_site")
    .select("*")
    .eq("product_id", productId);

  if (relationError) {
    console.error("Lỗi khi tải bảng trung gian product_site:", relationError);
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align: center; color: #ff6b6b;">Không thể tải dữ liệu liên kết.</td></tr>`;
    return;
  }

  const existedSite = relationData.map((item) => item.site_id).filter(Boolean);

  const { data: siteData, error: siteError } = await supabase
    .from("site")
    .select("*")
    .order("id", { ascending: false });

  if (siteError) {
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align: center; color: #ff6b6b;">Không thể tải dữ liệu site.</td></tr>`;
    return;
  }

  const availableSites = (siteData || []).filter(
    (site) => !existedSite.includes(site.id),
  );
  availableSitesData = availableSites;
  addExistedIpOptions(availableSites);
  renderExistedSites(availableSites);
}

function addExistedIpOptions(sites) {
  const ipSelect = document.getElementById("existed-filter-ip");
  if (!ipSelect) return;

  const uniqueIps = [
    ...new Set(sites.flatMap((site) => getPublicIps(site.ip_server))),
  ];
  ipSelect.innerHTML =
    `<option value="">IP Server</option>` +
    uniqueIps
      .map((ip) => `<option value="${ip}">${ip}</option>`)
      .join("");
}

function renderExistedSites(sites) {
  const tbody = document.getElementById("existed-site-body");
  if (!tbody) return;
  const totalCols = siteExistedColumns.length + 1;

  if (!sites || sites.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align: center; color: #9ca3af;">Không có site nào khả dụng để thêm.</td></tr>`;
    return;
  }

  tbody.innerHTML = sites
    .map((site) => {
      return `
      <tr onclick="toggleCheckbox(this, event)" style="cursor: pointer;">
        <td style="text-align: center;">
          <div class="checkbox-wrapper-40">
            <label>
              <input type="checkbox" class="checkbox-control existed-site-checkbox" value="${site.id}" aria-label="Chọn site" />
              <span class="checkbox"></span>
            </label>
          </div>
        </td>
        ${siteExistedColumns
          .map(([column]) => {
            let value = site?.[column] ?? "";

            if (column === "ip_server") {
              return `<td>${renderPublicIpDisplay(value)}</td>`;
            }

            if (value === "")
              return `<td><i class="fa-solid fa-minus" aria-hidden="true"></i></td>`;

            if (column === "type") {
              const typeClass = `site-type-${value}`;
              value = `<span class="site-type-badge ${typeClass}">${siteTypes[value] ?? value}</span>`;
            }

            if (column === "status") {
              const statusClass =
                String(value) === "1"
                  ? "site-status-run"
                  : String(value) === "0"
                    ? "site-status-pause"
                    : "site-status-stop";
              value = `<span class="site-status ${statusClass}"><span class="status-dot"></span>${siteStatuses[value]}</span>`;
            }

            if (column === "url_site") {
              return `<td><a href="${value}" target="_blank">${value}</a></td>`;
            }

            return `<td>${value}</td>`;
          })
          .join("")}
      </tr>
    `;
    })
    .join("");
}

function toggleCheckbox(row, event) {
  if (
    event.target.closest(".checkbox-wrapper-40") ||
    event.target.closest(".public-ip-display")
  ) {
    return;
  }
  const checkbox = row.querySelector(".existed-site-checkbox");
  if (checkbox) {
    checkbox.checked = !checkbox.checked;
    row.classList.toggle("is-checked", checkbox.checked);
  }
}

function toggleSelectAllExisted(checkAll) {
  const checkboxes = document.querySelectorAll(".existed-site-checkbox");
  checkboxes.forEach((cb) => {
    cb.checked = checkAll.checked;
    const rowElement = cb.closest("tr");
    if (rowElement) {
      if (checkAll.checked) {
        rowElement.classList.add("is-checked");
      } else {
        rowElement.classList.remove("is-checked");
      }
    }
  });
}

async function addExistedSites() {
  const checkboxes = document.querySelectorAll(
    ".existed-site-checkbox:checked",
  );
  const selectedSiteIds = Array.from(checkboxes).map((cb) => cb.value);

  if (selectedSiteIds.length === 0) {
    alert("Vui lòng chọn ít nhất một site!");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const recordsToInsert = [];

  for (let i = 0; i < selectedSiteIds.length; i++) {
    recordsToInsert.push({
      product_id: productId,
      site_id: selectedSiteIds[i],
    });
  }

  const { error } = await supabase.from("product_site").insert(recordsToInsert);

  if (error) {
    alert("Không thể thêm site");
    return;
  }

  closeModal("addExistedModal");
  fetchSite();
  fetchExistedSite();
}

function openSiteModal(mode) {
  document.getElementById("siteForm").reset();
  document.getElementById("site_id").value = "";
  renderPublicIps([]);
  document.getElementById("ip_server_options").hidden = true;
  document.getElementById("public-ip-toggle").setAttribute("aria-expanded", "false");
  siteModalMode = mode;
  document.getElementById("site-modal-title").textContent =
    mode === "add" ? "Thêm Site" : "Cập nhật Site";
  openModal("siteModal");
}

function submitSiteModal(event) {
  event.preventDefault();
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
  const { data: siteData, error: siteError } = await supabase
    .from("site")
    .insert([formData])
    .select();

  if (siteError) {
    alert("Lỗi khi thêm vào bảng site:", siteError);
    return;
  }

  const newSiteId = siteData[0].id;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const relationData = {
    product_id: Number(productId),
    site_id: newSiteId,
    note: document.getElementById("note").value,
  };

  const { error: relationError } = await supabase
    .from("product_site")
    .insert([relationData]);

  if (relationError) {
    alert("Lỗi khi thêm vào bảng product_site:", relationError);
    return;
  }

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

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const { data: relationData, error: relationError } = await supabaseClient
    .from("product_site")
    .select("*")
    .eq("product_id", productId)
    .in("site_id", idsArray);
  if (relationError) {
    throw relationError;
  }

  const { data: siteData, error: siteError } = await supabaseClient
    .from("site")
    .select("*")
    .in("id", idsArray);

  if (siteError) {
    throw siteError;
  }
  if (siteData && siteData.length > 0) {
    const site = siteData[0];
    const relation = relationData?.find(
      (item) => String(item.site_id) === String(site_id),
    );
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
    document.getElementById("note").value = relation?.note || "";
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
    last_update: new Date().toISOString().split("T")[0],
  };

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error: siteError } = await supabase
    .from("site")
    .update([formData])
    .eq("id", site_id)
    .select();

  const relationData = {
    note: document.getElementById("note").value,
  };

  const { error: relationError } = await supabase
    .from("product_site")
    .update([relationData])
    .eq("product_id", productId)
    .eq("site_id", site_id)
    .select();

  if (siteError) {
    alert("Lỗi khi cập nhật site:", siteError);
    return;
  }

  if (relationError) {
    alert("Lỗi khi cập nhật product_site:", relationError);
    return;
  }
  alert("Cập nhật thành công");

  fetchSite();
  closeModal("siteModal");
}

async function logout() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await supabase.auth.signOut();
  localStorage.removeItem("loginData");
  window.location.href = "../../../Login.html";
}

function getSelectedPublicIps() {
  return [...selectedPublicIps];
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProduct();
  fetchSite();
  fetchExistedSite();
});
