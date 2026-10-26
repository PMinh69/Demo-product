const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const productColumns = [
  ["name", "tên dự án"],
  ["description", "mô tả"],
  ["partner_name", "đối tác"],
  ["team_code", "đội phụ trách"],
  ["environment_type", "môi trường test"],
  ["main_server", "port"],
];

const envMap = {
  0: "test",
  1: "test uat",
  2: "product",
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

  if (!productData) {
    productContainer.innerHTML = `<p>Không tìm thấy sản phẩm này.</p>`;
    return;
  }

  productContainer.innerHTML = productData
    .map(
      (product) => `
    <div class="product-card" id="product-card-${product.id}">
      <div class="product-card-header">
        <h3 class="product-title">${product.name || "Chưa có tên"}</h3>
        <span class="badge env-badge env-${product.environment_type}">
          ${envMap[product.environment_type]}
        </span>
      </div>

      <div class="product-card-body">
        <div class="product-details">
          <p><strong>Mô tả:</strong> ${product.description || "Không có mô tả"}</p>
          <p><strong>Đối tác:</strong> ${product.partner_name || "N/A"}</p>
          <p><strong>Đội phụ trách:</strong> ${product.team_code || "N/A"}</p>
          <p><strong>Server:</strong> ${product.main_server || "N/A"}</p>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
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

async function fetchSite() {
  const siteBody = document.getElementById("site-body");
  if (!siteBody) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const { data: relationData, error: relationError } = await supabase
    .from("product_site")
    .select("*")
    .eq("product_id", productId)
    .order("id", { ascending: false });

  if (relationError) {
    console.error("Lỗi khi tải bảng trung gian product_site:", relationError);
    return;
  }

  if (relationData.length === 0) {
    siteBody.innerHTML = `<tr><td colspan="${siteColumns.length + 1}" style="text-align: center;">Không có site nào thuộc dự án này.</td></tr>`;
    return;
  }

  const siteIds = relationData.map((item) => item.site_id).filter(Boolean);

  const { data: siteData, error: siteError } = await supabase
    .from("site")
    .select("*")
    .in("id", siteIds);

  if (siteError) {
    console.error("Lỗi khi tải dữ liệu từ bảng site:", siteError);
    return;
  }

  const sortedSiteData = siteIds
    .map((id) => siteData.find((site) => site.id === id))
    .filter(Boolean);

  siteBody.innerHTML = sortedSiteData
    .map((site) => {
      return `
      <tr>
        ${siteColumns
          .map(([column]) => {
            let value = site?.[column] ?? "";

            if (column === "type") {
              value = siteTypes[value];
            }

            if (column === "status") {
              value = siteStatuses[value];
            }

            if (column === "url_site") {
              return `<td><a href="${value}">${value}</a></td>`;
            }

            if (column === "note") {
              const relation = relationData.find(
                (item) => item.site_id === site.id,
              );
              return `<td>${relation?.note ?? ""}</td>`;
            }

            return `<td>${value}</td>`;
          })
          .join("")}
          <td>
            <div class="site-table-button">
              <button type="button" class="site-row-button site-update" onclick="openUpdateModal(${site.id})">
                <i class="fa-solid fa-pen" aria-hidden="true"></i>
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

async function deleteModal(site_id) {
  if (!confirm("Bạn có chắc chắn muốn xóa site này không?")) return;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");
  const { siteError } = await supabase
    .from("product_site")
    .delete()
    .eq("site_id", site_id)
    .eq("product_id", productId);

  if (siteError) {
    alert("Lỗi khi xóa site:", siteError);
    alert("Xóa thất bại!");
    return;
  }

  fetchSite();
  closeModal();

  alert("Xóa thành công!");
}

function openModal() {
  const modal = document.getElementById("addModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeModal() {
  const modal = document.getElementById("addModal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function openAddExistedModal() {
  const modal = document.getElementById("addExistedModal");
  if (!modal) return;
  modal.style.display = "flex";

  const tbody = document.getElementById("existed-site-body");
  if (!tbody) return;

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
    console.error("Lỗi khi tải dữ liệu từ bảng site:", siteError);
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align: center; color: #ff6b6b;">Không thể tải dữ liệu site.</td></tr>`;
    return;
  }

  const availableSites = (siteData || []).filter(
    (site) => !existedSite.includes(site.id),
  );

  if (availableSites.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align: center; color: #9ca3af;">Không có site nào khả dụng để thêm.</td></tr>`;
    return;
  }

  tbody.innerHTML = availableSites
    .map((site) => {
      return `
      <tr onclick="toggleCheckbox(this)" style="cursor: pointer;">
        <td style="text-align: center;">
          <input type="checkbox" class="existed-site-checkbox" value="${site.id}" />
        </td>
        ${siteExistedColumns
          .map(([column]) => {
            let value = site?.[column] ?? "";

            if (column === "type") {
              value = siteTypes[value] ?? value;
            }

            if (column === "status") {
              value = siteStatuses[value] ?? value;
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

function toggleCheckbox(rowElement) {
  const checkbox = rowElement.querySelector(".existed-site-checkbox");
  if (checkbox) {
    checkbox.checked = !checkbox.checked;
  }
}

function closeAddExistedModal() {
  document.getElementById("addExistedModal").style.display = "none";
}

function toggleSelectAllExisted(masterCheckbox) {
  const checkboxes = document.querySelectorAll(".existed-site-checkbox");
  checkboxes.forEach((cb) => (cb.checked = masterCheckbox.checked));
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

  closeAddExistedModal();
  fetchSite();
}

async function addModal() {
  const formData = {
    application_name: document.getElementById("application_name").value,
    url_site: document.getElementById("url_site").value,
    ip_server: document.getElementById("ip_server").value,
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
  closeModal();

  alert("Thêm mới thành công");
}

async function openUpdateModal(site_id) {
  const modal = document.getElementById("updateModal");
  if (modal) {
    modal.style.display = "flex";
  }

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
    document.getElementById("updateId").value = site_id;
    document.getElementById("update_application_name").value =
      site.application_name;
    document.getElementById("update_url_site").value = site.url_site || "";
    document.getElementById("update_ip_server").value = site.ip_server || "";
    document.getElementById("update_ip_server_local").value =
      site.ip_server_local || "";
    document.getElementById("update_type").value = site.type;
    document.getElementById("update_status").value = site.status;

    document.getElementById("update_folder_path").value =
      site.folder_path || "";
    document.getElementById("update_note").value = site.note || "";
  } else {
    console.warn("Không tìm thấy dữ liệu cho ID:", site_id);
  }
}

function closeUpdateModal() {
  const modal = document.getElementById("updateModal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function updateModal() {
  const site_id = document.getElementById("updateId").value;

  const formData = {
    application_name: document.getElementById("update_application_name").value,
    url_site: document.getElementById("update_url_site").value,
    ip_server: document.getElementById("update_ip_server").value,
    ip_server_local: document.getElementById("update_ip_server_local").value,
    type: Number(document.getElementById("update_type").value),
    status: document.getElementById("update_status").value,
    folder_path: document.getElementById("update_folder_path").value,
  };

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { siteError } = await supabase
    .from("site")
    .update([formData])
    .eq("id", site_id)
    .select();

  const relationData = {
    note: document.getElementById("update_note").value,
  };

  const { relationError } = await supabase
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
  closeUpdateModal();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProduct();
  fetchSite();
});
