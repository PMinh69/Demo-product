const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

async function fetchTeam() {
  const teamContainer = document.getElementById("team-grid");
  const teams = window.teamData;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from("product")
    .select("team_code, is_live");

  if (error) {
    console.error("Lỗi khi tải dữ liệu team:", error);
    teamContainer.innerHTML =
      '<p class="team-error">Không thể tải dữ liệu sản phẩm.</p>';
    return;
  }

  let htmlContent = "";

  teams.forEach((team) => {
    const teamProducts = data.filter(
      (product) => product.team_code === team.code,
    );
    const totalProducts = teamProducts.length;
    const activeProducts = teamProducts.filter(
      (product) => product.is_live === true,
    ).length;
    const inactiveProducts = totalProducts - activeProducts;

    htmlContent += `
        <div class="team-card">
          <div>
            <div class="team-card-header">
              <div class="team-header-left">
                <div class="team-icon">
                  <i class="fa-solid fa-users-gear"></i>
                </div>
                <span class="team-code-badge">${team.code}</span>
              </div>
            </div>

            <div class="team-info">
              <h2 class="team-name">${team.name}</h2>
              <p class="team-desc">${team.description}</p>
            </div>
          </div>

          <!-- Khối hiển thị số lượng sản phẩm & Active/Inactive -->
          <div class="team-stats">
            <div class="stat-main">
              <span class="stat-number">${totalProducts}</span>
              <span class="stat-label">Sản phẩm</span>
            </div>
            <div class="stat-pills">
              <span class="pill-active">${activeProducts} Active</span>
              <span class="pill-inactive">${inactiveProducts} Inactive</span>
            </div>
          </div>

          <div class="team-actions">
            <button class="team-detail" onclick="viewDetail('${team.code}')">
              <i class="fa-regular fa-eye"></i> Chi tiết
            </button>
            <button class="team-button team-update" title="Sửa" onclick="updateTeam('${team.code}')">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="team-button team-delete" title="Xóa" onclick="deleteTeam('${team.code}')">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
  });

  htmlContent += `
      <div class="add-team-card" onclick="addNewTeam()">
        <div class="add-icon-btn">
          <i class="fa-solid fa-plus"></i>
        </div>
        <h3 style="font-size: 1rem; color: #f8fafc; margin-bottom: 6px;">Thêm Team Kỹ Thuật Mới</h3>
      </div>
    `;

  teamContainer.innerHTML = htmlContent;
}

function viewDetail(code) {
  window.location.href = `../Product/Product.html?team=${encodeURIComponent(code)}`;
}

function updateTeam(code) {
  console.log("Sửa team:", code);
}

function deleteTeam(code) {
  console.log("Xóa team:", code);
}

function addNewTeam() {
  console.log("Thêm team mới");
}

document.addEventListener("DOMContentLoaded", () => {
  fetchTeam();
});
