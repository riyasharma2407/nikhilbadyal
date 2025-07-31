"use strict"

// --- Constants ---
let form, formInputs, formBtn
let captchaCompleted = false

function checkFormValidity() {
  if (form?.checkValidity() && captchaCompleted) {
    formBtn?.removeAttribute("disabled")
  } else {
    formBtn?.setAttribute("disabled", "")
  }
}

function onTurnstileSuccess(token) {
  captchaCompleted = true
  checkFormValidity()
}

function onTurnstileExpired() {
  captchaCompleted = false
  checkFormValidity()
}
// --- Helper Functions ---

/**
 * Toggles the 'active' class on a given element.
 * @param {Element} elem - The DOM element to toggle.
 */
const elementToggleFunc = (elem) => {
  elem.classList.toggle("active")
}

/**
 * Shows a toast notification message.
 * @param {string} message - The message to display in the toast.
 */
function showToast(message) {
  const toast = document.getElementById("toast")
  if (!toast) {
    console.error("Toast element not found!")
    return
  }
  toast.textContent = message
  toast.classList.add("show")

  // Hide the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

/**
 * Closes the toast notification immediately.
 */
function closeToast() {
  const toast = document.getElementById("toast")
  if (toast) {
    toast.classList.remove("show")
  }
}

// --- Initialization Functions ---

/**
 * Initializes hash-based page navigation.
 * Updates content visibility and active link based on URL hash.
 */
function initHashNavigation() {
  const navLinks = document.querySelectorAll("[data-nav-link]")
  const sections = document.querySelectorAll("article[id]") // Select articles with an ID

  const showSection = () => {
    // Default to '#about' if no hash or invalid hash
    let hash = window.location.hash
    const validHashes = Array.from(sections).map((s) => `#${s.id}`)
    if (!hash || !validHashes.includes(hash)) {
      hash = "#about"
      // Optionally update the URL if defaulting
      // window.history.replaceState(null, null, ' '); // Removes hash
      // window.history.replaceState(null, null, hash); // Sets default hash
    }

    const targetId = hash.substring(1)

    sections.forEach((section) => {
      section.classList.toggle("active", section.id === targetId)
    })

    navLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.getAttribute("data-nav-link") === hash
      )
    })

    // Optional: Scroll to top when section changes
    window.scrollTo(0, 0)
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetHash = link.getAttribute("data-nav-link")
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash
        // showSection() will be triggered by the 'hashchange' event
      } else {
        // If clicking the already active link, maybe force show? (optional)
        showSection()
      }
      // Prevent default if it's a plain '#' link that might cause jumpiness
      if (targetHash === "#") event.preventDefault()
    })
  })

  window.addEventListener("hashchange", showSection)

  // Initial load
  showSection()
}

/**
 * Initializes the sidebar toggle functionality for mobile view.
 */
function initSidebar() {
  const sidebar = document.querySelector("[data-sidebar]")
  const sidebarBtn = document.querySelector("[data-sidebar-btn]")

  if (sidebar && sidebarBtn) {
    sidebarBtn.addEventListener("click", () => {
      elementToggleFunc(sidebar)
    })
  } else {
    console.warn("Sidebar elements not found.")
  }
}

/**
 * Initializes the custom select dropdown and portfolio item filtering logic.
 */
function initPortfolioFilter() {
  const select = document.querySelector("[data-select]")
  const selectItems = document.querySelectorAll("[data-select-item]")
  const selectValue = document.querySelector("[data-selecct-value]") // Typo in original attribute? Should be data-select-value?
  const filterBtns = document.querySelectorAll("[data-filter-btn]")
  const filterItems = document.querySelectorAll("[data-filter-item]")

  if (
    !select ||
		selectItems.length === 0 ||
		!selectValue ||
		filterBtns.length === 0 ||
		filterItems.length === 0
  ) {
    console.warn("Portfolio filter elements missing. Filtering disabled.")
    return
  }

  // Filter function
  const filterFunc = (selectedValue) => {
    selectedValue = selectedValue.toLowerCase() // Ensure consistent casing
    filterItems.forEach((item) => {
      const itemCategory = item.dataset.category?.toLowerCase() // Optional chaining and lower case
      const shouldShow =
				selectedValue === "all" || selectedValue === itemCategory
      item.classList.toggle("active", shouldShow)
    })
  }

  // Custom select functionality
  select.addEventListener("click", function () {
    elementToggleFunc(this)
  })

  selectItems.forEach((item) => {
    item.addEventListener("click", function () {
      const selectedValue = this.innerText
      selectValue.innerText = selectedValue
      elementToggleFunc(select) // Close the dropdown
      filterFunc(selectedValue)

      // Sync filter buttons state (optional, but good UX)
      const filterValueLower = selectedValue.toLowerCase()
      filterBtns.forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.innerText.toLowerCase() === filterValueLower
        )
      })
      // Update lastClickedBtn if needed (assuming filterBtns logic runs after this)
      lastClickedBtn =
				Array.from(filterBtns).find((btn) =>
				  btn.classList.contains("active")
				) || lastClickedBtn
    })
  })

  // Filter button functionality (for larger screens)
  let lastClickedBtn = filterBtns[0] // Assume first button is initially active

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const selectedValue = this.innerText
      selectValue.innerText = selectedValue // Update select text to match
      filterFunc(selectedValue)

      lastClickedBtn.classList.remove("active")
      this.classList.add("active")
      lastClickedBtn = this
    })
  })
}

/**
 * Initializes contact form validation and submission handling.
 */
function initContactForm() {
  form = document.querySelector("[data-form]")
  formInputs = document.querySelectorAll("[data-form-input]")
  formBtn = document.querySelector("[data-form-btn]")

  if (!form || formInputs.length === 0 || !formBtn) {
    console.warn("Contact form elements not found.")
    return
  }

  formInputs.forEach((input) => {
    input.addEventListener("input", checkFormValidity)
  })

  // Handle form submission
  form.addEventListener("submit", async (event) => {
    event.preventDefault() // Prevent default HTML submission
    formBtn.setAttribute("disabled", "") // Disable button during submission
    showToast("Sending...") // Provide feedback

    const formData = {
      email: form.email.value,
      message: form.message.value,
      name: form.fullname.value,
      token: document.querySelector('input[name="cf-turnstile-response"]')
        ?.value
    }

    try {
      const response = await fetch("https://sender.nikhilbadyal.workers.dev", {
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      })

      if (response.ok) {
        showToast("Message sent successfully!")
        form.reset() // Clear the form fields

        if (window.turnstile && typeof turnstile.reset === "function") {
          turnstile.reset()
        }
        captchaCompleted = false // Reset captcha flag
        checkFormValidity() // Disable button until user starts typing again
      } else {
        const errorText = await response.text()
        console.error("Failed to send message:", response.status, errorText)
        showToast(`Failed to send: ${response.statusText}. Try again.`)
        checkFormValidity() // Re-enable button if form is still valid
      }
    } catch (err) {
      console.error("Network error sending message:", err)
      showToast("Network error. Please check connection and try again.")
      checkFormValidity() // Re-enable button if form is still valid
    }
  })

  // Initial check in case of pre-filled values
  checkFormValidity()
}

/**
 * Sets target="_blank" for all project item links.
 */
function initExternalProjectLinks() {
  document.querySelectorAll(".project-item a").forEach((link) => {
    link.setAttribute("target", "_blank")
    link.setAttribute("rel", "noopener noreferrer") // Security best practice for target="_blank"
  })
}

/**
 * Initializes the copy email functionality.
 */
function initCopyToClipboard() {
  // Requires an element (e.g., button) with id="copy-email-trigger" in your HTML
  const copyTrigger = document.getElementById("copy-email-trigger")
  const emailElement = document.getElementById("email") // The element displaying the email

  if (copyTrigger && emailElement) {
    copyTrigger.addEventListener("click", () => {
      const email = emailElement.textContent.trim()
      if (email && navigator.clipboard) {
        navigator.clipboard.writeText(email).then(
          () => {
            showToast("Email Copied!")
          },
          (err) => {
            console.error("Failed to copy email address:", err)
            showToast("Copy failed. Please copy manually.")
          }
        )
      } else if (!navigator.clipboard) {
        showToast("Clipboard access not available.")
      }
    })
  } else {
    if (!copyTrigger) {
      console.warn(
        "Element with id='copy-email-trigger' not found for clipboard functionality."
      )
    }
    if (!emailElement) {
      console.warn(
        "Element with id='email' not found for clipboard functionality."
      )
    }
  }
}

/**
 * Triggers device vibration if supported.
 */
function initVibration() {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(100) // Vibrate for 100ms
    } catch (err) {
      console.warn("Vibration failed:", err)
    }
  }
}

/**
 * Initializes and sends analytics tracking data.
 */
async function initAnalytics() {
  try {
    let sessionId = sessionStorage.getItem("sessionId")
    if (!sessionId) {
      try {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem("sessionId", sessionId)
      } catch (error) {
        console.error("Error managing sessionStorage (analytics):", error)
        sessionId = "fallback-" + Date.now() // Fallback
      }
    }

    const payload = {
      connection: {
        downlink: navigator.connection?.downlink || null,
        effectiveType: navigator.connection?.effectiveType || null,
        rtt: navigator.connection?.rtt || null
      },
      cpuCores: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null,
      doNotTrack: navigator.doNotTrack || null,
      hash: window.location.hash,
      isBot: /bot|crawl|spider|slurp|facebook|embed/i.test(navigator.userAgent),
      language: navigator.language,
      pathname: window.location.pathname,
      referrer: document.referrer || null,
      screen: {
        height: screen.height,
        orientation: screen.orientation?.type || null,
        pixelRatio: window.devicePixelRatio,
        width: screen.width
      },
      search: window.location.search,
      sessionId,
      // Returns "1", "0", or "unspecified"
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      timestamp: new Date().toISOString(),

      title: document.title,

      url: window.location.href,
      userAgent: navigator.userAgent,
      visibility: document.visibilityState
    }

    // Use sendBeacon if available for reliability on page unload, otherwise fallback to fetch
    const trackerUrl = "https://tracker.nikhilbadyal.workers.dev/"
    const data = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        trackerUrl,
        new Blob([data], { type: "application/json" })
      )
      if (sent) {
        console.log("Tracking beacon sent successfully.")
      } else {
        console.error("Tracking beacon failed initially, trying fetch.")
        // Fallback to fetch if sendBeacon fails immediately (less common)
        await fetch(trackerUrl, {
          body: data,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          method: "POST"
        })
        console.log("Tracking fetch fallback attempted.")
      }
    } else {
      // Fallback for browsers that don't support sendBeacon
      const res = await fetch(trackerUrl, {
        // Important for reliability on unload
        body: data,

        headers: { "Content-Type": "application/json" },
        keepalive: true,
        method: "POST"
      })

      if (!res.ok) {
        const text = await res.text()
        console.error("Tracking fetch failed with status:", res.status, text)
        // Avoid showing toast for background tasks unless critical
        // showToast("Tracking failed.");
      } else {
        console.log("Tracking fetch successful.")
      }
    }
  } catch (err) {
    console.error("Analytics initialization/sending failed:", err)
    // Avoid showing toast for background tasks
    // showToast("Tracking failed.");
  }
}
/**
 * Fetches and displays the user's public IP address and country.
 */
function initUserIP() {
  const ipElement = document.getElementById("user-ip")
  // Get the parent LI element that wraps the IP info
  const ipListItem = ipElement?.closest(".contact-item") // Find the nearest ancestor with class 'contact-item'
  const titleElement =
		ipElement?.parentElement?.querySelector(".contact-title")

  // Ensure the necessary display element and its parent LI exist
  if (ipElement && ipListItem) {
    console.log("Fetching user IP and Location...")
    // Show the list item initially with a loading message
    ipListItem.style.display = "" // Ensure it's visible initially (or revert to default)
    ipElement.textContent = "Loading..."
    if (titleElement) {
      titleElement.textContent = "Your Location Info" // Set initial title
    }

    fetch("https://api.ipquery.io/?format=json")
      .then((response) => {
        if (!response.ok) {
          console.error(
            "HTTP error fetching IP:",
            response.status,
            response.statusText
          )
          // On HTTP error, throw error to be caught by .catch()
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json() // Parse the response body as JSON
      })
      .then((data) => {
        // Check if both 'ip' and 'location.country' properties exist
        if (data && data.ip && data.location && data.location.country) {
          // Format the output string
          ipElement.textContent = `${data.ip} (${data.location.country})`
          console.log(
            "User IP and Country found:",
            data.ip,
            data.location.country
          )
          ipListItem.style.display = "" // Ensure it remains visible
          if (titleElement) {
            titleElement.textContent = "Your Location Info" // Confirm title
          }
        } else if (data && data.ip) {
          // Display just IP if country is missing
          ipElement.textContent = data.ip + " (Country N/A)"
          console.warn(
            "API response missing country, displaying only IP:",
            data
          )
          ipListItem.style.display = "" // Ensure it remains visible
          if (titleElement) {
            titleElement.textContent = "Your IP Address" // Revert title if only IP found
          }
        } else if (data && data.location && data.location.country) {
          // Display just country if IP is missing
          ipElement.textContent = `Country: ${data.location.country}`
          console.warn(
            "API response missing IP, displaying only Country:",
            data
          )
          ipListItem.style.display = "" // Ensure it remains visible
          if (titleElement) {
            titleElement.textContent = "Your Country" // Revert title if only Country
          }
        } else {
          // If neither IP nor Country is reliably found in the expected structure, hide the list item
          console.error(
            "API response missing expected IP or location data:",
            data
          )
          ipListItem.style.display = "none" // Hide the entire item
        }
      })
      .catch((error) => {
        // Handle network errors or errors during fetch/json parsing
        console.error("Error fetching user IP/Location:", error)
        // On any fetch error, hide the entire list item
        ipListItem.style.display = "none" // Hide the entire item
      })
  } else {
    // If the HTML structure is missing the required elements, log a warning
    console.warn(
      "Element with id='user-ip' or its parent '.contact-item' not found. Cannot display user IP/Location."
    )
    // If the list item was supposed to be found but wasn't, there's nothing to hide.
  }
}

// --- Main Execution ---

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed")

  // Initialize all modules
  initHashNavigation() // Handles initial view and navigation clicks/changes
  initSidebar()
  initPortfolioFilter()
  initContactForm()
  initExternalProjectLinks()
  initCopyToClipboard()
  initVibration()

  // Run analytics (can run independently)
  initAnalytics().then((r) => {})

  initUserIP()
  console.log("All initializations complete.")
})
