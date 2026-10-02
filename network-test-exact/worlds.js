(() => {
  const section = document.querySelector(".worlds");
  if (!section) return;

  const stage = section.querySelector(".worlds-stage");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  stage.dataset.designStage = "3";

  function reveal() {
    stage.classList.add("is-inview");
  }

  if (reduced.matches || !("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    reveal();
    observer.disconnect();
  }, { threshold: 0.14, rootMargin: "0px 0px -10% 0px" });

  observer.observe(section);
})();