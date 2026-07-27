(function () {
  "use strict";

  var backLinks = Array.prototype.slice.call(document.querySelectorAll("[data-blog-back]"));

  backLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign(link.href);
      }
    });
  });

  var tocList = document.querySelector("[data-blog-toc-list]");
  var article = document.querySelector(".blog-article");

  if (!tocList || !article) return;

  var headings = Array.prototype.slice.call(article.querySelectorAll("h2, h3"));
  tocList.innerHTML = "";

  headings.forEach(function (heading, index) {
    if (!heading.id) heading.id = "section-" + (index + 1);

    var item = document.createElement("li");
    var link = document.createElement("a");

    item.className = "blog-sidebar__toc-item blog-sidebar__toc-item--" + heading.tagName.toLowerCase();
    link.href = "#" + heading.id;
    link.textContent = heading.textContent;
    link.setAttribute("data-toc-target", heading.id);

    item.appendChild(link);
    tocList.appendChild(item);
  });

  if (!headings.length) {
    var emptyItem = document.createElement("li");
    emptyItem.className = "blog-sidebar__placeholder";
    emptyItem.textContent = "No sections available.";
    tocList.appendChild(emptyItem);
    return;
  }

  var links = Array.prototype.slice.call(tocList.querySelectorAll("a[data-toc-target]"));

  function setActive(id) {
    links.forEach(function (link) {
      var active = link.getAttribute("data-toc-target") === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateActiveSection() {
    var activeHeading = headings[0];
    var offset = 120;

    headings.forEach(function (heading) {
      if (heading.getBoundingClientRect().top <= offset) activeHeading = heading;
    });

    setActive(activeHeading.id);
  }

  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
})();
