(() => {
  const section = document.querySelector(".assurance");
  if (!section) return;

  const sheet = section.querySelector(".assurance-sheet");
  const steps = [...section.querySelectorAll(".assurance-step")];
  const seal = section.querySelector(".assurance-seal");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reveal(immediate = false) {
    sheet?.classList.add("is-settled");

    steps.forEach((step, index) => {
      const show = () => step.classList.add("is-done");
      immediate ? show() : window.setTimeout(show, 180 + index * 140);
    });

    const showSeal = () => seal?.classList.add("is-visible");
    immediate ? showSeal() : window.setTimeout(showSeal, 180 + steps.length * 140 + 120);
  }

  if (reduced.matches || !("IntersectionObserver" in window)) {
    reveal(true);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    reveal(false);
    observer.disconnect();
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  observer.observe(section);
})();