const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

let currentPage = 1;
const itemsPerPage = 15;
let currentFilteredData = [];

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

const teamBadgeClasses = {
  team1: "product-team-1",
  team2: "product-team-2",
  team3: "product-team-3",
  team4: "product-team-4",
  mscscrum: "product-team-mscscrum",
};

function productDetail(productId) {
  window.location.href = `./Detail/Detail.html?product_id=${productId}`;
}

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

let allProductsData = [];
let productModalMode = "add";

async function fetchProduct() {
  try {
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
    renderProducts(allProductsData);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu:", error);
  }
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

            if (typeof value === "string" && value.trim() === "") {
              return `<td><span class="product-empty-value">Chưa cập nhật</span></td>`;
            }

            if (column === "name") {
              value = `<span class="product-name">${value}</span>`;
            } else if (column === "team_code") {
              const teamClass =
                teamBadgeClasses[String(value).trim().toLowerCase()] || "";
              value = `<span class="product-entity-tag ${teamClass}">${value}</span>`;
            } else if (column === "partner_name") {
              value = `<span class="product-entity-tag">${value}</span>`;
            } else if (column === "main_server") {
              value = `<span class="product-server">${value}</span>`;
            } else if (column === "is_live") {
              const statusClass =
                value === true ? "badge-active" : "badge-inactive";
              const statusText = value === true ? "Active" : "Inactive";
              value = `<span class="product-status ${statusClass}"><span class="status-dot"></span>${statusText}</span>`;
            } else if (column === "environment_type") {
              value = `<span class="env-badge env-${value}">${environmentTypes[value] ?? value}</span>`;
            } else {
              value = value;
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
              <button class="product-row-button product-delete" onclick="openDeleteModal(${product.id})">
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
  const keyword = removeAccents(document
    .getElementById("product-search")
    .value.toLowerCase()
    .trim());
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

function openDeleteModal(productId) {
  document.getElementById("delete_product_id").value = productId;
  openModal("deleteProductModal");
}

async function confirmDeleteProduct() {
  const productId = document.getElementById("delete_product_id").value;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error: relationError } = await supabase
    .from("product_site")
    .delete()
    .eq("product_id", productId);

  if (relationError) {
    alert(`Lỗi khi xóa liên kết sản phẩm: ${relationError.message}`);
    return;
  }

  const { error: productError } = await supabase
    .from("product")
    .delete()
    .eq("id", productId);

  if (productError) {
    alert(`Lỗi khi xóa sản phẩm: ${productError.message}`);
    return;
  }

  closeModal("deleteProductModal");
  fetchProduct();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "flex";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = "none";
}

function openProductModal(mode) {
  const form = document.getElementById("productForm");
  form.reset();
  document.getElementById("product_id").value = "";
  productModalMode = mode;
  document.getElementById("modal-title").textContent =
    mode === "add" ? "Thêm sản phẩm" : "Cập nhật sản phẩm";
  openModal("productModal");
}

function submitProduct() {
  if (productModalMode === "add") {
    addProduct();
  } else {
    updateProduct();
  }
}

async function addProduct() {
  const formData = {
    name: removeAccents(document.getElementById("product_name").value.trim()),
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
  closeModal("productModal");
  await fetchProduct();
}

async function openUpdateModal(product_id) {
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
    openProductModal("update");
    document.getElementById("product_id").value = product.id;
    document.getElementById("product_name").value = product.name || "";
    document.getElementById("partner_name").value = product.partner_name || "";
    document.getElementById("project_name").value = product.project_name || "";
    document.getElementById("project_code").value = product.project_code || "";
    document.getElementById("team_code").value = product.team_code || "";
    document.getElementById("environment_type").value =
      product.environment_type ?? "";
    document.getElementById("main_server").value = product.main_server || "";
    document.getElementById("is_live").checked = Boolean(product.is_live);
    document.getElementById("product_description").value =
      product.description || "";
  } else {
    console.warn("Không tìm thấy dữ liệu cho ID:", product_id);
  }
}

async function updateProduct() {
  const product_id = document.getElementById("product_id").value;

  const formData = {
    name: document.getElementById("product_name").value,
    partner_name: document.getElementById("partner_name").value,
    project_name: document.getElementById("project_name").value,
    project_code: document.getElementById("project_code").value,
    team_code: document.getElementById("team_code").value,
    environment_type: document.getElementById("environment_type").value,
    main_server: document.getElementById("main_server").value,
    is_live: document.getElementById("is_live").checked,
    description: document.getElementById("product_description").value,
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
  closeModal("productModal");
}

async function logout() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await supabase.auth.signOut();
  localStorage.removeItem("loginData");
  window.location.href = "../../Login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProduct();
});
