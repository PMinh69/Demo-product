function initAuthGuard() {
  const loginPage = location.pathname.endsWith("/Login.html");
  const loginData = localStorage.getItem("loginData");

  function isLoggedIn() {
    const data = JSON.parse(loginData);
    if (!data) return false;
    return true;
  }

  if (!loginPage && !isLoggedIn()) {
    const loginPath = location.pathname.includes("/Content/")
      ? "../../Login.html"
      : "./Login.html";

    location.replace(loginPath);
    return;
  }

  if (loginPage && isLoggedIn()) {
    location.replace("./Content/Dashboard/Dashboard.html");
    return;
  }

  document.getElementById("user-email").textContent = JSON.parse(loginData);
}

function validateRequired(inputId, message) {
  const input = document.getElementById(inputId);
  const errorElement = document.getElementById(`${inputId}-error`);
  function check() {
    const value = input.value.trim();

    errorElement.textContent = "";
    errorElement.style.display = "none";

    if (!value) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      return false;
    }

    return true;
  }
  input.addEventListener("input", check);
  input.addEventListener("change", check);
  return check();
}

async function validateDuplicate(inputId, supabase, table, column, id) {
  const input = document.getElementById(inputId);
  const errorElement = document.getElementById(`${inputId}-error`);

  async function check() {
    const value = input.value.trim();

    errorElement.textContent = "";
    errorElement.style.display = "none";

    if (!value) return false;

    try {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`);

      if (error) {
        errorElement.textContent = "Không thể kiểm tra dữ liệu!";
        errorElement.style.display = "block";
        return false;
      }

      const currentId = document.getElementById(id)?.value;

      const isDuplicate = data.some((item) => {
        if (currentId && String(item.id) === String(currentId)) {
          return false;
        }

        return item[column] === value;
      });

      if (isDuplicate) {
        errorElement.textContent = "Tên Product đã tồn tại!";
        errorElement.style.display = "block";
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      errorElement.textContent = "Đã xảy ra lỗi khi kiểm tra dữ liệu!";
      errorElement.style.display = "block";
      return false;
    }
  }

  input.addEventListener("input", check);
  input.addEventListener("change", check);

  return check();
}

document.addEventListener("DOMContentLoaded", initAuthGuard);
