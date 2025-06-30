document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  // Toolbar elements
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const categorySelect = document.getElementById("category-select");

  let allActivities = {};

  // Helper: categorize activities (hardcoded for now)
  function getCategory(name) {
    const sports = ["Soccer Team", "Basketball Team", "Gym Class"];
    const academic = ["Programming Class", "Math Club", "Debate Team", "Chess Club"];
    const arts = ["Art Club", "Drama Club"];
    if (sports.includes(name)) return "Sports";
    if (academic.includes(name)) return "Academic";
    if (arts.includes(name)) return "Arts";
    return "Other";
  }

  function renderActivities() {
    let activities = Object.entries(allActivities);
    // Filter by search
    const search = searchInput.value.trim().toLowerCase();
    if (search) {
      activities = activities.filter(([name, details]) =>
        name.toLowerCase().includes(search) ||
        (details.description && details.description.toLowerCase().includes(search))
      );
    }
    // Filter by category
    const selectedCategory = categorySelect.value;
    if (selectedCategory) {
      activities = activities.filter(([name]) => getCategory(name) === selectedCategory);
    }
    // Sort
    const sortBy = sortSelect.value;
    if (sortBy === "name") {
      activities.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortBy === "spots") {
      activities.sort((a, b) => {
        const aSpots = a[1].max_participants - a[1].participants.length;
        const bSpots = b[1].max_participants - b[1].participants.length;
        return bSpots - aSpots;
      });
    }
    // Render
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    activities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Category:</strong> ${getCategory(name)}</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add event listeners for toolbar
  searchInput.addEventListener("input", renderActivities);
  sortSelect.addEventListener("change", renderActivities);
  categorySelect.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
