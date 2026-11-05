const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const productColumns = [
  ["name", "tên dự án"],
  ["description", "mô tả"],
  ["team_code", "đội phụ trách"],
  ["partner_name", "đối tác"],
  ["main_server", "main server"],
  ["environment_type", "môi trường"],
  ["is_live", "trạng thái"],
];

const environmentTypes = {
  0: "Test",
  1: "Test UAT",
  2: "Product",
};

let allProductsData = [];

function productDetail(productId) {
  window.location.href = `./Detail/Detail.html?product_id=${productId}`;
}

async function fetchProduct() {
  const productBody = document.getElementById("product-body");
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: productData, error: productError } = await supabase
    .from("product")
    .select("*")
    .order("id", { ascending: false });

  if (productError) {
    console.error("Lỗi khi tải dữ liệu:", productError);
    return;
  }

  allProductsData = productData || [];

  if (allProductsData.length === 0) {
    productBody.innerHTML = `<tr><td colspan="${productColumns.length + 1}" style="text-align: center;">Không có sản phẩm nào cho đội này.</td></tr>`;
    return;
  }

  renderProducts(allProductsData);
}

function renderProducts(products) {
  const productBody = document.getElementById("product-body");

  if (!products || products.length === 0) {
    productBody.innerHTML = `<tr><td colspan="${productColumns.length + 1}" style="text-align: center;">Không tìm thấy sản phẩm phù hợp.</td></tr>`;
    return;
  }

  productBody.innerHTML = products
    .map(
      (product) => `
      <tr>
        ${productColumns
          .map(([column]) => {
            let value = product?.[column] ?? "";

            if (value === "")
              return `<td><i class="fa-solid fa-minus" aria-hidden="true"></i></td>`;

            if (column === "description") {
              value = value;
            }

            if (column === "is_live") {
              const statusClass =
                value === true ? "badge-active" : "badge-inactive";
              const statusText = value === true ? "Active" : "Inactive";
              value = `<span class="product-status ${statusClass}"><span class="status-dot"></span>${statusText}</span>`;
            }

            if (column === "environment_type") {
              value = `<span class="env-badge env-${value}">${environmentTypes[value]}</span>`;
            }

            return `<td>${value}</td>`;
          })
          .join("")}
          <td>
            <div class="product-table-button">
              <button class="product-row-button product-detail" onclick="productDetail(${product.id})">
                <i class="fa-solid fa-eye" aria-hidden="true"></i>
              </button>
              <button class="product-row-button product-update" onclick="openUpdateModal(${product.id})">
                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
              </button>
              <button class="product-row-button product-delete" onclick="deleteProduct(${product.id})">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </td>
      </tr>
    `,
    )
    .join("");
}

function RenderFilter() {
  const keyword = document
    .getElementById("product-search")
    .value.toLowerCase()
    .trim();
  const selectedStatus = document.getElementById("filter-status").value;
  const selectedEnvironment =
    document.getElementById("filter-environment").value;
  const selectedTeam = document.getElementById("filter-team").value;

  const filtered = allProductsData.filter((product) => {
    const name = String(product.name || "").toLowerCase();
    const matchKeyword = keyword === "" || name.includes(keyword);
    const matchStatus =
      selectedStatus === "" || String(product.is_live) === selectedStatus;
    const matchEnvironment =
      selectedEnvironment === "" ||
      String(product.environment_type) === selectedEnvironment;
    const matchTeam =
      selectedTeam === "" || String(product.team_code) === selectedTeam;

    return matchKeyword && matchStatus && matchEnvironment && matchTeam;
  });

  renderProducts(filtered);
}

async function deleteProduct(product_id) {
  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error: relationError } = await supabase
    .from("product_site")
    .delete()
    .eq("product_id", product_id);

  if (relationError) {
    alert(`Lỗi khi xóa liên kết sản phẩm: ${relationError.message}`);
    return;
  }

  const { error: productError } = await supabase
    .from("product")
    .delete()
    .eq("id", product_id);

  if (productError) {
    alert(`Lỗi khi xóa sản phẩm: ${productError.message}`);
    return;
  }

  fetchProduct();
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

async function addProduct() {
  const formData = {
    name: document.getElementById("product_name").value.trim(),
    project_code: document.getElementById("project_code").value.trim() || null,
    project_name: document.getElementById("project_name").value.trim() || null,
    team_code: document.getElementById("team_code").value,
    partner_name: document.getElementById("partner_name").value.trim() || null,
    environment_type: document.getElementById("environment_type").value,
    main_server: document.getElementById("main_server").value.trim() || null,
    is_live: document.getElementById("is_live").checked,
    description:
      document.getElementById("product_description").value.trim() || null,
  };

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await supabase.from("product").insert([formData]).select();

  if (error) {
    alert("Thêm Product thất bại!");
    return;
  }

  alert("Thêm Product thành công!");
  const form = document.getElementById("productForm");
  if (form) form.reset();
  closeModal("addProductModal");
  await fetchProduct();
}

async function openUpdateModal(product_id) {
  const modal = document.getElementById("updateProductModal");
  if (modal) {
    modal.style.display = "flex";
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const idsArray = Array.isArray(product_id) ? product_id : [product_id];

  const { data: productData, error: productError } = await supabase
    .from("product")
    .select("*")
    .in("id", idsArray)
    .order("id", { ascending: false });

  if (productError) {
    throw productError;
  }

  if (productData && productData.length > 0) {
    const product = productData[0];
    document.getElementById("update_product_id").value = product_id;
    document.getElementById("update_product_name").value = product.name || "";
    document.getElementById("update_partner_name").value =
      product.partner_name || "";
    document.getElementById("update_project_name").value =
      product.project_name || "";
    document.getElementById("update_project_code").value =
      product.project_code || "";
    document.getElementById("update_team_code").value = product.team_code || "";
    document.getElementById("update_environment_type").value =
      product.environment_type ?? "";
    document.getElementById("update_main_server").value =
      product.main_server || "";
    document.getElementById("update_is_live").checked = Boolean(
      product.is_live,
    );
    document.getElementById("update_product_description").value =
      product.description || "";
  } else {
    console.warn("Không tìm thấy dữ liệu cho ID:", product_id);
  }
}

async function updateProduct() {
  const product_id = document.getElementById("update_product_id").value;

  const formData = {
    name: document.getElementById("update_product_name").value,
    partner_name: document.getElementById("update_partner_name").value,
    project_name: document.getElementById("update_project_name").value,
    project_code: document.getElementById("update_project_code").value,
    team_code: document.getElementById("update_team_code").value,
    environment_type: document.getElementById("update_environment_type").value,
    main_server: document.getElementById("update_main_server").value,
    is_live: document.getElementById("update_is_live").checked,
    description: document.getElementById("update_product_description").value,
  };

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error: productError } = await supabase
    .from("product")
    .update([formData])
    .eq("id", product_id)
    .select();

  if (productError) {
    alert("Lỗi khi cập nhật sản phẩm: " + productError.message);
    return;
  }

  alert("Cập nhật thành công");

  fetchProduct();
  closeModal("updateProductModal");
}

const loginData = JSON.parse(localStorage.getItem("loginData") || "null");

async function logout() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await supabase.auth.signOut();
  localStorage.removeItem("loginData");
  window.location.href = "../../Login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const emailAvt = document.getElementById("user-email");
  emailAvt.innerHTML = loginData?.user?.email;
  fetchProduct();
});
