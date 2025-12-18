// Central config for API base URL – backend is Node/Express on port 5000
const API_BASE_URL = "http://localhost:5000";

// Key names for storage
const STORAGE_KEYS = {
  token: "resumeapp_token",
  user: "resumeapp_user",
};

// --- Storage helpers ---
function saveAuth({ token, user }) {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }
  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }
}

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

// --- Simple router helpers ---
function goTo(path) {
  window.location.href = path;
}

function redirectByRole(role) {
  if (role === "recruiter") {
    goTo("recruiter-dashboard.html");
  } else {
    goTo("user-dashboard.html");
  }
}

// --- Fetch wrapper with auth & error handling ---
async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (!token) {
      handleUnauthorized();
      throw new Error("Not authenticated");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore non-JSON response
  }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || "Request failed";
    throw new Error(message);
  }

  return data;
}

function handleUnauthorized() {
  clearAuth();
  alert("Your session has expired. Please log in again.");
  goTo("login.html");
}

// --- Status helpers (loading / error / success) ---
function setStatus(id, { type, message }) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.className = `status ${type || ""}`;
  if (!message) {
    el.style.display = "none";
  } else {
    el.style.display = "flex";
  }
}

// --- Auth Page Logic ---
function initSignupPage() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const role = form.role.value;

    if (!name || !email || !password) {
      setStatus("signup-status", {
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("signup-status", {
        type: "error",
        message: "Enter a valid email address.",
      });
      return;
    }

    if (password.length < 6) {
      setStatus("signup-status", {
        type: "error",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    setStatus("signup-status", {
      type: "loading",
      message: "Creating your account…",
    });

    try {
      await apiRequest("/auth/signup", {
        method: "POST",
        body: { name, email, password, role },
      });
      setStatus("signup-status", {
        type: "success",
        message: "Signup successful. Redirecting to login…",
      });
      setTimeout(() => goTo("login.html"), 900);
    } catch (err) {
      setStatus("signup-status", {
        type: "error",
        message: err.message || "Signup failed.",
      });
    }
  });
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      setStatus("login-status", {
        type: "error",
        message: "Email and password are required.",
      });
      return;
    }

    setStatus("login-status", {
      type: "loading",
      message: "Signing you in…",
    });

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // Expect backend to return: { access_token, user: { id, name, email, role } }
      saveAuth({
        token: data.access_token,
        user: data.user,
      });

      setStatus("login-status", {
        type: "success",
        message: "Login successful. Redirecting…",
      });

      redirectByRole(data.user.role);
    } catch (err) {
      setStatus("login-status", {
        type: "error",
        message: err.message || "Login failed.",
      });
    }
  });
}

// --- Guards & logout ---
function requireAuth(expectedRole) {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) {
    handleUnauthorized();
    return null;
  }

  if (expectedRole && user.role !== expectedRole) {
    alert("You don't have access to this page.");
    redirectByRole(user.role);
    return null;
  }

  return user;
}

function initLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearAuth();
      goTo("login.html");
    });
  });
}

// --- Candidate Dashboard Logic ---
async function loadOwnResume() {
  const container = document.getElementById("candidate-resume-view");
  if (!container) return;

  container.innerHTML = "<p class='meta'>Loading your resume…</p>";

  try {
    const data = await apiRequest("/candidate/resume", { auth: true });
    if (!data) {
      container.innerHTML =
        "<p class='meta'>You haven't added a resume yet. Use the form on the right to create one.</p>";
      return;
    }

    container.innerHTML = renderResumeCard(data);

    // Populate form for editing
    const form = document.getElementById("candidate-resume-form");
    if (form) {
      form.resumeId.value = data.id || "";
      form.name.value = data.name || "";
      form.email.value = data.email || "";
      form.role.value = data.role || "";
      form.experience.value = data.experience || "Fresher";
      form.skills.value = (data.skills || []).join(", ");
      form.projects.value = data.projects || "";
      form.resume_text.value = data.resume_text || "";
    }
  } catch (err) {
    container.innerHTML = `<p class="status error">Failed to load resume: ${err.message}</p>`;
  }
}

function renderResumeCard(resume) {
  const skills = Array.isArray(resume.skills)
    ? resume.skills
    : typeof resume.skills === "string"
    ? resume.skills.split(",").map((s) => s.trim())
    : [];

  const experience = (resume.experience || "").toLowerCase();
  const expClass =
    experience === "experienced" ? "exp-experienced" : "exp-fresher";

  return `
    <div class="resume-card fade-in">
      <div class="resume-header-row">
        <div>
          <div class="resume-name">${resume.name || "-"}</div>
          <div class="resume-role">${resume.role || ""}</div>
          <div class="resume-meta mt-2">
            <span class="tag ${expClass}">${resume.experience || "Fresher"}</span>
            <span class="tag pill-soft text-xs">${resume.email || ""}</span>
          </div>
        </div>
      </div>
      <hr class="divider" />
      <div>
        <div class="resume-section-label">Skills</div>
        ${
          skills.length
            ? `<div class="skills-row">${skills
                .filter(Boolean)
                .map(
                  (s) =>
                    `<span class="skill-pill">${escapeHtml(
                      s
                    )}</span>`
                )
                .join("")}</div>`
            : '<p class="meta">No skills listed yet.</p>'
        }
      </div>
      <div class="mt-3">
        <div class="resume-section-label">Projects</div>
        <p class="resume-body">${
          resume.projects
            ? escapeHtml(resume.projects)
            : "<span class='meta'>No projects added yet.</span>"
        }</p>
      </div>
      <div class="mt-3">
        <div class="resume-section-label">Resume</div>
        <p class="resume-body">${
          resume.resume_text
            ? escapeHtml(resume.resume_text)
            : "<span class='meta'>No resume text yet.</span>"
        }</p>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initCandidateDashboard() {
  const user = requireAuth("candidate");
  if (!user) return;

  const userNameEl = document.getElementById("current-user-name");
  if (userNameEl) userNameEl.textContent = user.name || user.email;

  initLogoutButtons();
  loadOwnResume();

  const form = document.getElementById("candidate-resume-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      role: form.role.value.trim(),
      experience: form.experience.value,
      skills: form.skills.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      projects: form.projects.value.trim(),
      resume_text: form.resume_text.value.trim(),
    };

    if (!payload.name || !payload.email || !payload.role) {
      setStatus("candidate-status", {
        type: "error",
        message: "Name, email and role are required.",
      });
      return;
    }

    const resumeId = form.resumeId.value;
    const isUpdate = Boolean(resumeId);

    setStatus("candidate-status", {
      type: "loading",
      message: isUpdate ? "Updating resume…" : "Creating resume…",
    });

    try {
      const path = isUpdate
        ? `/candidate/resume/${encodeURIComponent(resumeId)}`
        : "/candidate/resume";

      await apiRequest(path, {
        method: isUpdate ? "PUT" : "POST",
        body: payload,
        auth: true,
      });

      setStatus("candidate-status", {
        type: "success",
        message: "Resume saved.",
      });

      loadOwnResume();
    } catch (err) {
      setStatus("candidate-status", {
        type: "error",
        message: err.message || "Failed to save resume.",
      });
    }
  });

  const deleteBtn = document.getElementById("candidate-delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const form = document.getElementById("candidate-resume-form");
      if (!form || !form.resumeId.value) {
        setStatus("candidate-status", {
          type: "error",
          message: "No resume to delete.",
        });
        return;
      }

      if (!confirm("Delete your resume? This action cannot be undone.")) {
        return;
      }

      setStatus("candidate-status", {
        type: "loading",
        message: "Deleting resume…",
      });

      try {
        const resumeId = form.resumeId.value;
        await apiRequest(
          `/candidate/resume/${encodeURIComponent(resumeId)}`,
          {
            method: "DELETE",
            auth: true,
          }
        );

        form.reset();
        form.resumeId.value = "";

        setStatus("candidate-status", {
          type: "success",
          message: "Resume deleted.",
        });

        loadOwnResume();
      } catch (err) {
        setStatus("candidate-status", {
          type: "error",
          message: err.message || "Failed to delete resume.",
        });
      }
    });
  }
}

// --- Recruiter Dashboard Logic ---
let recruiterState = {
  page: 1,
  pageSize: 5,
  lastQuery: "",
  lastFilters: {},
};

async function executeSearch() {
  const list = document.getElementById("results-list");
  if (!list) return;

  const searchInput = document.getElementById("search-query");
  const skillsInput = document.getElementById("filter-skills");
  const roleInput = document.getElementById("filter-role");
  const experienceInput = document.getElementById("filter-experience");

  const query = (searchInput?.value || "").trim();
  const filters = {
    skills: (skillsInput?.value || "").trim(),
    role: roleInput?.value || "",
    experience: experienceInput?.value || "",
  };

  recruiterState.lastQuery = query;
  recruiterState.lastFilters = filters;

  list.innerHTML = "<p class='meta'>Searching candidates…</p>";

  try {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (filters.skills) params.append("skills", filters.skills);
    if (filters.role) params.append("role", filters.role);
    if (filters.experience) params.append("experience", filters.experience);
    params.append("page", recruiterState.page.toString());
    params.append("page_size", recruiterState.pageSize.toString());

    const data = await apiRequest(
      `/recruiter/search?${params.toString()}`,
      { auth: true }
    );

    renderSearchResults(data);
  } catch (err) {
    list.innerHTML = `<p class="status error">Search failed: ${err.message}</p>`;
  }
}

function highlightKeywords(text, keywords) {
  if (!text || !keywords || !keywords.length) return escapeHtml(text || "");

  let escaped = escapeHtml(text);
  keywords.forEach((k) => {
    if (!k) return;
    const pattern = new RegExp(`(${escapeRegExp(k)})`, "gi");
    escaped = escaped.replace(
      pattern,
      '<span class="keyword-highlight">$1</span>'
    );
  });
  return escaped;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderSearchResults(data) {
  const list = document.getElementById("results-list");
  const paginationInfo = document.getElementById("pagination-info");
  const query = recruiterState.lastQuery;
  const keywords = query ? query.split(/\s+/).filter(Boolean) : [];

  if (!Array.isArray(data.items) || !data.items.length) {
    list.innerHTML =
      '<div class="results-empty">No matching candidates yet. Try widening your filters.</div>';
    if (paginationInfo) paginationInfo.textContent = "";
    return;
  }

  list.innerHTML = data.items
    .map((resume) => {
      const skills = Array.isArray(resume.skills)
        ? resume.skills
        : typeof resume.skills === "string"
        ? resume.skills.split(",").map((s) => s.trim())
        : [];

      const experience = (resume.experience || "").toLowerCase();
      const expClass =
        experience === "experienced" ? "exp-experienced" : "exp-fresher";

      const skillsHtml = skills
        .filter(Boolean)
        .map(
          (s) => `<span class="skill-pill">${highlightKeywords(s, keywords)}</span>`
        )
        .join("");

      return `
        <div class="results-item clickable" data-resume='${encodeURIComponent(
          JSON.stringify(resume)
        )}'>
          <div class="results-header">
            <div>
              <div class="results-name">${highlightKeywords(
                resume.name || "",
                keywords
              )}</div>
              <div class="results-role">${highlightKeywords(
                resume.role || "",
                keywords
              )}</div>
              <div class="resume-meta mt-1">
                <span class="tag ${expClass}">${resume.experience ||
        "Fresher"}</span>
                <span class="tag pill-soft text-xs">${
                  resume.email || ""
                }</span>
              </div>
            </div>
            <div class="text-right text-xs muted">
              <div>Projects</div>
              <div class="truncate" style="max-width: 220px;">
                ${highlightKeywords(
                  resume.projects || "",
                  keywords
                )}
              </div>
            </div>
          </div>
          <div class="mt-2">
            <div class="resume-section-label">Skills</div>
            ${
              skillsHtml ||
              '<span class="meta">No skills listed.</span>'
            }
          </div>
        </div>
      `;
    })
    .join("");

  // Attach click handlers for resume details modal
  list.querySelectorAll(".results-item").forEach((item) => {
    item.addEventListener("click", () => {
      const encoded = item.getAttribute("data-resume");
      if (!encoded) return;
      const resume = JSON.parse(decodeURIComponent(encoded));
      openResumeModal(resume, keywords);
    });
  });

  if (paginationInfo) {
    const start = (data.page - 1) * data.page_size + 1;
    const end = start + data.items.length - 1;
    paginationInfo.textContent = `Showing ${start}-${end} of ${data.total}`;
  }
}

function openResumeModal(resume, keywords) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop fade-in";

  const bodyHtml = `
    <div class="resume-card">
      <div class="resume-header-row">
        <div>
          <div class="resume-name">${highlightKeywords(
            resume.name || "",
            keywords
          )}</div>
          <div class="resume-role">${highlightKeywords(
            resume.role || "",
            keywords
          )}</div>
          <div class="resume-meta mt-2">
            <span class="tag ${
              (resume.experience || "").toLowerCase() === "experienced"
                ? "exp-experienced"
                : "exp-fresher"
            }">${resume.experience || "Fresher"}</span>
            <span class="tag pill-soft text-xs">${resume.email || ""}</span>
          </div>
        </div>
      </div>
      <hr class="divider" />
      <div>
        <div class="resume-section-label">Skills</div>
        ${
          resume.skills && resume.skills.length
            ? `<div class="skills-row">${
                (Array.isArray(resume.skills)
                  ? resume.skills
                  : String(resume.skills)
                      .split(",")
                      .map((s) => s.trim())
                )
                  .filter(Boolean)
                  .map(
                    (s) =>
                      `<span class="skill-pill">${highlightKeywords(
                        s,
                        keywords
                      )}</span>`
                  )
                  .join("")
              }</div>`
            : '<p class="meta">No skills listed.</p>'
        }
      </div>
      <div class="mt-3">
        <div class="resume-section-label">Projects</div>
        <p class="resume-body">${highlightKeywords(
          resume.projects || "",
          keywords
        )}</p>
      </div>
      <div class="mt-3">
        <div class="resume-section-label">Resume</div>
        <p class="resume-body">${highlightKeywords(
          resume.resume_text || "",
          keywords
        )}</p>
      </div>
    </div>
  `;

  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div>
          <div class="modal-title">Candidate Resume</div>
          <div class="meta mt-1">Read-only snapshot of the candidate profile.</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="modal-close-btn">Close</button>
      </div>
      <div class="modal-body no-scrollbar">
        ${bodyHtml}
      </div>
      <div class="modal-footer">
        <span class="meta">Use highlighted text to quickly scan for your search terms.</span>
      </div>
    </div>
  `;

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      document.body.removeChild(backdrop);
    }
  });

  backdrop
    .querySelector("#modal-close-btn")
    .addEventListener("click", () => {
      document.body.removeChild(backdrop);
    });

  document.body.appendChild(backdrop);
}

function initRecruiterDashboard() {
  const user = requireAuth("recruiter");
  if (!user) return;

  const userNameEl = document.getElementById("current-user-name");
  if (userNameEl) userNameEl.textContent = user.name || user.email;

  initLogoutButtons();

  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-query");
  const filters = [
    document.getElementById("filter-skills"),
    document.getElementById("filter-role"),
    document.getElementById("filter-experience"),
  ];

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      recruiterState.page = 1;
      executeSearch();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        recruiterState.page = 1;
        executeSearch();
      }
    });
  }

  filters.forEach((input) => {
    if (!input) return;
    input.addEventListener("change", () => {
      recruiterState.page = 1;
      executeSearch();
    });
  });

  const prevBtn = document.getElementById("pagination-prev");
  const nextBtn = document.getElementById("pagination-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (recruiterState.page > 1) {
        recruiterState.page -= 1;
        executeSearch();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      recruiterState.page += 1;
      executeSearch();
    });
  }

  // initial load (empty query)
  executeSearch();
}

// --- Page bootstrap ---
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  switch (page) {
    case "signup":
      initSignupPage();
      break;
    case "login":
      initLoginPage();
      break;
    case "candidate-dashboard":
      initCandidateDashboard();
      break;
    case "recruiter-dashboard":
      initRecruiterDashboard();
      break;
    default:
      break;
  }
});


