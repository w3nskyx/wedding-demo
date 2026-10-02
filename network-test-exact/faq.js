(() => {
  const section = document.querySelector(".faq");
  if (!section) return;

  const items = [...section.querySelectorAll(".faq-item")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setOpen(target) {
    items.forEach((item) => {
      const open = item === target;
      item.classList.toggle("is-open", open);
      const button = item.querySelector(".faq-question");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  items.forEach((item) => {
    const button = item.querySelector(".faq-question");
    button.addEventListener("click", () => {
      const alreadyOpen = item.classList.contains("is-open");
      if (alreadyOpen) {
        item.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        return;
      }
      setOpen(item);
      if (!reduced.matches) {
        requestAnimationFrame(() => {
          item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
    });
  });
})();