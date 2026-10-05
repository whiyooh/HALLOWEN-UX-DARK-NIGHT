const openingVideo = document.getElementById("opening-video");
let openingTimer = null;
const VIDEO_FALLBACK_TIME = 30000;
const carousel = document.getElementById("invite-carousel");
const carouselViewport = document.getElementById("carousel-viewport");
const carouselTrack = document.getElementById("carousel-track");
const slides = [...document.querySelectorAll(".invite-slide")];
const progressDots = [...document.querySelectorAll(".progress-dot")];
const previousSlideButton = document.getElementById("previous-slide");
const nextSlideButton = document.getElementById("next-slide");
const carouselStatus = document.getElementById("carousel-status");
const unlockedMessage = document.getElementById("invite-unlocked");
const inviteVideo = document.getElementById("invite-video");
const inviteVideoPlayer = inviteVideo?.querySelector("video");

let currentSlide = 0;
const viewedSlides = new Set();
let informationCompleted = false;
let slideViewTimer = null;
const SLIDE_VIEW_DURATION = 1200;

function goToScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(screenId);

  if (target) {
    target.classList.add("active");
    if (screenId === "screen-invite") {
      updateCarousel();
      scheduleSlideView();
    }
  }
}

if (window.location.hash === "#screen-invite") {
  goToScreen("screen-invite");
}

function openPrintedEnvelope() {
  const envelope = document.querySelector(".printed-envelope");

  if (!envelope) return;

  envelope.classList.add("open");

  setTimeout(() => {
    goToScreen("screen-pre-invite");
  }, 1150);
}

function startOpeningVideo() {
  goToScreen("screen-video");

  const progress = document.querySelector(".progress");

  progress.classList.remove("running");
  void progress.offsetWidth;
  progress.classList.add("running");

  syncVideoProgress();

  if (openingVideo) {
    openingVideo.currentTime = 0;
    openingVideo.volume = 0.5;
    openingVideo.muted = false;

    openingVideo.play().catch(() => {
      console.warn("O navegador bloqueou a reprodução automática com áudio.");
    });
  }

  clearTimeout(openingTimer);

  if (!openingVideo || !Number.isFinite(openingVideo.duration) || openingVideo.duration <= 0) {
    openingTimer = setTimeout(finishOpeningVideo, VIDEO_FALLBACK_TIME);
  }
}

function syncVideoProgress() {
  if (!openingVideo) return;

  const duration = openingVideo.duration;
  if (!Number.isFinite(duration) || duration <= 0) return;

  const progress = document.querySelector(".progress");
  progress?.style.setProperty("--video-duration", `${duration}s`);
}

function finishOpeningVideo() {
  clearTimeout(openingTimer);

  if (openingVideo) {
    openingVideo.pause();
    openingVideo.currentTime = 0;
  }

  goToScreen("screen-invite");
}

openingVideo?.addEventListener("loadedmetadata", syncVideoProgress);
openingVideo?.addEventListener("ended", finishOpeningVideo);

function updateCarousel() {
  if (!carouselTrack || !carouselViewport || !slides.length) return;

  const activeSlide = slides[currentSlide];
  const offset = activeSlide.offsetLeft - (carouselViewport.clientWidth - activeSlide.offsetWidth) / 2;
  carouselTrack.style.transform = `translateX(${-offset}px)`;

  slides.forEach((slide, index) => {
    const isActive = index === currentSlide;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  progressDots.forEach((dot, index) => {
    const isCurrent = index === currentSlide;
    dot.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      dot.setAttribute("aria-current", "step");
    } else {
      dot.removeAttribute("aria-current");
    }
  });

  previousSlideButton.disabled = currentSlide === 0;
  nextSlideButton.disabled = currentSlide === slides.length - 1;
  carouselStatus.textContent = `Informação ${currentSlide + 1} de ${slides.length}`;
}

function scheduleSlideView() {
  clearTimeout(slideViewTimer);
  if (viewedSlides.has(currentSlide)) return;

  slideViewTimer = setTimeout(() => {
    viewedSlides.add(currentSlide);
    informationCompleted = viewedSlides.size === slides.length;

    if (informationCompleted) {
      unlockedMessage.hidden = false;
      inviteVideo.hidden = false;
      inviteVideoPlayer?.load();
    }
  }, SLIDE_VIEW_DURATION);
}

function goToSlide(index) {
  if (index < 0 || index >= slides.length || index === currentSlide) return;

  currentSlide = index;
  updateCarousel();
  scheduleSlideView();
}

previousSlideButton?.addEventListener("click", () => goToSlide(currentSlide - 1));
nextSlideButton?.addEventListener("click", () => goToSlide(currentSlide + 1));

progressDots.forEach((dot, index) => {
  dot.addEventListener("click", () => goToSlide(index));
});

carousel?.addEventListener("keydown", (event) => {
  if (event.target !== carousel) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToSlide(currentSlide - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    goToSlide(currentSlide + 1);
  }
});

let pointerStartX = null;
carouselViewport?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  pointerStartX = event.clientX;
});

carouselViewport?.addEventListener("pointerup", (event) => {
  if (pointerStartX === null) return;

  const swipeDistance = event.clientX - pointerStartX;
  pointerStartX = null;

  if (Math.abs(swipeDistance) > 48) {
    goToSlide(currentSlide + (swipeDistance < 0 ? 1 : -1));
  }
});

carouselViewport?.addEventListener("pointercancel", () => {
  pointerStartX = null;
});

window.addEventListener("resize", updateCarousel);
updateCarousel();
