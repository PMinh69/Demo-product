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

let selectedSiteId = null;

async function fetchSite() {
  const siteBody = document.getElementById("site-body");
  if (!siteBody) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  const { data: relationData, error: relationError } = await supabase
    .from("product_site")
    .select("*")
    .eq("product_id", productId);

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
    .in("id", siteIds)
    .order("id", { ascending: false });

  if (siteError) {
    console.error("Lỗi khi tải dữ liệu từ bảng site:", siteError);
    return;
  }

  siteBody.innerHTML = siteData
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

  await supabase.from("product_site").delete().eq("site_id", site_id);

  const { siteError } = await supabase.from("site").delete().eq("id", site_id);

  if (siteError) {
    alert("Lỗi khi xóa site:", siteError);
    alert("Xóa thất bại!");
    return;
  }
  const siteBody = document.getElementById("site-body");
  siteBody.innerHTML = ``;
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

async function addModal() {
  const formData = {
    application_name: document.getElementById("application_name").value,
    url_site: document.getElementById("url_site").value,
    ip_server: document.getElementById("ip_server").value,
    ip_server_local: document.getElementById("ip_server_local").value,
    type: document.getElementById("type").value
      ? Number(document.getElementById("type").value)
      : null,
    status: document.getElementById("status").value,
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

  const siteBody = document.getElementById("site-body");
  siteBody.innerHTML = ``;
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
    note: document.getElementById("update_note").value,
  };

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await supabase
    .from("site")
    .update(formData)
    .eq("id", site_id)
    .select();

  if (error) {
    alert("Lỗi khi cập nhật site:", error);
    return;
  }
  alert("Cập nhật thành công");
  fetchSite();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProduct();
  fetchSite();
});
