// Select elements
const jobForm = document.getElementById("jobForm");
const jobList = document.getElementById("jobList");
const searchInput = document.getElementById("search");
const statusMessage = document.getElementById("statusMessage");


// 🔹 Load jobs from API
const noJobs = document.getElementById("noJobs");
function loadJobs() {
  statusMessage.textContent = "";
  fetch("http://localhost:3000/jobs")
    .then(res => {
      if (!res.ok) throw new Error("Unable to load jobs.");
      return res.json();
    })
    .then(data => {
        if (data.length === 0) {
  noJobs.style.display = "block";
} else {
  noJobs.style.display = "none";
}
      jobList.innerHTML = "";

      data.forEach(job => {
        const jobItem = document.createElement("div");
        jobItem.classList.add("job-card");

        const bookedLabel = job.booked ? `<span class="booked-tag">No longer available</span>` : "";
        const bookButton = job.booked
          ? ""
          : `<button class=\"book-button\" data-id=\"${job.id}\">Book Job</button>`;

        jobItem.innerHTML = `
          <div class="job-card-header">
            <h3>${job.title}</h3>
            ${bookedLabel}
          </div>
          <p>📍 ${job.location}</p>
          <p>💰 KES ${job.pay}</p>
          <p>📞 ${job.phone}</p>
          <hr>
          ${bookButton}
        `;

        jobList.appendChild(jobItem);

        if (!job.booked) {
          const button = jobItem.querySelector(".book-button");
          button.addEventListener("click", function() {
            bookJob(job.id);
          });
        }
      });
    })
    .catch(error => {
      console.error(error);
      statusMessage.textContent = "Cannot connect to API. Start json-server on localhost:3000.";
      jobList.innerHTML = "";
      noJobs.style.display = "block";
    });
}

// Load jobs when page opens
loadJobs();

function bookJob(jobId) {
  statusMessage.textContent = "";

  fetch(`http://localhost:3000/jobs/${jobId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ booked: true })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unable to book job.");
    return res.json();
  })
  .then(() => {
    statusMessage.textContent = "Job booked successfully. This position is now unavailable.";
    loadJobs();
  })
  .catch(error => {
    console.error(error);
    statusMessage.textContent = "Unable to book the job. Make sure json-server is running.";
  });
}


// 🔹 Handle form submission (POST)
jobForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const location = document.getElementById("location").value;
  const pay = document.getElementById("pay").value;
  const phone = document.getElementById("phone").value;

  statusMessage.textContent = "";
  fetch("http://localhost:3000/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, location, pay, phone, booked: false })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unable to post job.");
    return res.json();
  })
  .then(() => {
    loadJobs();       // reload jobs from API
    jobForm.reset();  // clear form
    statusMessage.textContent = "Job posted successfully.";
  })
  .catch(error => {
    console.error(error);
    statusMessage.textContent = "Failed to post job. Is json-server running?";
  });
});


// 🔹 Search functionality
const noResults = document.getElementById("noResults");

searchInput.addEventListener("input", function() {
  const searchValue = searchInput.value.toLowerCase();
  const jobs = document.querySelectorAll("#jobList div");

  let found = false;

  jobs.forEach(function(job) {
    const text = job.textContent.toLowerCase();

    if (text.includes(searchValue)) {
      job.style.display = "block";
      found = true;
    } else {
      job.style.display = "none";
    }
  });

  if (!found) {
    noResults.style.display = "block";
  } else {
    noResults.style.display = "none";
  }
});