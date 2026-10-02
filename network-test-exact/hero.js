(() => {
  const hero = document.querySelector(".hero");
  const capabilities = document.querySelector(".capabilities");
  const explore = document.querySelector(".hero-explore");
  const faq = document.querySelector(".faq");
  const widget = document.querySelector(".contact-widget");
  const toggle = widget?.querySelector(".contact-toggle");
  const menu = widget?.querySelector(".contact-menu");
  const callbackButton = widget?.querySelector(".contact-callback");
  const callbackCard = widget?.querySelector(".callback-card");
  const callbackClose = widget?.querySelector(".callback-close");
  const callbackForm = widget?.querySelector(".callback-form");
  const callbackDone = widget?.querySelector(".callback-done");
  const nameField = widget?.querySelector('input[name="name"]');
  const phoneField = widget?.querySelector('input[name="phone"]');
  const phoneWrap = phoneField?.closest(".callback-field");
  const phoneError = widget?.querySelector(".callback-error");
  const callbackSubmit = widget?.querySelector(".callback-submit");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hero || !capabilities || !explore || !faq || !widget || !toggle || !menu ||
      !callbackButton || !callbackCard || !callbackClose || !callbackForm ||
      !callbackDone || !nameField || !phoneField || !phoneWrap || !phoneError ||
      !callbackSubmit) return;

  let compact = window.scrollY > 64;
  let queued = false;
  let callbackRequestId = "";

  function setMenu(open) {
    widget.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function resetCallback() {
    callbackCard.classList.remove("is-success");
    callbackCard.querySelector(".callback-success")?.setAttribute("aria-hidden", "true");
    callbackForm.reset();
    callbackRequestId = "";
    callbackSubmit.disabled = false;
    callbackSubmit.textContent = "Перезвоните мне";
    phoneWrap.classList.remove("has-error");
    phoneError.textContent = "";
  }

  function setCallback(open) {
    widget.classList.toggle("is-callback", open);
    callbackCard.setAttribute("aria-hidden", open ? "false" : "true");
    callbackButton.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      setMenu(false);
      requestAnimationFrame(() => {
        widget.querySelector('input[name="name"]')?.focus();
      });
    }
  }

  function closeCallback() {
    setCallback(false);
    resetCallback();
  }

  function setCompact(nextCompact) {
    if (compact === nextCompact) return;
    compact = nextCompact;
    setMenu(false);
    widget.classList.toggle("is-compact", compact);
  }

  function setHidden(hidden) {
    const wasHidden = widget.classList.contains("is-hidden");
    if (hidden === wasHidden) return;

    if (hidden) {
      setMenu(false);
      if (widget.classList.contains("is-callback")) closeCallback();
    }

    widget.classList.toggle("is-hidden", hidden);
    widget.setAttribute("aria-hidden", hidden ? "true" : "false");
    widget.inert = hidden;
  }

  function shouldHideAtFaq() {
    const faqTop = faq.getBoundingClientRect().top;
    return faqTop <= window.innerHeight - 48;
  }

  function syncInitial() {
    widget.classList.toggle("is-compact", compact);
    const hidden = shouldHideAtFaq();
    widget.classList.toggle("is-hidden", hidden);
    widget.setAttribute("aria-hidden", hidden ? "true" : "false");
    widget.inert = hidden;
  }

  function handleScroll() {
    queued = false;
    setCompact(window.scrollY > 64);
    setHidden(shouldHideAtFaq());
    if (widget.classList.contains("is-open")) setMenu(false);
  }

  function requestScrollSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(handleScroll);
  }

  explore.addEventListener("click", () => {
    setMenu(false);
    const top = capabilities.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top,
      behavior: reduced.matches ? "auto" : "smooth"
    });
  });

  toggle.addEventListener("click", () => {
    if (widget.classList.contains("is-callback")) closeCallback();
    setMenu(!widget.classList.contains("is-open"));
  });

  callbackButton.addEventListener("click", () => {
    resetCallback();
    setCallback(true);
  });

  callbackClose.addEventListener("click", closeCallback);
  callbackDone.addEventListener("click", closeCallback);

  callbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const digits = phoneField.value.replace(/\D/g, "");

    if (digits.length < 7) {
      phoneWrap.classList.add("has-error");
      phoneError.textContent = "Проверьте номер телефона.";
      phoneField.focus();
      return;
    }

    phoneWrap.classList.remove("has-error");
    phoneError.textContent = "";

    if (!callbackRequestId) {
      callbackRequestId = crypto.randomUUID?.() ||
        `callback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    callbackSubmit.disabled = true;
    callbackSubmit.textContent = "Отправляем…";

    try {
      const response = await fetch("https://api.dvoe-wedding.ru/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: callbackRequestId,
          createdAt: new Date().toISOString(),
          name: nameField.value.trim(),
          phone: phoneField.value.trim(),
          source: "studio-site"
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      callbackCard.classList.add("is-success");
      callbackCard.querySelector(".callback-success")?.setAttribute("aria-hidden", "false");
    } catch (error) {
      console.error("Callback request failed", error);
      phoneError.textContent = "Не удалось отправить. Попробуйте ещё раз.";
      callbackSubmit.disabled = false;
      callbackSubmit.textContent = "Перезвоните мне";
    }
  });

  phoneField.addEventListener("input", () => {
    if (phoneWrap.classList.contains("has-error")) {
      phoneWrap.classList.remove("has-error");
      phoneError.textContent = "";
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!widget.contains(event.target)) {
      setMenu(false);
      if (widget.classList.contains("is-callback")) closeCallback();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (widget.classList.contains("is-callback")) closeCallback();
      else setMenu(false);
      toggle.focus();
    }
  });

  window.addEventListener("scroll", requestScrollSync, { passive: true });

  reduced.addEventListener?.("change", () => {
    if (reduced.matches) {
      setMenu(false);
      if (widget.classList.contains("is-callback")) closeCallback();
    }
  });

  syncInitial();
})();