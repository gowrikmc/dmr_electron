window.addEventListener("DOMContentLoaded", async () => {
  // Load units dropdown
  const unitSelect = document.getElementById("unit");
  try {
    const units = await window.api.fetchUnits();
    unitSelect.textContent = units;
  } catch (err) {
    console.error("Failed to load units:", err);
  }

  // Login form
  const loginForm = document.getElementById("login-form");
  const submitBtn = document.getElementById("submit-btn");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username-input").value.trim();
    const password = document.getElementById("password-input").value.trim();
    const selectedUnit = document.getElementById("unit").textContent.trim();

    if (!username || !password) {
      showError("Please enter both username and password.");
      return;
    }

    // Disable button and show spinner
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    try {
      const result = await window.api.login(username, password);

      if (result.success) {
        sessionStorage.setItem("role", result.role);
        sessionStorage.setItem("unit", selectedUnit);
        sessionStorage.setItem("username", username);
        window.location.href = "dashboard.html";
      } else {
        showError("Invalid username or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("Something went wrong. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  }); 
});

 document.getElementById("toggle-password").addEventListener("click", function() {
        const inp = document.getElementById("password-input");
        inp.type = inp.type === "password" ? "text" : "password";
        this.textContent = inp.type === "password" ? "👁" : "🙈";
      });

function showError(msg) {
  const el = document.getElementById("login-error");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}
