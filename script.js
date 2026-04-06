// ============================================
//   TASK DATA
// ============================================

const TASKS = [
  {
    title: "Go to the Park",
    description:
      "Step away from the screen and spend some time outside. Fresh air and movement do wonders for your mood and focus. Even 20 minutes counts.",
    keywords: "park nature outdoor trees green",
  },
  {
    title: "Bake Something",
    description:
      "Try baking a new recipe today. Whether it's focaccia, cookies, or a simple loaf — the process is meditative and the result is delicious.",
    keywords: "baking bread kitchen homemade",
  },
  {
    title: "Call a Friend",
    description:
      "Reach out to someone you haven't talked to in a while. A 10-minute catch-up can brighten both of your days more than you expect.",
    keywords: "friends talking laughing together",
  },
  {
    title: "Read for 30 Min",
    description:
      "Pick up a book you've been meaning to read. Even half an hour of reading shifts your perspective and gives your mind a proper break.",
    keywords: "reading book library cozy",
  },
  {
    title: "Clean Your Space",
    description:
      "A clean workspace equals a clear mind. Spend 20 minutes tidying your desk or room and notice how it changes your energy.",
    keywords: "clean desk organized tidy minimal",
  },
  {
    title: "Write in a Journal",
    description:
      "Spend 15 minutes writing freely. Record your thoughts, feelings, or what happened today. No rules, no judgment — just write.",
    keywords: "journal writing notebook pen paper",
  },
  {
    title: "Watch a Documentary",
    description:
      "Pick a documentary on something you know nothing about. Learning something new today will stick with you far longer than you think.",
    keywords: "cinema film watching movie",
  },
  {
    title: "Draw Something",
    description:
      "You don't have to be an artist. Just pick up a pencil and sketch whatever comes to mind. Doodle therapy is real and it works.",
    keywords: "drawing art sketch creative pencil",
  },
  {
    title: "Cook a New Recipe",
    description:
      "Browse a recipe you've never tried before and make it happen tonight. Bonus points if you make enough to share with someone.",
    keywords: "cooking food recipe meal kitchen",
  },
  {
    title: "Try Meditation",
    description:
      "Find a quiet spot and spend 10 minutes breathing intentionally. A free app or YouTube video can guide you if you're new to it.",
    keywords: "meditation zen calm peaceful mindful",
  },
  {
    title: "Listen to a New Album",
    description:
      "Find an album you've never heard — from a genre you rarely explore. Put on headphones and let it play from start to finish.",
    keywords: "music headphones vinyl record listening",
  },
  {
    title: "Take a Long Walk",
    description:
      "No destination required. Put on comfortable shoes, leave your phone in your pocket, and just walk for 30 minutes. Let your mind wander.",
    keywords: "walking path trail nature outdoors",
  },
  {
    title: "Write a Letter",
    description:
      "Write a heartfelt letter to someone who made a difference in your life. You don't have to send it — but you might be glad you did.",
    keywords: "letter writing handwritten envelope",
  },
  {
    title: "Do Something Kind",
    description:
      "Perform one random act of kindness today. Hold a door, pay a genuine compliment, or buy a stranger a coffee. Small things matter.",
    keywords: "kindness flowers gift giving volunteer",
  },
  {
    title: "Start Earlier Tomorrow",
    description:
      "Set your alarm 30 minutes earlier tomorrow. Use that quiet time for something you enjoy before the day gets busy. Make it yours.",
    keywords: "sunrise morning coffee peaceful golden",
  },
];

// ============================================
//   API CONFIG
// ============================================

// Meme API — completely free, no key required
// Docs: https://github.com/D3vd/Meme_Api
// Default endpoint pulls from r/memes, r/dankmemes, r/me_irl
const MEME_API_URL = "https://meme-api.com/gimme";

// Unsplash API key (fill this in with your own Access Key)
const UNSPLASH_ACCESS_KEY = "Ys5OvXhJ0RoureBMSHWQGsyuANfgeYzYh7MQZ1n0FlU";

// Fallback source URL if API key is still empty
const UNSPLASH_FALLBACK_BASE_URL = "https://source.unsplash.com/390x280/?";

function buildUnsplashUrl(keywords) {
  const encoded = encodeURIComponent(keywords);

  // Keep app working even before key is configured
  if (!UNSPLASH_ACCESS_KEY) {
    // sig parameter prevents the browser from caching the same image
    return `${UNSPLASH_FALLBACK_BASE_URL}${encoded}&sig=${Date.now()}`;
  }

  return `https://api.unsplash.com/photos/random?query=${encoded}&orientation=landscape&client_id=${encodeURIComponent(UNSPLASH_ACCESS_KEY)}`;
}

// ============================================
//   APP STATE
// ============================================

const MAX_TOKENS = 6;

let currentTask = null;
let isSpinning = false;
let toastTimeout = null;

let tokens = parseInt(localStorage.getItem("luckyTokens") || "0");

// ============================================
//   DOM REFERENCES
// ============================================

const startPage = document.getElementById("start-page");
const resultPage = document.getElementById("result-page");
const slotsDisplay = document.getElementById("slots-display");
const spinBtn = document.getElementById("spin-btn");
const heartsRow = document.getElementById("hearts-row");
const tokenBarTrack = document.getElementById("token-bar-track");
const tokenCount = document.getElementById("token-count");
const toast = document.getElementById("toast");

// Slot display API elements
const memeImg = document.getElementById("meme-img");
const memeLoading = document.getElementById("meme-loading");
const spinOverlay = document.getElementById("spin-overlay");
const slotEmoji = document.getElementById("slot-emoji");
const slotTaskName = document.getElementById("slot-task-name");

// Result page API elements
const taskImg = document.getElementById("task-img");
const taskImgLoading = document.getElementById("task-img-loading");
const resultTitle = document.getElementById("result-title");
const resultDesc = document.getElementById("result-description");

// ============================================
//   MEME API  (Start page slot display)
// ============================================

async function fetchMeme() {
  // Show spinner, hide any old meme
  memeLoading.classList.remove("hidden");
  memeImg.style.opacity = "0";

  try {
    const response = await fetch(MEME_API_URL);
    if (!response.ok) throw new Error("Meme API response not OK");

    const data = await response.json();

    // Only accept static images (skip videos / gifv)
    if (!data.url || !/\.(jpg|jpeg|png|gif|webp)$/i.test(data.url)) {
      fetchMeme(); // try again
      return;
    }

    // Prefer the highest-res preview thumbnail (better sized for the slot window).
    // Fall back to the raw url if no previews exist.
    const previews = data.preview;
    const imageUrl =
      previews && previews.length > 0
        ? previews[previews.length - 1] // last item = highest resolution preview
        : data.url;

    memeImg.src = imageUrl;

    memeImg.onload = () => {
      memeLoading.classList.add("hidden");
      memeImg.style.opacity = "1";
    };

    memeImg.onerror = () => {
      // Preview URL broken — fall back to raw url, then retry
      if (memeImg.src !== data.url) {
        memeImg.src = data.url;
      } else {
        fetchMeme();
      }
    };
  } catch (err) {
    // API unavailable — just hide the spinner (dark background shows)
    memeLoading.classList.add("hidden");
    console.warn("Could not load meme:", err.message);
  }
}

// ============================================
//   UNSPLASH API  (Result page illustration)
// ============================================

async function fetchTaskImage(task) {
  taskImgLoading.classList.remove("hidden");
  taskImg.style.opacity = "0";

  taskImg.onload = () => {
    taskImgLoading.classList.add("hidden");
    taskImg.style.opacity = "1";
  };

  taskImg.onerror = () => {
    // Image failed to load — hide spinner, leave background colour visible
    taskImgLoading.classList.add("hidden");
  };

  try {
    const url = buildUnsplashUrl(task.keywords);

    // No key yet: use source.unsplash.com fallback URL directly
    if (!UNSPLASH_ACCESS_KEY) {
      taskImg.src = url;
      return;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Unsplash API response not OK");

    const data = await response.json();
    const imageUrl = data?.urls?.regular || data?.urls?.small;

    if (!imageUrl) {
      throw new Error("Unsplash API returned no usable image URL");
    }

    taskImg.src = imageUrl;
  } catch (err) {
    taskImgLoading.classList.add("hidden");
    console.warn("Could not load Unsplash image:", err.message);
  }
}

// ============================================
//   TOKEN SYSTEM
// ============================================

function renderTokens() {
  heartsRow.innerHTML = "";
  for (let i = 0; i < MAX_TOKENS; i++) {
    const heart = document.createElement("span");
    heart.className = "heart" + (i < tokens ? "" : " empty");
    heart.textContent = "♥";
    heartsRow.appendChild(heart);
  }

  tokenBarTrack.innerHTML = "";
  for (let i = 0; i < MAX_TOKENS; i++) {
    const block = document.createElement("div");
    block.className = "token-block" + (i < tokens ? " filled" : "");
    tokenBarTrack.appendChild(block);
  }

  tokenCount.textContent = tokens + " / " + MAX_TOKENS;
}

function addToken() {
  if (tokens < MAX_TOKENS) {
    tokens++;
    localStorage.setItem("luckyTokens", tokens);
    renderTokens();

    const hearts = heartsRow.querySelectorAll(".heart");
    if (hearts[tokens - 1]) {
      hearts[tokens - 1].classList.add("gained");
      setTimeout(() => hearts[tokens - 1].classList.remove("gained"), 500);
    }

    showToast(
      tokens === MAX_TOKENS
        ? "✨ All tokens collected!"
        : "🎉 Lucky token earned!",
    );
  } else {
    showToast("✨ Already at max tokens!");
  }
}

// ============================================
//   SPIN ANIMATION
// ============================================

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  currentTask = TASKS[Math.floor(Math.random() * TASKS.length)];

  const TOTAL_CYCLES = 18;
  let cycleCount = 0;

  // Show the spin overlay on top of the meme image
  spinOverlay.classList.remove("hidden");
  slotsDisplay.classList.add("spinning");

  function cycleOnce() {
    const t = TASKS[Math.floor(Math.random() * TASKS.length)];
    slotEmoji.textContent = t.title.split(" ")[0]; // show first word as placeholder
    slotTaskName.textContent = t.title.toUpperCase();

    cycleCount++;

    if (cycleCount >= TOTAL_CYCLES) {
      // Land on chosen task
      slotsDisplay.classList.remove("spinning");
      slotEmoji.textContent = "🎯";
      slotTaskName.textContent = currentTask.title.toUpperCase();

      setTimeout(() => {
        spinOverlay.classList.add("hidden");
        showResultPage();
        isSpinning = false;
        spinBtn.disabled = false;
      }, 500);
      return;
    }

    // Gradually slow down in last 6 cycles
    let delay = 70;
    if (cycleCount > TOTAL_CYCLES - 6) {
      delay = 70 + (cycleCount - (TOTAL_CYCLES - 6)) * 60;
    }

    setTimeout(cycleOnce, delay);
  }

  cycleOnce();
}

// ============================================
//   PAGE NAVIGATION
// ============================================

function showResultPage() {
  resultTitle.textContent = currentTask.title.toUpperCase();
  resultDesc.textContent = currentTask.description;

  startPage.classList.remove("active");
  resultPage.classList.add("active");
  resultPage.scrollTop = 0;

  // Fetch task image for result page
  fetchTaskImage(currentTask);

  // Silently pre-load next meme in background for when user returns
  fetchMeme();
}

function goBack() {
  resultPage.classList.remove("active");
  startPage.classList.add("active");
}

function respin() {
  goBack();
  setTimeout(spin, 150);
}

// ============================================
//   TASK REACTIONS
// ============================================

function acceptTask() {
  addToken();
  setTimeout(goBack, 1400);
}

function rejectTask() {
  showToast("No worries — try a re-spin!");
}

// ============================================
//   TOAST
// ============================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ============================================
//   BOOT
// ============================================

function init() {
  renderTokens();
  fetchMeme(); // Load first meme on page load
}

init();
