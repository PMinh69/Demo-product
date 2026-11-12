const SUPABASE_URL = "https://mphfczktlajxwyspbmmt.supabase.co";
const SUPABASE_KEY = "sb_publishable_5O9Y_YcIkJ4zqIT8ShkxeQ_41Gkfq3I";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageElement = document.querySelector(".login-message");
const loginButton = document.getElementById("login-btn");

async function submitLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    messageElement.textContent = "Vui lòng nhập đầy đủ email và mật khẩu!";
    messageElement.style.color = "red";
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    messageElement.textContent = "Lỗi: " + error.message;
    messageElement.style.color = "red";
  } else {
    localStorage.setItem("loginData", JSON.stringify(data.user.email));

    messageElement.textContent = "Đăng nhập thành công!";
    messageElement.style.color = "green";

    setTimeout(() => {
      window.location.href = "./Content/Dashboard/Dashboard.html";
    }, 500);
  }
}