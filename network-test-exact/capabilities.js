(() => {
  const section = document.querySelector(".capabilities");
  if (!section) return;

  const items = [...section.querySelectorAll(".capability-item")];
  const finalCard = section.querySelector(".capability-final");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reveal(immediate = false) {
    items.forEach((item, index) => {
      const show = () => {
        item.classList.add("is-visible");
        item.classList.remove("is-active");
        item.removeAttribute("aria-hidden");
      };
      immediate ? show() : window.setTimeout(show, index * 70);
    });

    const showFinal = () => {
      finalCard?.classList.add("is-visible");
      finalCard?.removeAttribute("aria-hidden");
    };
    immediate ? showFinal() : window.setTimeout(showFinal, items.length * 70 + 80);
  }

  if (reduced.matches || !("IntersectionObserver" in window)) {
    reveal(true);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    reveal(false);
    observer.disconnect();
  }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });

  observer.observe(section);
})();