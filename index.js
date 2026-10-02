const API_URL = "http://localhost:3000/jobs";
const JOBS_KEY = "fundi.jobs.v1";
const SESSION_KEY = "fundi.session.v1";

const seedJobs = [
  { id: "sample-painter", title: "House painter needed", category: "Skilled trades", location: "Kilimani, Nairobi", pay: "2500", phone: "0712 345 678", description: "Two-bedroom apartment. Bring your own brushes if possible." },
  { id: "sample-cleaner", title: "Part-time home cleaner", category: "Cleaning", location: "South B, Nairobi", pay: "1200", phone: "0722 456 789", description: "Three mornings a week. References are welcome." },
  { id: "sample-driver", title: "Delivery driver", category: "Driving", location: "Westlands, Nairobi", pay: "1800", phone: "0701 234 567", description: "Same-day deliveries. Valid driving licence required." },
  { id: "sample-cook", title: "Weekend kitchen assistant", category: "Hospitality", location: "Thika Road, Nairobi", pay: "1500", phone: "0790 123 456", description: "Help with food preparation at a busy local cafe." },
  { id: "sample-electrician", title: "Assistant electrician", category: "Skilled trades", location: "Rongai", pay: "2000", phone: "0744 567 890", description: "Assist with a residential wiring project. Experience preferred." }
];

const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const jobForm = document.getElementById("jobForm");
const jobList = document.getElementById("jobList");
const activityList = document.getElementById("activityList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const emptyState = document.getElementById("emptyState");
const activityEmpty = document.getElementById("activityEmpty");
const dashboardMessage = document.getElementById("dashboardMessage");
const postMessage = document.getElementById("postMessage");
const storageStatus = document.getElementById("storageStatus");
const notificationButton = document.getElementById("notificationButton");
const notificationBadge = document.getElementById("notificationBadge");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const notificationEmpty = document.getElementById("notificationEmpty");

let currentUser = null;
let jobs = [];
let apiAvailable = false;

function inferCategory(title) {
  const value = title.toLowerCase();
  if (/clean|maid|housekeep/.test(value)) return "Cleaning";
  if (/driver|driv|delivery|conductor/.test(value)) return "Driving";
  if (/cook|waiter|hotel|kitchen|cater/.test(value)) return "Hospitality";
  if (/paint|electric|plumb|build|mason|carpenter|mechanic|fundi/.test(value)) return "Skilled trades";
  return "Other";
}

function normalizeJob(job) {
  return {
    ...job,
    id: String(job.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    title: String(job.title || "Untitled job"),
    category: job.category || inferCategory(job.title || ""),
    location: String(job.location || "Location not listed"),
    pay: String(job.pay || "0"),
    phone: String(job.phone || ""),
    description: String(job.description || ""),
    applications: Array.isArray(job.applications)
      ? job.applications.filter((application) => application && application.email).map((application) => ({
        ...application,
        email: String(application.email)
      }))
      : []
  };
}

function readStoredJobs() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
    return Array.isArray(stored) ? stored.map(normalizeJob) : [];
  } catch {
    return [];
  }
}

function saveJobs() {
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch {
    storageStatus.textContent = "This browser could not save job changes";
  }
}

async function loadJobs() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Job service is unavailable");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Job service returned invalid data");
    jobs = data.map(normalizeJob);
    apiAvailable = true;
    storageStatus.textContent = "Connected to jobs server";
  } catch {
    const cachedJobs = readStoredJobs();
    jobs = cachedJobs.length ? cachedJobs : seedJobs.map(normalizeJob);
    apiAvailable = false;
    storageStatus.textContent = cachedJobs.length ? "Saved on this device" : "Offline demo jobs";
  }
  saveJobs();
  renderAll();
}

function getUserFromSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function showDashboard() {
  authScreen.hidden = true;
  appShell.hidden = false;
  document.getElementById("userEmail").textContent = currentUser.email;
  document.getElementById("userAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  loadJobs();
}

function showLogin() {
  currentUser = null;
  sessionStorage.removeItem(SESSION_KEY);
  appShell.hidden = true;
  authScreen.hidden = false;
  notificationPanel.hidden = true;
  notificationButton.setAttribute("aria-expanded", "false");
  dashboardMessage.textContent = "";
  postMessage.textContent = "";
  loginForm.reset();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  if (!email || password.length < 6) {
    loginError.textContent = "Enter a valid email and a password with at least 6 characters.";
    return;
  }

  const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  currentUser = { email, name: name || "Fundi member" };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  loginError.textContent = "";
  showDashboard();
});

function setView(viewName) {
  const views = { find: "findView", post: "postView", activity: "activityView" };
  if (!views[viewName]) return;
  Object.entries(views).forEach(([name, id]) => {
    document.getElementById(id).hidden = name !== viewName;
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });
  const labels = { find: "Find work", post: "Post a job", activity: "My activity" };
  document.getElementById("breadcrumbCurrent").textContent = labels[viewName];
  if (viewName === "activity") renderActivity();
  if (viewName === "find") renderJobs();
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});
document.querySelectorAll("[data-go-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.goView));
});
document.getElementById("logoutButton").addEventListener("click", showLogin);
searchInput.addEventListener("input", renderJobs);
categoryFilter.addEventListener("change", renderJobs);

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createJobCard(job, activity = false) {
  const card = makeElement("article", "job-card");
  const top = makeElement("div", "job-card-top");
  const applications = job.applications || [];
  const isOwner = job.postedBy === currentUser.email;
  const hasApplied = applications.some((application) => application.email === currentUser.email);
  top.append(makeElement("span", "category-tag", job.category));
  const state = activity
    ? (isOwner ? `${applications.length} interested` : "Your interest sent")
    : (isOwner ? "Your listing" : hasApplied ? "Interest sent" : `${applications.length} interested`);
  top.append(makeElement("span", "job-state", state));

  card.append(top, makeElement("h3", "job-title", job.title));
  if (job.description) card.append(makeElement("p", "job-description", job.description));

  const details = makeElement("div", "job-details");
  details.append(
    makeElement("span", "job-location", job.location),
    makeElement("strong", "job-pay", `KES ${Number(job.pay).toLocaleString("en-KE")}`)
  );
  card.append(details);

  const footer = makeElement("div", "job-card-footer");
  if (job.phone) {
    const phoneLink = makeElement("a", "contact-link", "Call employer");
    phoneLink.href = `tel:${job.phone.replace(/[^\d+]/g, "")}`;
    footer.append(phoneLink);
  } else {
    footer.append(makeElement("span", "contact-link contact-unavailable", "No phone listed"));
  }

  if (!activity) {
    const interestButton = makeElement("button", "button button-small button-primary", isOwner ? "Your listing" : hasApplied ? "Interest sent" : "I'm interested");
    interestButton.type = "button";
    interestButton.disabled = isOwner || hasApplied;
    if (!isOwner && !hasApplied) {
      interestButton.dataset.action = "apply";
      interestButton.dataset.id = job.id;
    }
    footer.append(interestButton);
  }
  card.append(footer);
  return card;
}

function renderJobs() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const visibleJobs = jobs.filter((job) => {
    const searchable = `${job.title} ${job.location} ${job.description} ${job.category}`.toLowerCase();
    return searchable.includes(query) && (category === "all" || job.category === category);
  });

  jobList.replaceChildren(...visibleJobs.map((job) => createJobCard(job)));
  document.getElementById("resultsLabel").textContent = `${visibleJobs.length} ${visibleJobs.length === 1 ? "job" : "jobs"}`;
  emptyState.hidden = visibleJobs.length > 0;
  document.getElementById("emptyTitle").textContent = jobs.length ? "No matching jobs" : "No jobs here yet";
  document.getElementById("emptyCopy").textContent = jobs.length ? "Try a different search or category." : "Check back soon, or post an opportunity for someone else.";
}

function renderActivity() {
  const activityJobs = jobs.filter((job) => job.postedBy === currentUser.email || job.applications.some((application) => application.email === currentUser.email));
  activityList.replaceChildren(...activityJobs.map((job) => createJobCard(job, true)));
  activityEmpty.hidden = activityJobs.length > 0;
}

function renderAll() {
  document.getElementById("availableCount").textContent = jobs.length;
  document.getElementById("interestedCount").textContent = jobs.reduce((count, job) => count + job.applications.length, 0);
  document.getElementById("postedCount").textContent = jobs.filter((job) => job.postedBy === currentUser.email).length;
  renderJobs();
  renderActivity();
  renderNotifications();
}

function showDashboardMessage(message) {
  dashboardMessage.textContent = message;
  window.setTimeout(() => {
    if (dashboardMessage.textContent === message) dashboardMessage.textContent = "";
  }, 5000);
}

function employerNotifications() {
  return jobs.flatMap((job) => (job.postedBy === currentUser.email ? job.applications : [])
    .filter((application) => application.email !== currentUser.email)
    .map((application) => ({
      ...application,
      jobId: job.id,
      jobTitle: job.title,
      notificationId: `${job.id}:${application.email}`
    })))
    .sort((left, right) => Date.parse(right.appliedAt || 0) - Date.parse(left.appliedAt || 0));
}

function readNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem(`fundi.notifications.read:${encodeURIComponent(currentUser.email)}`) || "[]");
  } catch {
    return [];
  }
}

function renderNotifications() {
  const notifications = employerNotifications();
  const readIds = new Set(readNotificationIds());
  const unreadCount = notifications.filter((notification) => !readIds.has(notification.notificationId)).length;

  notificationBadge.hidden = unreadCount === 0;
  notificationBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  notificationButton.setAttribute("aria-label", unreadCount ? `Notifications, ${unreadCount} new` : "Notifications");
  document.getElementById("notificationCount").textContent = unreadCount ? `${unreadCount} new` : `${notifications.length} total`;
  notificationEmpty.hidden = notifications.length > 0;
  notificationList.replaceChildren(...notifications.map((notification) => {
    const item = makeElement("button", "notification-item");
    item.type = "button";
    item.dataset.jobId = notification.jobId;
    const applicantName = notification.name || notification.email.split("@")[0];
    item.append(makeElement("span", "notification-message", `${applicantName} is interested in ${notification.jobTitle}`));
    const timestamp = Date.parse(notification.appliedAt || "");
    const formattedTime = Number.isNaN(timestamp) ? "Recently" : new Date(timestamp).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
    item.append(makeElement("span", "notification-time", formattedTime));
    return item;
  }));
}

notificationButton.addEventListener("click", () => {
  const opening = notificationPanel.hidden;
  notificationPanel.hidden = !opening;
  notificationButton.setAttribute("aria-expanded", String(opening));
  if (opening) {
    const readIds = new Set(readNotificationIds());
    employerNotifications().forEach((notification) => readIds.add(notification.notificationId));
    try {
      localStorage.setItem(`fundi.notifications.read:${encodeURIComponent(currentUser.email)}`, JSON.stringify([...readIds]));
    } catch {
      storageStatus.textContent = "Notifications could not be marked as read";
    }
    renderNotifications();
  }
});

notificationList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-job-id]");
  if (!item) return;
  notificationPanel.hidden = true;
  notificationButton.setAttribute("aria-expanded", "false");
  setView("activity");
});

document.addEventListener("click", (event) => {
  if (!notificationPanel.hidden && !notificationPanel.contains(event.target) && !notificationButton.contains(event.target)) {
    notificationPanel.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== JOBS_KEY || apiAvailable || !currentUser) return;
  const previousCount = employerNotifications().length;
  jobs = readStoredJobs();
  renderAll();
  if (employerNotifications().length > previousCount) showDashboardMessage("Someone is interested in one of your jobs.");
});

window.setInterval(async () => {
  if (!apiAvailable || !currentUser || document.hidden) return;
  try {
    const response = await fetch(API_URL);
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data)) return;
    const refreshedJobs = data.map(normalizeJob);
    if (JSON.stringify(refreshedJobs) === JSON.stringify(jobs)) return;
    const previousCount = employerNotifications().length;
    jobs = refreshedJobs;
    saveJobs();
    renderAll();
    if (employerNotifications().length > previousCount) showDashboardMessage("Someone is interested in one of your jobs.");
  } catch {
    return;
  }
}, 15000);

jobList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action='apply']");
  if (!button) return;
  const job = jobs.find((item) => item.id === button.dataset.id);
  if (!job || job.postedBy === currentUser.email || job.applications.some((application) => application.email === currentUser.email)) return;

  button.disabled = true;
  let targetJob = job;
  try {
    if (apiAvailable) {
      const currentResponse = await fetch(`${API_URL}/${encodeURIComponent(job.id)}`);
      if (!currentResponse.ok) throw new Error("Job could not be refreshed");
      targetJob = normalizeJob(await currentResponse.json());
    }

    if (targetJob.applications.some((application) => application.email === currentUser.email)) {
      Object.assign(job, targetJob);
      renderAll();
      return;
    }

    const applicant = { email: currentUser.email, name: currentUser.name, appliedAt: new Date().toISOString() };
    const updatedJob = { ...targetJob, applications: [...targetJob.applications, applicant] };
    if (apiAvailable) {
      const response = await fetch(`${API_URL}/${encodeURIComponent(job.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applications: updatedJob.applications })
      });
      if (!response.ok) throw new Error("Interest could not be saved");
      Object.assign(job, normalizeJob(await response.json()));
    } else {
      Object.assign(job, updatedJob);
    }
    saveJobs();
    renderAll();
    showDashboardMessage("Your interest was sent to the employer.");
  } catch {
    apiAvailable = false;
    const storedJob = readStoredJobs().find((item) => item.id === job.id) || job;
    if (!storedJob.applications.some((application) => application.email === currentUser.email)) {
      storedJob.applications.push({ email: currentUser.email, name: currentUser.name, appliedAt: new Date().toISOString() });
    }
    Object.assign(job, storedJob);
    storageStatus.textContent = "Saved on this device";
    saveJobs();
    renderAll();
    showDashboardMessage("Your interest was sent and saved on this device.");
  }
});

jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(jobForm);
  const newJob = normalizeJob({
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: formData.get("title").trim(),
    category: formData.get("category"),
    location: formData.get("location").trim(),
    pay: formData.get("pay"),
    phone: formData.get("phone").trim(),
    description: formData.get("description").trim(),
    postedBy: currentUser.email,
  });

  const submitButton = jobForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  postMessage.textContent = "";
  try {
    if (apiAvailable) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob)
      });
      if (!response.ok) throw new Error("Job could not be posted");
      jobs.unshift(normalizeJob(await response.json()));
    } else {
      jobs.unshift(newJob);
    }
    saveJobs();
    jobForm.reset();
    renderAll();
    setView("find");
    showDashboardMessage("Your job is live.");
  } catch {
    apiAvailable = false;
    jobs.unshift(newJob);
    storageStatus.textContent = "Saved on this device";
    saveJobs();
    jobForm.reset();
    renderAll();
    setView("find");
    showDashboardMessage("Your job is live and saved on this device.");
  } finally {
    submitButton.disabled = false;
  }
});

currentUser = getUserFromSession();
if (currentUser && currentUser.email) {
  showDashboard();
} else {
  currentUser = null;
}