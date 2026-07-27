// Copy BibTeX to clipboard
function copyBibTeX() {
  const bibtexElement = document.getElementById("bibtex-code");
  const button = document.querySelector(".copy-bibtex-btn");
  if (!bibtexElement || !button) return;
  const copyText = button.querySelector(".copy-text");
  if (!copyText) return;

  if (bibtexElement) {
    navigator.clipboard
      .writeText(bibtexElement.textContent)
      .then(function () {
        // Success feedback
        button.classList.add("copied");
        copyText.textContent = "Cop";

        setTimeout(function () {
          button.classList.remove("copied");
          copyText.textContent = "Copy";
        }, 2000);
      })
      .catch(function (err) {
        console.error("Failed to copy: ", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = bibtexElement.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        button.classList.add("copied");
        copyText.textContent = "Cop";
        setTimeout(function () {
          button.classList.remove("copied");
          copyText.textContent = "Copy";
        }, 2000);
      });
  }
}

// Scroll to top functionality
function scrollToTop() {
  window.scrollTo(0, 0);
}

// Temporary Coming soon interaction for the Paper/Code buttons.
// Remove this block after restoring the real links in index.html.
function initializeComingSoonButtons() {
  const wrappers = document.querySelectorAll(".coming-soon-wrapper");
  if (wrappers.length === 0) return;

  let hideTimer = null;

  function hideAllComingSoon() {
    wrappers.forEach(function (wrapper) {
      wrapper.classList.remove("is-visible");
    });
  }

  wrappers.forEach(function (wrapper) {
    const trigger = wrapper.querySelector(".coming-soon-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function () {
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }

      const isVisible = wrapper.classList.contains("is-visible");
      hideAllComingSoon();

      if (!isVisible) {
        wrapper.classList.add("is-visible");
        hideTimer = window.setTimeout(hideAllComingSoon, 1800);
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!(event.target instanceof Node)) return;

    if (!event.target.parentElement?.closest(".coming-soon-wrapper")) {
      hideAllComingSoon();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hideAllComingSoon();
    }
  });
}

initializeComingSoonButtons();

// Show/hide scroll to top button
window.addEventListener("scroll", function () {
  const scrollButton = document.querySelector(".scroll-to-top");
  if (!scrollButton) return;

  if (window.pageYOffset > 300) {
    scrollButton.classList.add("visible");
  } else {
    scrollButton.classList.remove("visible");
  }
});
