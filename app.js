
const CONFIG = window.WEDDING_CONFIG || {};
const storageKey = CONFIG.storageKey || "wedding_rsvp";

document.querySelectorAll(".reveal").forEach(el => {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, {threshold:.12});
  io.observe(el);
});

// Countdown to next Dec 16
function targetDate(){
  const now = new Date();
  let year = now.getFullYear();
  let t = new Date(year, 11, 16, 15, 0, 0);
  if(t <= now) t = new Date(year + 1, 11, 16, 15, 0, 0);
  return t;
}
function updateCountdown(){
  const diff = Math.max(0, targetDate() - new Date());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  document.getElementById("days").textContent = d;
  document.getElementById("hours").textContent = String(h).padStart(2,"0");
  document.getElementById("minutes").textContent = String(m).padStart(2,"0");
}
updateCountdown();
setInterval(updateCountdown, 30000);

// Music
const audio = document.getElementById("bgMusic");
const musicButton = document.getElementById("musicButton");
const musicLabel = document.getElementById("musicLabel");
let musicPlaying = false;
musicButton.addEventListener("click", async () => {
  try{
    if(!musicPlaying){
      await audio.play();
      musicPlaying = true;
      musicButton.classList.add("playing");
      musicLabel.textContent = "Пауза";
    } else {
      audio.pause();
      musicPlaying = false;
      musicButton.classList.remove("playing");
      musicLabel.textContent = "Музыка";
    }
  } catch(e){
    musicLabel.textContent = "Добавьте our-song.mp3";
  }
});

// RSVP
const form = document.getElementById("rsvpForm");
const note = document.getElementById("formNote");

const RSVP_STATE_KEY = `${storageKey}_current`;

function createResponseId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now());
}

function getSavedState() {
  try {
    return JSON.parse(localStorage.getItem(RSVP_STATE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveState(payload) {
  localStorage.setItem(RSVP_STATE_KEY, JSON.stringify(payload));
}

function formToObject(form) {
  const fd = new FormData(form);
  const previous = getSavedState();

  return {
    weddingId: CONFIG.weddingId || "musya-matusevich",
    id: previous?.id || createResponseId(),
    createdAt: previous?.createdAt || new Date().toISOString(),
    name: fd.get("name"),
    attendance: fd.get("attendance"),
    guests: Number(fd.get("guests") || 1),
    food: fd.getAll("food"),
    drinks: fd.getAll("drinks"),
    comment: fd.get("comment") || ""
  };
}

function restoreForm() {
  const saved = getSavedState();
  if (!saved) return;

  const setValue = (name, value) => {
    const el = form.elements[name];
    if (el) el.value = value ?? "";
  };

  setValue("name", saved.name);
  setValue("guests", saved.guests);
  setValue("comment", saved.comment);

  form.querySelectorAll('[name="attendance"]').forEach(el => {
    el.checked = el.value === saved.attendance;
  });

  form.querySelectorAll('[name="food"]').forEach(el => {
    el.checked = (saved.food || []).includes(el.value);
  });

  form.querySelectorAll('[name="drinks"]').forEach(el => {
    el.checked = (saved.drinks || []).includes(el.value);
  });

  note.textContent = "Ваш предыдущий ответ восстановлен. Его можно изменить и отправить снова.";
}

restoreForm();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = form.querySelector(".submit-button");
  const payload = formToObject(form);

  btn.disabled = true;
  btn.textContent = "Отправляем…";

  try {
    if (CONFIG.rsvpEndpoint) {
      const res = await fetch(CONFIG.rsvpEndpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
    }

    saveState(payload);

    note.textContent = "Спасибо! Ответ сохранён ♥";
    note.style.fontWeight = "600";
    note.scrollIntoView({behavior: "smooth", block: "center"});
  } catch (err) {
    console.error(err);
    note.textContent = "Не получилось отправить ответ. Попробуйте ещё раз.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Отправить ответ";
  }
});
