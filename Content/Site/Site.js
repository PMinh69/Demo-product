const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

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
  const { data: relationData } = await supabase
    .from("product_site")
    .select("*")
    .eq("site_id", site_id);

  if (relationData.length) {
    await supabase.from("product_site").delete().eq("site_id", site_id);
  }

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
  const { siteError } = await supabase
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
  closeUpdateModal();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchSite();
});
