const modeButtons = document.querySelectorAll(".mode-btn");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const storyText = document.getElementById("storyText");
const choicesContainer = document.getElementById("choices");
const modeLabel = document.getElementById("modeLabel");
const sceneLabel = document.getElementById("sceneLabel");
const restartBtn = document.getElementById("restartBtn");
const bgAudio = document.getElementById("bgAudio");
const clickSound = document.getElementById("clickSound");
const typeSound = document.getElementById("typeSound");
const sceneSound = document.getElementById("sceneSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");
const character = document.getElementById("character");
const backgroundOverlay = document.querySelector(".background-overlay");

// Sound configuration elements
const soundConfig = document.getElementById("soundConfig");
const toggleConfig = document.getElementById("toggleConfig");
const soundEnabled = document.getElementById("soundEnabled");
const bgVolume = document.getElementById("bgVolume");
const clickVolume = document.getElementById("clickVolume");
const bgVolumeValue = document.getElementById("bgVolumeValue");
const clickVolumeValue = document.getElementById("clickVolumeValue");
const statusText = document.getElementById("statusText");
const aidenStatus = document.getElementById("aidenStatus");
const celebration = document.getElementById("celebration");

let currentModeKey = null;
let currentSceneKey = null;
let typingTimeout = null;
let soundsInitialized = false;
let audioContext = null;
let currentSpeech = null;
let celebrationTimeout = null;
let speechQueue = [];
let isGameEnding = false;

// Character emojis for each mode
const characterEmojis = {
  forest: {
    default: "🌲",
    start: "🧙",
    river: "🌊",
    beast: "🐺",
    canopy: "🌳",
    escape: "🏃",
    camp: "🔥",
    exit: "✨",
  },
  ghost: {
    default: "👻",
    start: "🏚️",
    portraits: "🖼️",
    staircase: "🕯️",
    library: "📚",
    attic: "⚰️",
    liberation: "☀️",
  },
  survive: {
    default: "🏝️",
    start: "🌊",
    wreckage: "⚓",
    jungle: "🌴",
    signal: "🔥",
    cave: "🕳️",
    rescue: "🚢",
  },
};

// Background overlay images for each scene
const backgroundImages = {
  forest: {
    default: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
    "forest-dawn": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=80",
    "forest-river": "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80",
    "forest-beast": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=80",
  },
  ghost: {
    default: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
    "ghost-halls": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
    "ghost-attic": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=80",
    "ghost-liberation": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80",
  },
  survive: {
    default: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1600&q=80",
    "survive-beach": "https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1600&q=80",
    "survive-interior": "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80",
    "survive-rescue": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80",
  },
};

// Get or create audio context (reuse to avoid bugs)
function getAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext creation failed:", e);
      return null;
    }
  }
  
  return audioContext;
}

// Ensure audio context is running before playing sounds
async function ensureAudioContextReady() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return ctx.state === 'running';
    } catch (err) {
      console.error("Failed to resume audio context:", err);
      return false;
    }
  }
  
  return ctx.state === 'running';
}

// Generate sounds programmatically using Web Audio API
async function generateClickSound() {
  const isReady = await ensureAudioContextReady();
  if (!isReady) {
    enableSoundsOnce();
    return;
  }
  
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    const volume = soundEnabled && soundEnabled.checked ? (clickVolume ? clickVolume.value / 100 : 0.5) : 0;
    if (volume <= 0) return;
    
    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Click sound error:", e);
  }
}

async function generateTypeSound() {
  const isReady = await ensureAudioContextReady();
  if (!isReady) return;
  
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 400;
    oscillator.type = 'square';
    
    const volume = soundEnabled && soundEnabled.checked ? (clickVolume ? clickVolume.value / 100 : 0.5) : 0;
    if (volume <= 0) return;
    
    gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Ignore type sound errors
  }
}

async function generateSceneSound() {
  const isReady = await ensureAudioContextReady();
  if (!isReady) {
    enableSoundsOnce();
    return;
  }
  
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    oscillator.type = 'sine';
    
    const volume = soundEnabled && soundEnabled.checked ? (clickVolume ? clickVolume.value / 100 : 0.5) : 0;
    if (volume <= 0) return;
    
    gainNode.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Scene sound error:", e);
  }
}

async function generateWinSound() {
  const isReady = await ensureAudioContextReady();
  if (!isReady) {
    enableSoundsOnce();
    return;
  }
  
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  
  try {
    const volume = soundEnabled && soundEnabled.checked ? (clickVolume ? clickVolume.value / 100 : 0.5) : 0;
    if (volume <= 0) return;
    
    const baseTime = ctx.currentTime;
    
    // Play cheering chord progression
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = baseTime + (i * 0.08);
      gainNode.gain.setValueAtTime(volume * 0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
    
    // Add cheering effect (multiple overlapping tones) - use currentTime from context
    const cheerStartTime = baseTime + 0.2;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800 + (i * 100);
      osc.type = 'sine';
      const start = cheerStartTime + (i * 0.1);
      gain.gain.setValueAtTime(volume * 0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
      osc.start(start);
      osc.stop(start + 0.2);
    }
  } catch (e) {
    console.error("Win sound error:", e);
  }
}

async function generateLoseSound() {
  const isReady = await ensureAudioContextReady();
  if (!isReady) {
    enableSoundsOnce();
    return;
  }
  
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    oscillator.type = 'sawtooth';
    
    const volume = soundEnabled && soundEnabled.checked ? (clickVolume ? clickVolume.value / 100 : 0.5) : 0;
    if (volume <= 0) return;
    
    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Lose sound error:", e);
  }
}

// AIDEN Text-to-Speech functions
function stopAidenSpeech() {
  // Cancel all speech synthesis immediately
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  // Clear current speech reference
  currentSpeech = null;
  
  // Clear speech queue
  speechQueue = [];
  
  // Update status indicator
  if (aidenStatus) {
    aidenStatus.classList.remove("speaking");
  }
  
  // Reset game ending flag
  isGameEnding = false;
}

function aidenSpeak(text, callback) {
  // Don't speak if game is ending or sounds disabled
  if (isGameEnding || !soundEnabled || !soundEnabled.checked) {
    if (callback) callback();
    return;
  }
  
  // Stop any ongoing speech first
  stopAidenSpeech();
  
  if (!('speechSynthesis' in window)) {
    if (callback) callback();
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Male') || 
    v.name.includes('David') || 
    v.name.includes('Mark') ||
    v.lang.startsWith('en')
  ) || voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.onstart = () => {
    // Check if game is ending before starting
    if (isGameEnding) {
      window.speechSynthesis.cancel();
      return;
    }
    if (aidenStatus) {
      aidenStatus.classList.add("speaking");
    }
  };
  
  utterance.onend = () => {
    if (aidenStatus) {
      aidenStatus.classList.remove("speaking");
    }
    currentSpeech = null;
    if (!isGameEnding && callback) callback();
  };
  
  utterance.onerror = () => {
    if (aidenStatus) {
      aidenStatus.classList.remove("speaking");
    }
    currentSpeech = null;
    if (!isGameEnding && callback) callback();
  };
  
  // Only speak if game is not ending
  if (!isGameEnding) {
    currentSpeech = utterance;
    window.speechSynthesis.speak(utterance);
  } else {
    if (callback) callback();
  }
}

// Initialize sounds - use Web Audio API directly
function initializeSounds() {
  if (soundsInitialized) return;
  
  // Initialize AudioContext and ensure it's ready
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    // User interaction required - will be unlocked on first click
    ctx.resume().then(() => {
      updateSoundStatus("Sounds ready");
    }).catch(() => {
      updateSoundStatus("Click to enable");
    });
  } else if (ctx) {
    updateSoundStatus("Sounds ready");
  }
  
  // Load voices for speech synthesis
  if ('speechSynthesis' in window) {
    // Chrome needs voices to be loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        if (ctx && ctx.state === 'running') {
          updateSoundStatus("AIDEN ready");
        } else {
          updateSoundStatus("Click to enable");
        }
      }, { once: true });
    } else {
      if (ctx && ctx.state === 'running') {
        updateSoundStatus("AIDEN ready");
      } else {
        updateSoundStatus("Click to enable");
      }
    }
  } else {
    if (ctx && ctx.state === 'running') {
      updateSoundStatus("Sounds ready");
    } else {
      updateSoundStatus("Click to enable");
    }
  }
  
  // Set up volume controls
  bgVolume.addEventListener("input", (e) => {
    const vol = e.target.value / 100;
    bgAudio.volume = vol;
    bgVolumeValue.textContent = e.target.value + "%";
  });
  
  clickVolume.addEventListener("input", (e) => {
    const vol = e.target.value / 100;
    clickSound.volume = vol;
    typeSound.volume = vol;
    sceneSound.volume = vol;
    winSound.volume = vol;
    loseSound.volume = vol;
    clickVolumeValue.textContent = e.target.value + "%";
  });
  
  // Sound enable/disable
  soundEnabled.addEventListener("change", (e) => {
    if (!e.target.checked) {
      bgAudio.pause();
      updateSoundStatus("Sounds disabled");
    } else {
      updateSoundStatus("Sounds enabled");
    }
  });
  
  // Toggle config panel
  toggleConfig.addEventListener("click", () => {
    soundConfig.classList.toggle("collapsed");
    toggleConfig.textContent = soundConfig.classList.contains("collapsed") ? "+" : "−";
  });
  
  soundsInitialized = true;
}

function loadSoundWithFallback(audioElement, urls, onSuccess) {
  let currentIndex = 0;
  
  function tryLoad() {
    if (currentIndex >= urls.length) {
      updateSoundStatus("Sound load failed");
      return;
    }
    
    audioElement.src = urls[currentIndex];
    audioElement.load();
    
    audioElement.addEventListener("canplaythrough", () => {
      if (onSuccess) onSuccess();
    }, { once: true });
    
    audioElement.addEventListener("error", () => {
      currentIndex++;
      tryLoad();
    }, { once: true });
  }
  
  tryLoad();
}

function updateSoundStatus(message) {
  if (statusText) {
    statusText.textContent = message;
    // Clear status after 2 seconds
    setTimeout(() => {
      if (statusText.textContent === message) {
        statusText.textContent = "Ready";
      }
    }, 2000);
  }
}

const gameModes = {
  forest: {
    title: "Forest Escape",
    emoji: "🌲",
    audio:
      "https://cdn.pixabay.com/download/audio/2021/10/08/audio_8b2be3b264.mp3?filename=haunted-forest-ambient-9623.mp3",
    scenes: {
      start: {
        label: "Forest Wake",
        background: "forest-dawn",
        text: `You wake beneath towering pines. A faint river hums eastward; unsettling rustling shivers from the west.`,
        choices: [
          { text: "Head toward the river's call.", next: "river" },
          { text: "Investigate the rustling west.", next: "beast" },
          { text: "Climb a nearby tree to scout.", next: "canopy" },
        ],
      },
      river: {
        label: "Shimmering Bridge",
        background: "forest-river",
        text: `An old rope bridge sways over a misty gorge. The boards groan but a faint light glows beyond.`,
        choices: [
          { text: "Cross carefully.", next: "exit", outcome: "win" },
          { text: "Cut the ropes to prevent pursuit.", next: "cutBridge" },
          { text: "Search nearby for another path.", next: "bog" },
        ],
      },
      beast: {
        label: "Predator's Den",
        background: "forest-beast",
        text: `Amber eyes flash from the shadows. A wolf circles. Your heartbeat drums louder than the forest.`,
        choices: [
          { text: "Stand tall and growl back.", next: "standoff", outcome: "lose" },
          { text: "Toss a shiny stone to distract.", next: "escape" },
        ],
      },
      canopy: {
        label: "Canopy Watch",
        background: "forest-dawn",
        text: `From the treetop you glimpse smoke north and storm clouds south.`,
        choices: [
          { text: "Head toward the smoke.", next: "camp" },
          { text: "Race south before the storm.", next: "storm", outcome: "lose" },
        ],
      },
      cutBridge: {
        label: "Severed Bridge",
        background: "forest-beast",
        text: `The ropes snap. The echo alerts something ancient. Roots coil around your ankles.`,
        choices: [
          { text: "Hack free and run!", next: "escape" },
          { text: "Call out for help.", next: "entangle", outcome: "lose" },
        ],
      },
      bog: {
        label: "Whispering Bog",
        background: "forest-beast",
        text: `Thick fog rises. The ground liquefies into mire.`,
        choices: [
          { text: "Use fallen branches as stepping stones.", next: "escape" },
          { text: "Turn back fast.", next: "river" },
        ],
      },
      standoff: {
        label: "Alpha Clash",
        background: "forest-beast",
        text: `The wolf lunges. Your bravado wasn't enough.`,
        terminal: true,
        ending: "lose",
      },
      escape: {
        label: "Forest Edge",
        background: "forest-dawn",
        text: `You burst through brush to find travelers. They guide you out. You survive, wiser for the wild.`,
        terminal: true,
        ending: "win",
      },
      camp: {
        label: "Hidden Camp",
        background: "forest-dawn",
        text: `Friendly foragers share maps and shelter. You plan a path out with their help.`,
        terminal: true,
        ending: "win",
      },
      storm: {
        label: "Storm Surge",
        background: "forest-beast",
        text: `Lightning splits the old tree. Darkness follows.`,
        terminal: true,
        ending: "lose",
      },
      entangle: {
        label: "Root Snare",
        background: "forest-beast",
        text: `The forest keeps its secrets.`,
        terminal: true,
        ending: "lose",
      },
      exit: {
        label: "Sunlit Clearing",
        background: "forest-dawn",
        text: `Across the bridge a path leads out. Fresh breeze tastes like freedom.`,
        terminal: true,
        ending: "win",
      },
    },
  },
  ghost: {
    title: "Ghost Escape",
    emoji: "👻",
    audio:
      "https://cdn.pixabay.com/download/audio/2021/12/08/audio_9dd98ec663.mp3?filename=ambient-ghost-vibes-121540.mp3",
    scenes: {
      start: {
        label: "Very Quiet Hall",
        background: "ghost-halls",
        text: `The mansion doors slam shut. Portrait eyes follow you; a cold draft whispers secrets.`,
        choices: [
          { text: "Inspect the portraits.", next: "portraits" },
          { text: "Follow the draft upstairs.", next: "staircase" },
          { text: "Search the library.", next: "library" },
        ],
      },
      portraits: {
        label: "Gallery of Echoes",
        background: "ghost-halls",
        text: `Each painting shows someone escaping. A hidden latch clicks behind one frame.`,
        choices: [
          { text: "Pull the frame to open passage.", next: "secretPassage" },
          { text: "Ignore it and return to hall.", next: "start" },
        ],
      },
      staircase: {
        label: "Floating Stair",
        background: "ghost-attic",
        text: `Steps creak. A spectral child blocks your way, offering two candles.`,
        choices: [
          { text: "Take the blue candle.", next: "attic", outcome: "lose" },
          { text: "Take the white candle.", next: "atticSafe" },
        ],
      },
      library: {
        label: "Dusty Library",
        background: "ghost-halls",
        text: `Books shuffle themselves into words: "Name the house, claim your life."`,
        choices: [
          { text: "Search for the family name.", next: "journal" },
          { text: "Burn the whispering book.", next: "fire", outcome: "lose" },
        ],
      },
      secretPassage: {
        label: "Secret Passage",
        background: "ghost-attic",
        text: `A tunnel leads to the attic bell. Rope fibers glow with ether.`,
        choices: [
          { text: "Ring the bell.", next: "liberation", ending: "win" },
          { text: "Cut the rope.", next: "wail", outcome: "lose" },
        ],
      },
      attic: {
        label: "Cursed Attic",
        background: "ghost-attic",
        text: `The blue flame freezes you in place as spirits swarm.`,
        terminal: true,
        ending: "lose",
      },
      atticSafe: {
        label: "Guided Flame",
        background: "ghost-attic",
        text: `The white flame reveals sigils pointing to a hidden door.`,
        choices: [
          { text: "Follow sigils to rooftop.", next: "liberation", ending: "win" },
          { text: "Extinguish flame to rest.", next: "sleep", outcome: "lose" },
        ],
      },
      journal: {
        label: "Ancestor's Journal",
        background: "ghost-halls",
        text: `You learn the house belongs to the Morcant family.`,
        choices: [
          { text: "Speak the name aloud.", next: "liberation", ending: "win" },
          { text: "Keep reading for clues.", next: "wail", outcome: "lose" },
        ],
      },
      fire: {
        label: "Backdraft",
        background: "ghost-attic",
        text: `Flames awaken furious spirits.`,
        terminal: true,
        ending: "lose",
      },
      wail: {
        label: "Banshee's Wail",
        background: "ghost-attic",
        text: `A shriek shatters your senses.`,
        terminal: true,
        ending: "lose",
      },
      sleep: {
        label: "Endless Dream",
        background: "ghost-attic",
        text: `You never wake.`,
        terminal: true,
        ending: "lose",
      },
      liberation: {
        label: "First Light",
        background: "ghost-liberation",
        text: `The mansion sighs. Doors swing open as dawn washes the curse away.`,
        terminal: true,
        ending: "win",
      },
    },
  },
  survive: {
    title: "Survive Escape",
    emoji: "🏝",
    audio:
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_fecd6f8cd0.mp3?filename=calm-ocean-waves-ambient-110117.mp3",
    scenes: {
      start: {
        label: "Shoreline Awakening",
        background: "survive-beach",
        text: `Waves lap at your feet. Inland jungle hums. A storm brews on the horizon.`,
        choices: [
          { text: "Search the wreckage for supplies.", next: "wreckage" },
          { text: "Head into the jungle.", next: "jungle" },
          { text: "Signal from the beach.", next: "signal" },
        ],
      },
      wreckage: {
        label: "Broken Hull",
        background: "survive-beach",
        text: `You find flares, rope, and a cracked compass.`,
        choices: [
          { text: "Build a raft immediately.", next: "raft", outcome: "lose" },
          { text: "Gather supplies then scout.", next: "jungle" },
        ],
      },
      jungle: {
        label: "Dense Interior",
        background: "survive-interior",
        text: `Humidity suffocates as you spot fruit trees and a cave entrance.`,
        choices: [
          { text: "Collect fruit for energy.", next: "fruit" },
          { text: "Inspect the cave.", next: "cave" },
        ],
      },
      signal: {
        label: "Beach Signal",
        background: "survive-beach",
        text: `You form a massive SOS with driftwood, but clouds roll in.`,
        choices: [
          { text: "Light the signal with flare.", next: "rescue", ending: "win" },
          { text: "Save the flare for later.", next: "nightfall" },
        ],
      },
      raft: {
        label: "Fragile Raft",
        background: "survive-beach",
        text: `Waves shatter your raft. You're pulled under.`,
        terminal: true,
        ending: "lose",
      },
      fruit: {
        label: "Energy Boost",
        background: "survive-interior",
        text: `Strength renewed, you spot smoke from an island ridge.`,
        choices: [
          { text: "Climb toward the ridge.", next: "signal" },
          { text: "Return to beach with supplies.", next: "signal" },
        ],
      },
      cave: {
        label: "Cave Shelter",
        background: "survive-interior",
        text: `Inside, bioluminescent algae reveal ancient carvings of stars.`,
        choices: [
          { text: "Sleep safely here.", next: "nightfall" },
          { text: "Mark the constellations.", next: "navigation", ending: "win" },
        ],
      },
      nightfall: {
        label: "Storm Night",
        background: "survive-interior",
        text: `A tropical storm thrashes the island. Your chance slips away.`,
        terminal: true,
        ending: "lose",
      },
      rescue: {
        label: "Rescue Incoming",
        background: "survive-rescue",
        text: `A distant ship sees your blazing signal. You're heading home.`,
        terminal: true,
        ending: "win",
      },
      navigation: {
        label: "Star Path",
        background: "survive-rescue",
        text: `Using the carvings, you chart a precise route. A week later, sails dot the horizon.`,
        terminal: true,
        ending: "win",
      },
    },
  },
};

modeButtons.forEach((button) =>
  button.addEventListener("click", () => {
    playClickSound();
    startGame(button.dataset.mode);
  })
);

restartBtn.addEventListener("click", () => {
  playClickSound();
  resetGame();
});

function startGame(modeKey) {
  currentModeKey = modeKey;
  currentSceneKey = "start";

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  document.body.className = `mode-${modeKey}`;

  character.classList.remove("hidden");
  updateCharacter();
  updateBackgroundOverlay();
  updateScene();
  playAudioForMode(modeKey);
}

function showCelebration() {
  if (!celebration) return;
  
  // Stop all speech when celebration starts
  isGameEnding = true;
  stopAidenSpeech();
  
  // Add celebration mode to body
  document.body.classList.add("celebration-mode");
  
  // Show celebration overlay
  celebration.classList.remove("hidden");
  
  // Create additional confetti dynamically
  createConfetti();
  
  // Hide celebration after 6 seconds
  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout);
  }
  
  celebrationTimeout = setTimeout(() => {
    hideCelebration();
  }, 6000);
}

function createConfetti() {
  const colors = ['#7dff72', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];
  const celebrationContent = celebration.querySelector('.celebration-content');
  
  // Create 20 more confetti pieces
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
    celebrationContent.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, 5000);
  }
}

function hideCelebration() {
  if (celebration) {
    celebration.classList.add("hidden");
  }
  document.body.classList.remove("celebration-mode");
  
  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout);
    celebrationTimeout = null;
  }
}

function resetGame() {
  // Stop everything immediately
  isGameEnding = true;
  stopAudio();
  stopAidenSpeech();
  hideCelebration();
  
  // Reset all game state
  currentModeKey = null;
  currentSceneKey = null;
  isGameEnding = false; // Reset flag for next game
  document.body.className = "";
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  character.classList.add("hidden");
  storyText.textContent = "The console hums, awaiting your input...";
  choicesContainer.innerHTML = "";
  backgroundOverlay.style.backgroundImage = 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80")';
}

function updateScene() {
  const mode = gameModes[currentModeKey];
  if (!mode) return;

  const scene = mode.scenes[currentSceneKey];
  if (!scene) return;

  // Stop any ongoing speech immediately
  stopAidenSpeech();
  
  // Check if this is a terminal scene (game ending)
  if (scene.terminal) {
    isGameEnding = true;
    stopAidenSpeech(); // Stop all speech when game ends
  } else {
    isGameEnding = false;
  }

  // Play scene transition sound
  playSceneSound();

  modeLabel.textContent = `${mode.emoji} ${mode.title}`;
  sceneLabel.textContent = scene.label;

  updateBackground(scene.background);
  updateBackgroundOverlay(scene.background);
  updateCharacter();
  
  typeStory(scene.text, () => {
    // Only continue with speech if game is not ending
    if (isGameEnding) {
      stopAidenSpeech();
      return;
    }
    
    // After story is typed, AIDEN reads it, then reads options
    aidenSpeak(scene.text, () => {
      // Only continue if game is not ending
      if (isGameEnding) {
        stopAidenSpeech();
        return;
      }
      
      // After story is read, read the choices (only if not terminal)
      if (!scene.terminal && scene.choices && scene.choices.length > 0) {
        const choicesText = scene.choices.map((c, i) => `Option ${i + 1}: ${c.text}`).join('. ');
        aidenSpeak(`Your choices are: ${choicesText}`);
      }
    });
  });
  renderChoices(scene);
}

function typeStory(text, callback) {
  if (typingTimeout) {
    clearInterval(typingTimeout);
  }

  const characters = [...text];
  storyText.textContent = "";
  let index = 0;
  let typeSoundInterval = null;

  // Start typewriter sound
  if (soundEnabled && soundEnabled.checked) {
    playTypeSound();
    // Play typewriter sound periodically during typing
    typeSoundInterval = setInterval(() => {
      if (index < characters.length) {
        playTypeSound();
      } else {
        clearInterval(typeSoundInterval);
      }
    }, 100);
  }

  typingTimeout = setInterval(() => {
    storyText.textContent += characters[index];
    index += 1;

    if (index === characters.length) {
      clearInterval(typingTimeout);
      if (typeSoundInterval) {
        clearInterval(typeSoundInterval);
      }
      if (callback) callback();
    }
  }, 25);
}

function renderChoices(scene) {
  choicesContainer.innerHTML = "";

  if (scene.terminal) {
    // Stop all speech immediately when terminal scene is reached
    isGameEnding = true;
    stopAidenSpeech();
    
    // Play win or lose sound for terminal scenes
    if (scene.ending === "win") {
      // Show celebration animation
      showCelebration();
      playWinSound();
      // AIDEN cheers for the player (only once, then stops)
      setTimeout(() => {
        if (!isGameEnding) return; // Double check
        aidenSpeak("Congratulations! You escaped! Well done, adventurer!");
      }, 500);
    } else if (scene.ending === "lose") {
      playLoseSound();
      setTimeout(() => {
        if (!isGameEnding) return; // Double check
        aidenSpeak("Unfortunately, fate had other plans. Better luck next time.");
      }, 500);
    }
    
    const status =
      scene.ending === "win"
        ? "You escaped!"
        : "Fate had other plans...";
    const statusBtn = document.createElement("button");
    statusBtn.className = "choice-btn";
    statusBtn.textContent = `${status} — Play again`;
    statusBtn.addEventListener("click", () => {
      playClickSound();
      stopAidenSpeech();
      resetGame();
    });
    choicesContainer.appendChild(statusBtn);
    return;
  }

  scene.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.text;
    btn.addEventListener("click", () => {
      playClickSound();
      stopAidenSpeech(); // Stop AIDEN when choice is made
      animateCharacter();
      handleChoice(choice);
    });
    
    // Add hover to read option (only if game is not ending)
    btn.addEventListener("mouseenter", () => {
      if (!isGameEnding && soundEnabled && soundEnabled.checked && !currentSpeech) {
        aidenSpeak(`Option ${index + 1}: ${choice.text}`);
      }
    });
    
    choicesContainer.appendChild(btn);
  });
}

function handleChoice(choice) {
  if (choice.next) {
    currentSceneKey = choice.next;
    updateScene();
  } else if (choice.ending) {
    revealEnding(choice.ending);
  }
}

function revealEnding(result) {
  // Stop all speech immediately when ending is revealed
  isGameEnding = true;
  stopAidenSpeech();
  
  // Play win or lose sound
  if (result === "win") {
    // Show celebration animation
    showCelebration();
    playWinSound();
    storyText.textContent = "You found a hidden path to freedom!";
    // AIDEN cheers (only once, then stops)
    setTimeout(() => {
      if (isGameEnding) {
        aidenSpeak("Excellent! You found a hidden path to freedom! Congratulations!");
      }
    }, 500);
  } else {
    playLoseSound();
    storyText.textContent = "The shadows close in...";
    setTimeout(() => {
      if (isGameEnding) {
        aidenSpeak("The shadows close in. Don't give up, try again!");
      }
    }, 500);
  }
  
  choicesContainer.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "choice-btn";
  btn.textContent = "Restart Adventure";
  btn.addEventListener("click", () => {
    playClickSound();
    stopAidenSpeech();
    resetGame();
  });
  choicesContainer.appendChild(btn);
}

function updateBackground(backgroundClass = "") {
  const base = `mode-${currentModeKey}`;
  const sceneClass = backgroundClass ? `scene-${backgroundClass}` : "";
  document.body.className = `${base} ${sceneClass}`.trim();
}

function playAudioForMode(modeKey) {
  if (!soundEnabled || !soundEnabled.checked) return;
  
  const audioSrc = gameModes[modeKey]?.audio;
  if (!audioSrc) return;
  
  bgAudio.src = audioSrc;
  bgAudio.volume = bgVolume.value / 100;
  
  const playPromise = bgAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        updateSoundStatus("Music playing");
      })
      .catch((error) => {
        updateSoundStatus("Click to enable music");
        // User interaction required
        document.addEventListener("click", () => {
          bgAudio.play().catch(() => {});
        }, { once: true });
      });
  }
}

function stopAudio() {
  bgAudio.pause();
  bgAudio.currentTime = 0;
  bgAudio.removeAttribute("src");
}

function playClickSound() {
  if (!soundEnabled || !soundEnabled.checked) return;
  
  // Play sound asynchronously to ensure context is ready
  generateClickSound().catch((error) => {
    console.error("Click sound error:", error);
    enableSoundsOnce();
  });
}

async function enableSoundsOnce() {
  // Try to unlock audio context
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
      updateSoundStatus("Audio unlocked");
    } catch (err) {
      updateSoundStatus("Click to enable");
    }
  } else if (ctx && ctx.state === 'running') {
    updateSoundStatus("Audio ready");
  } else {
    updateSoundStatus("Click to enable");
  }
}

function playTypeSound() {
  if (!soundEnabled || !soundEnabled.checked) return;
  
  // Play sound asynchronously
  generateTypeSound().catch(() => {
    // Ignore errors silently for typing sounds
  });
}

function playSceneSound() {
  if (!soundEnabled || !soundEnabled.checked) return;
  
  // Play sound asynchronously
  generateSceneSound().catch((error) => {
    console.error("Scene sound error:", error);
    enableSoundsOnce();
  });
}

function playWinSound() {
  if (!soundEnabled || !soundEnabled.checked) return;
  
  // Play sound asynchronously
  generateWinSound().catch((error) => {
    console.error("Win sound error:", error);
    enableSoundsOnce();
  });
}

function playLoseSound() {
  if (!soundEnabled || !soundEnabled.checked) return;
  
  // Play sound asynchronously
  generateLoseSound().catch((error) => {
    console.error("Lose sound error:", error);
    enableSoundsOnce();
  });
}

function animateCharacter() {
  character.classList.add("click-animation");
  setTimeout(() => {
    character.classList.remove("click-animation");
  }, 400);
}

function updateCharacter(sceneBackground = null) {
  if (!currentModeKey || !currentSceneKey) return;
  
  const modeChars = characterEmojis[currentModeKey];
  if (!modeChars) return;

  // Try to get scene-specific character based on currentSceneKey
  let charEmoji = modeChars[currentSceneKey] || modeChars.default;
  
  // Map specific scenes to characters
  if (currentModeKey === "forest") {
    if (currentSceneKey === "river") charEmoji = modeChars.river || charEmoji;
    else if (currentSceneKey === "beast" || currentSceneKey === "standoff" || currentSceneKey === "cutBridge" || currentSceneKey === "bog" || currentSceneKey === "entangle" || currentSceneKey === "storm") {
      charEmoji = modeChars.beast || charEmoji;
    }
    else if (currentSceneKey === "canopy") charEmoji = modeChars.canopy || charEmoji;
    else if (currentSceneKey === "escape" || currentSceneKey === "camp" || currentSceneKey === "exit") {
      charEmoji = modeChars.escape || modeChars.exit || charEmoji;
    }
  } else if (currentModeKey === "ghost") {
    if (currentSceneKey === "portraits") charEmoji = modeChars.portraits || charEmoji;
    else if (currentSceneKey === "staircase" || currentSceneKey === "attic" || currentSceneKey === "atticSafe") {
      charEmoji = modeChars.staircase || modeChars.attic || charEmoji;
    }
    else if (currentSceneKey === "library" || currentSceneKey === "journal") charEmoji = modeChars.library || charEmoji;
    else if (currentSceneKey === "liberation") charEmoji = modeChars.liberation || charEmoji;
  } else if (currentModeKey === "survive") {
    if (currentSceneKey === "wreckage") charEmoji = modeChars.wreckage || charEmoji;
    else if (currentSceneKey === "jungle" || currentSceneKey === "fruit" || currentSceneKey === "cave" || currentSceneKey === "nightfall") {
      charEmoji = modeChars.jungle || charEmoji;
    }
    else if (currentSceneKey === "signal" || currentSceneKey === "raft") charEmoji = modeChars.signal || charEmoji;
    else if (currentSceneKey === "rescue" || currentSceneKey === "navigation") charEmoji = modeChars.rescue || charEmoji;
  }

  character.textContent = charEmoji;
}

function updateBackgroundOverlay(sceneBackground = "") {
  if (!currentModeKey) return;

  const modeImages = backgroundImages[currentModeKey];
  if (!modeImages) return;

  let imageUrl = modeImages.default;
  
  if (sceneBackground) {
    // Try to get scene-specific image
    imageUrl = modeImages[sceneBackground] || modeImages.default;
  }

  backgroundOverlay.style.backgroundImage = `url("${imageUrl}")`;
  backgroundOverlay.style.opacity = "0.4";
}

// Initialize everything when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Check if sound config elements exist
  if (soundConfig && toggleConfig && soundEnabled && bgVolume && clickVolume) {
    initializeSounds();
    updateSoundStatus("Ready");
    
    // Preload click sound on first user interaction
    const initOnClick = () => {
      if (!soundsInitialized) {
        initializeSounds();
      }
      enableSoundsOnce();
    };
    document.addEventListener("click", initOnClick, { once: true });
  } else {
    console.warn("Sound configuration elements not found");
  }
});



