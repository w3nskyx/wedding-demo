(() => {
  const section = document.querySelector(".paths");
  if (!section) return;

  const cards = [...section.querySelectorAll(".path-card")];
  const result = section.querySelector(".paths-result");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const revealAll = () => {
    cards.forEach((card) => card.classList.add("is-revealed"));
    result?.classList.add("is-visible");
  };

  if (reduced.matches || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(entry.target === result ? "is-visible" : "is-revealed");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.22, rootMargin: "0px 0px -8% 0px" });

  [...cards, result].filter(Boolean).forEach((item) => observer.observe(item));
})();