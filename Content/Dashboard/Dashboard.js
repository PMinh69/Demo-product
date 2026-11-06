const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const loginData = JSON.parse(localStorage.getItem("loginData") || "null");

async function count() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const [
    { count: productCount, error: productError },
    { count: activeCount, error: activeError },
    { count: siteCount, error: siteError },
  ] = await Promise.all([
    supabase.from("product").select("id", { count: "exact", head: true }),
    supabase
      .from("product")
      .select("id", { count: "exact", head: true })
      .eq("is_live", true),
    supabase.from("site").select("id", { count: "exact", head: true }),
  ]);

  if (productError || activeError || siteError) {
    console.error("Lỗi khi tải thống kê dashboard:", {
      productError,
      activeError,
      siteError,
    });
    return;
  }

  document.getElementById("total-products").textContent = productCount;
  document.getElementById("total-active-products").textContent = activeCount;
  document.getElementById("total-sites").textContent = siteCount;
}

async function logout() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await supabase.auth.signOut();
  localStorage.removeItem("loginData");
  window.location.href = "../../Login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const emailAvt = document.getElementById("user-email");
  emailAvt.innerHTML = loginData?.user?.email;
  count();
});
