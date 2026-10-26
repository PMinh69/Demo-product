const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const productColumns = [
  ["name", "tên dự án"],
  ["description", "mô tả"],
  ["partner_name", "đối tác"],
  ["team_code", "đội phụ trách"],
];

function productDetail(productId) {
  window.location.href = `./Detail/Detail.html?product_id=${productId}`;
}

async function fetchProduct() {
  const productBody = document.getElementById("product-body");
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: productData, error: productError } = await supabase
    .from("product")
    .select("*");

  if (productError) {
    console.error("Lỗi khi tải dữ liệu:", productError);
    return;
  }

  productBody.innerHTML = productData
    .map(
      (product) => `
      <tr>
        ${productColumns
          .map(([column]) => {
            const value = product[column];
            const cellContent = value == null ? "" : value;
            return `<td>${cellContent}</td>`;
          })
          .join("")}
          <td>
            <div class="product-table-button">
              <button class="product-row-button product-detail" onclick="productDetail(${product.id})">
                <i class="fa-solid fa-eye" aria-hidden="true"></i>
              </button>
              <button class="product-row-button product-delete">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </td>
      </tr>
    `,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProduct();
});
