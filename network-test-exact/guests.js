(() => {
  const section = document.querySelector(".guests");
  if (!section) return;

  const viewport = section.querySelector(".guest-phone-viewport");
  const invitePage = section.querySelector(".guest-invite-page");
  const result = section.querySelector(".guests-result");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let played = false;

  function reveal() {
    section.classList.add("is-inview");
    result?.classList.add("is-visible");

    if (played || reduced.matches || !invitePage || !viewport || !invitePage.animate) return;
    played = true;

    requestAnimationFrame(() => {
      const maxTranslate = Math.max(0, invitePage.scrollHeight - viewport.clientHeight);
      if (!maxTranslate) return;

      invitePage.animate(
        [
          { transform: "translate3d(0,0,0)" },
          { transform: `translate3d(0,-${Math.min(maxTranslate, viewport.clientHeight * 2.4)}px,0)` }
        ],
        {
          duration: 7200,
          delay: 550,
          easing: "cubic-bezier(.22,.68,.22,1)",
          fill: "forwards"
        }
      );
    });
  }

  if (reduced.matches || !("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    reveal();
    observer.disconnect();
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

  observer.observe(section);
})();