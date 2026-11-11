function initAuthGuard() {
  const loginPage = location.pathname.endsWith("/Login.html");
  const loginData = localStorage.getItem("loginData");

  function getParsedData() {
    if (!loginData) return null;

    try {
      return JSON.parse(loginData);
    } catch {
      return loginData;
    }
  }

  function isLoggedIn() {
    const data = getParsedData();
    if (!data) return false;
    return typeof data === "string"
      ? data.trim().length > 0
      : Boolean(data.email || data?.user?.email);
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

  const emailElement = document.getElementById("user-email");
  if (emailElement) {
    const data = getParsedData();
    emailElement.textContent =
      typeof data === "string" ? data : data.email || data?.user?.email || "";
  }
}

document.addEventListener("DOMContentLoaded", initAuthGuard);
