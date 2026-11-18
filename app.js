
const $ = id => document.getElementById(id);

const get = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const put = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

let currentUser = get("rvg_current", null);

function toast(message) {
  const t = $("toast");
  if (!t) return;
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === id);
  });

  $("navMenu")?.classList.add("hidden");

  if (id === "account") renderAccount();
  if (id === "admin") renderAdmin();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMenu() {
  $("navMenu")?.classList.toggle("hidden");
}

function users() {
  return get("rvg_users", []);
}

function registerUser(e) {
  e.preventDefault();

  const name = $("regName").value.trim();
  const mobile = $("regMobile").value.trim();
  const pass = $("regPass").value;

  if (users().some(u => u.mobile === mobile)) {
    return toast("Mobile already registered.");
  }

  const list = users();
  list.push({ name, mobile, pass });
  put("rvg_users", list);

  currentUser = { name, mobile };
  put("rvg_current", currentUser);

  e.target.reset();
  renderAccount();
  toast("Account created successfully.");
}

function loginUser(e) {
  e.preventDefault();

  const mobile = $("loginMobile").value.trim();
  const pass = $("loginPass").value;

  const user = users().find(
    u => u.mobile === mobile && u.pass === pass
  );

  if (!user) return toast("Incorrect login details.");

  currentUser = {
    name: user.name,
    mobile: user.mobile
  };

  put("rvg_current", currentUser);
  e.target.reset();
  renderAccount();
  toast("Welcome back!");
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("rvg_current");
  renderAccount();
  toast("Logged out.");
}

function renderAccount() {
  currentUser = get("rvg_current", null);

  const auth = $("authBox");
  const member = $("memberBox");

  if (!auth || !member) return;

  auth.classList.toggle("hidden", !!currentUser);
  member.classList.toggle("hidden", !currentUser);

  if (!currentUser) return;

  $("memberName").textContent = currentUser.name;
  $("memberMobile").textContent = currentUser.mobile;

  const requests = get("rvg_requests", []);
  const request = requests
    .filter(r => r.mobile === currentUser.mobile)
    .slice(-1)[0];

  $("memberStatus").textContent = request
    ? `₹${request.amount} — ${request.status}`
    : "No membership request submitted.";
}

function selectPlan(amount) {
  showPage("account");

  if (!currentUser) {
    toast("Please register or login first.");
    return;
  }

  $("paymentPlan").value = String(amount);
}

function submitPayment(e) {
  e.preventDefault();

  if (!currentUser) return toast("Please login first.");

  const amount = Number($("paymentPlan").value);
  const txn = $("txnId").value.trim();

  if (!amount || !txn) {
    return toast("Enter plan and transaction ID.");
  }

  const requests = get("rvg_requests", []);

  requests.push({
    id: Date.now(),
    name: currentUser.name,
    mobile: currentUser.mobile,
    amount,
    txn,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  put("rvg_requests", requests);

  e.target.reset();
  renderAccount();
  toast("Request submitted for review.");
}

function adminLogin(e) {
  e.preventDefault();

  if ($("adminPassword").value !== "RVGadmin2026") {
    return toast("Incorrect admin password.");
  }

  sessionStorage.setItem("rvg_admin", "yes");

  $("adminLogin").classList.add("hidden");
  $("adminPanel").classList.remove("hidden");

  renderAdmin();
}

function adminLogout() {
  sessionStorage.removeItem("rvg_admin");

  $("adminPanel").classList.add("hidden");
  $("adminLogin").classList.remove("hidden");
  $("adminPassword").value = "";
}

function renderAdmin() {
  const box = $("requestsList");
  if (!box) return;

  if (sessionStorage.getItem("rvg_admin") !== "yes") {
    $("adminLogin")?.classList.remove("hidden");
    $("adminPanel")?.classList.add("hidden");
    return;
  }

  $("adminLogin")?.classList.add("hidden");
  $("adminPanel")?.classList.remove("hidden");

  const requests = get("rvg_requests", []);
  box.innerHTML = "";

  if (!requests.length) {
    box.textContent = "No payment requests yet.";
    return;
  }

  requests.slice().reverse().forEach(request => {
    const item = document.createElement("div");
    item.className = "request";

    const title = document.createElement("b");
    title.textContent = `${request.name} — ₹${request.amount}`;

    const info = document.createElement("p");
    info.textContent =
      `Mobile: ${request.mobile} | Ref: ${request.txn}`;

    const status = document.createElement("p");
    status.textContent = request.status;

    item.append(title, info, status);

    if (request.status === "Pending") {
      ["Approve", "Reject"].forEach(action => {
        const button = document.createElement("button");

        button.className = "btn outline";
        button.textContent = action;

        button.onclick = () => {
          updateRequest(
            request.id,
            action === "Approve" ? "Approved" : "Rejected"
          );
        };

        item.append(button);
      });
    }

    box.append(item);
  });
}

function updateRequest(id, status) {
  const requests = get("rvg_requests", []);

  const request = requests.find(r => r.id === id);

  if (request) request.status = status;

  put("rvg_requests", requests);

  renderAdmin();
  toast("Request updated.");
}

let cardValue = 7;

function guessCard(direction) {
  const next = 1 + Math.floor(Math.random() * 13);

  const won = direction === "higher"
    ? next > cardValue
    : next < cardValue;

  const suits = ["♠", "♥", "♦", "♣"];

  $("practiceCard").innerHTML =
    `${next}<br><small>${suits[Math.floor(Math.random() * 4)]}</small>`;

  $("gameMessage").textContent =
    next === cardValue
      ? "Same card value!"
      : won
        ? "Correct guess! Well done."
        : "Try again!";

  cardValue = next;
}

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

renderAccount();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => console.log("SW error:", error));
  });
}
