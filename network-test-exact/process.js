(() => {
  const section = document.querySelector(".process");
  if (!section) return;

  const steps = [...section.querySelectorAll(".process-step")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function revealAll() {
    steps.forEach((step) => step.classList.add("is-revealed"));
  }

  if (reduced.matches || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.28, rootMargin: "0px 0px -10% 0px" });

  steps.forEach((step) => observer.observe(step));
})();