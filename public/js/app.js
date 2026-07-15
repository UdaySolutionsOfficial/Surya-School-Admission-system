// ==========================================================================
// 1. Lightweight Canvas Particle System
// ==========================================================================
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(init = false) {
    this.x = Math.random() * canvas.width;
    this.y = init ? Math.random() * canvas.height : canvas.height + 10;
    this.size = Math.random() * 2 + 1;
    this.speedX = Math.random() * 0.4 - 0.2;
    this.speedY = -(Math.random() * 0.4 + 0.1); // Slow float up
    // 50% Royal Blue, 50% Soft Gold
    this.color = Math.random() > 0.5 ? 'rgba(15, 76, 129, 0.08)' : 'rgba(212, 175, 55, 0.08)';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
      this.reset(false);
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(35, Math.floor(window.innerWidth / 12));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}
initParticles();

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();


// ==========================================================================
// 2. V2 GSAP Loader Animation (Zoom-Out with glow, no spin)
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  restoreDrafts();
  
  // Set initial zoomed state for the luxury logo
  gsap.set('.loader-logo-v2', {
    scale: 2.2,
    opacity: 0,
    filter: 'drop-shadow(0 0 0px rgba(212, 175, 55, 0))'
  });

  // Start loader sequence
  const tl = gsap.timeline();

  // Step 1: Smooth fade and zoom-out
  tl.to('.loader-logo-v2', {
    opacity: 1,
    scale: 1.0,
    filter: 'drop-shadow(0 0 25px rgba(212, 175, 55, 0.6))',
    duration: 2.0,
    ease: 'power2.out'
  })
  // Step 2: Fade in welcome text elements within loader
  .to('.loader-welcome-text', {
    opacity: 1,
    y: -10,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=1.0')
  // Step 3: Trigger full app reveal
  .to('.loader-status-text', {
    opacity: 0,
    duration: 0.2,
    onComplete: () => {
      const el = document.querySelector('.loader-status-text');
      if (el) el.textContent = 'Redirecting to secure portal...';
    }
  }, '-=0.2')
  .to('.loader-status-text', {
    opacity: 1,
    duration: 0.2
  })
  .to({}, {
    duration: 0.2,
    onComplete: triggerAppReveal
  });
});

function triggerAppReveal() {
  // Fade out loader overlay
  gsap.to('#portal-loader', {
    opacity: 0,
    duration: 0.6,
    onComplete: () => {
      document.getElementById('portal-loader').style.display = 'none';
    }
  });

  // Reveal application main container
  const appContainer = document.getElementById('app-container');
  appContainer.classList.remove('app-hidden');

  // GSAP Choreographed Entry
  const tl = gsap.timeline();

  tl.from('.header-logo-wrapper', {
    scale: 0.5,
    opacity: 0,
    duration: 0.6,
    ease: 'back.out(1.5)'
  })
  .from('.welcome-label', {
    y: 15,
    opacity: 0,
    duration: 0.4
  }, '-=0.3')
  .from('.school-name', {
    y: 20,
    opacity: 0,
    duration: 0.5
  }, '-=0.2')
  .from('.tagline', {
    y: 10,
    opacity: 0,
    duration: 0.4
  }, '-=0.3')
  .from('.location-badge', {
    scale: 0.8,
    opacity: 0,
    duration: 0.4
  }, '-=0.2')
  
  // Card slide up
  .from('.admission-card', {
    y: 80,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  }, '-=0.3')
  .from('.card-header h2, .card-header p, .header-accent', {
    x: -20,
    opacity: 0,
    stagger: 0.1,
    duration: 0.4
  }, '-=0.5')
  .from('.staggered-reveal', {
    y: 20,
    opacity: 0,
    stagger: 0.06,
    duration: 0.4,
    ease: 'power2.out'
  }, '-=0.3')
  .from('.floating-btn', {
    scale: 0,
    stagger: 0.12,
    duration: 0.4,
    ease: 'back.out(2)'
  }, '-=0.4');
}


// ==========================================================================
// 3. Dynamic Sparkle & Confetti Generator (Certificate Effect)
// ==========================================================================
function startCertificateSparkles() {
  const container = document.querySelector('.sparkles-container');
  container.innerHTML = ''; // Reset container

  const sparkleCount = 45;
  const colors = ['#D4AF37', '#F9E7B9', '#FFFFFF', '#1D6FB7'];

  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.classList.add('sparkle');

    // Randomize layout properties
    const size = Math.random() * 6 + 3; // 3px to 9px
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 2.5}s`;
    sparkle.style.animationDuration = `${Math.random() * 2 + 2}s`;
    sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    // 40% chance of diamond star shape
    if (Math.random() > 0.6) {
      sparkle.style.borderRadius = '0';
      sparkle.style.transform = 'rotate(45deg)';
    }

    container.appendChild(sparkle);
  }
}

// ==========================================================================
// 4. Form Handling, Local Storage Autosave & Educational Progress Loader
// ==========================================================================
const DRAFT_STORAGE_KEY = 'surya_school_admission_draft';
const form = document.getElementById('admission-form');
const submitBtn = document.getElementById('submit-btn');

// Restore Form inputs from localStorage
function restoreDrafts() {
  const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!savedData) return;

  try {
    const fields = JSON.parse(savedData);
    Object.keys(fields).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = fields[id];
        el.dispatchEvent(new Event('change'));
      }
    });
  } catch (error) {
    console.error('Failed to parse draft details:', error);
  }
}

// Auto-save form inputs to localStorage on changes
form.addEventListener('input', debounce(saveDrafts, 500));
form.addEventListener('change', saveDrafts);

function saveDrafts() {
  const data = {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.value && input.id) {
      data[input.id] = input.value;
    }
  });
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
}

// Simple debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Client-side validation details
function validateField(field) {
  const group = field.closest('.form-group');
  if (!group) return true;

  let isValid = true;

  if (field.required && !field.value.trim()) {
    isValid = false;
  } else if (field.type === 'tel' && field.required) {
    if (field.id === 'aadharNumber') {
      const aadharRegex = /^[0-9]{12}$/;
      isValid = aadharRegex.test(field.value.trim());
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      isValid = phoneRegex.test(field.value.trim());
    }
  } else if (field.type === 'email' && field.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    isValid = emailRegex.test(field.value.trim());
  }

  if (isValid) {
    group.classList.remove('has-error');
  } else {
    group.classList.add('has-error');
  }

  return isValid;
}

// Real-time validation on input blur
form.querySelectorAll('input, select, textarea').forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    const group = input.closest('.form-group');
    if (group && group.classList.contains('has-error')) {
      validateField(input);
    }
  });
});

// Mobile Keyboard viewport jumps optimization
const initialViewportHeight = window.innerHeight;
window.addEventListener('resize', () => {
  const floatingActions = document.querySelector('.floating-actions');
  if (floatingActions) {
    if (window.innerHeight < initialViewportHeight * 0.8) {
      floatingActions.style.display = 'none';
    } else {
      floatingActions.style.display = 'flex';
    }
  }
});

// Form Submit Intercept
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate all fields
  let formIsValid = true;
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const fieldValid = validateField(input);
    if (!fieldValid && formIsValid) {
      formIsValid = false;
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }
  });

  if (!formIsValid) return;

  // Prevent double submission
  if (submitBtn) submitBtn.disabled = true;
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
  if (btnText) btnText.classList.add('hidden');
  if (btnSpinner) btnSpinner.classList.remove('hidden');

  const payload = {};
  inputs.forEach(input => {
    payload[input.name] = input.value.trim();
  });

  // Activate Submission Overlay Loader
  const subLoader = document.getElementById('submission-loader');
  const progressFill = document.getElementById('loader-progress-fill');
  const progressPercent = document.getElementById('loader-progress-percent');
  const progressIcon = document.getElementById('loader-progress-icon');
  const phaseTitle = document.getElementById('loader-phase-title');
  const phaseDesc = document.getElementById('loader-phase-desc');

  // Reset Loader Progress
  if (progressFill) progressFill.style.width = '0%';
  if (progressPercent) progressPercent.textContent = '0';
  if (progressIcon) {
    progressIcon.className = "fa-solid fa-book-open";
  }
  if (phaseTitle) phaseTitle.textContent = "Connecting to school portal...";
  if (phaseDesc) phaseDesc.textContent = "Setting up a premium learning channel";
  
  if (subLoader) subLoader.classList.remove('hidden');

  // Drive Loader Progress percentage (0% to 100%)
  let percent = 0;
  let uploadComplete = false;
  let fetchResult = null;
  let fetchError = null;
  let isDuplicateAadhar = false;

  const progressTimer = setInterval(() => {
    if (!uploadComplete) {
      if (percent < 90) {
        percent += 0.9; // Slowed down: steady, professional linear increment (~5s to 90% at 50ms ticks)
      } else if (percent < 98) {
        percent += 0.15; // Creep forward extremely slowly if database writing takes longer
      }
    } else {
      // Fetch is done: sweep smoothly to 100% in controlled ticks
      percent += 4;
      if (percent >= 100) {
        percent = 100;
      }
    }

    const roundedPercent = Math.floor(percent);
    if (progressFill) progressFill.style.width = `${roundedPercent}%`;
    if (progressPercent) progressPercent.textContent = roundedPercent;

    // Change Icons & Descriptive Educational Texts dynamically at percentage checkpoints
    if (roundedPercent >= 0 && roundedPercent < 25) {
      if (progressIcon) progressIcon.className = "fa-solid fa-book-open fa-bounce";
      if (phaseTitle) phaseTitle.textContent = "Nurturing Young Minds...";
      if (phaseDesc) phaseDesc.textContent = "Preparing study materials and building knowledge bases";
    } else if (roundedPercent >= 25 && roundedPercent < 50) {
      if (progressIcon) progressIcon.className = "fa-solid fa-child-reaching fa-bounce";
      if (phaseTitle) phaseTitle.textContent = "Fostering Play & Growth...";
      if (phaseDesc) phaseDesc.textContent = "Encouraging sports, cycling, and creative childhood play";
    } else if (roundedPercent >= 50 && roundedPercent < 75) {
      if (progressIcon) progressIcon.className = "fa-solid fa-award fa-shake";
      if (phaseTitle) phaseTitle.textContent = "Aiming for Excellence...";
      if (phaseDesc) phaseDesc.textContent = "Preparing pupils for prizes, medals, and future triumphs";
    } else if (roundedPercent >= 75 && roundedPercent <= 99) {
      if (progressIcon) progressIcon.className = "fa-solid fa-user-graduate fa-flip";
      if (phaseTitle) phaseTitle.textContent = "Empowering Future Leaders...";
      if (phaseDesc) phaseDesc.textContent = "Assembling your certificate and school credentials";
    } else if (roundedPercent === 100) {
      clearInterval(progressTimer);
      
      // Close Loader Overlay and Reveal Certificate / Display Inline Duplicate Error
      gsap.to('#submission-loader', {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          if (subLoader) {
            subLoader.classList.add('hidden');
            subLoader.style.opacity = '1'; // Reset overlay opacity
          }
          if (fetchError) {
            if (isDuplicateAadhar) {
              // Highlight the Aadhar field in red with the duplicate error message
              const aadharInput = document.getElementById('aadharNumber');
              if (aadharInput) {
                const group = aadharInput.closest('.form-group');
                if (group) {
                  group.classList.add('has-error');
                  const errorMsg = group.querySelector('.error-msg');
                  if (errorMsg) {
                    errorMsg.textContent = fetchError;
                  }
                }
                aadharInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                aadharInput.focus();
              }
            } else {
              // Standard alert for network/server errors
              alert(fetchError);
            }
          } else if (fetchResult) {
            // Explicitly clear local drafts and reset form immediately in background
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            form.reset();
            
            showSuccessOverlay(fetchResult, payload);
          }
        }
      });
    }
  }, 50); // Tick rate set to 50ms for smooth luxury flow

  // Trigger submission fetch in background
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchResult = result;
    } else {
      fetchError = result.message || 'Server submission failed';
      isDuplicateAadhar = (result.error === 'duplicate_aadhar');
    }
  } catch (err) {
    fetchError = 'An error occurred during submission. Please check your network connection and try again.';
  } finally {
    uploadComplete = true; // Signal progress bar to jump to 100% and resolve
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.classList.remove('hidden');
    if (btnSpinner) btnSpinner.classList.add('hidden');
  }
});


// Configure and slide up the success certificate card
function showSuccessOverlay(result, payload) {
  const successScreen = document.getElementById('success-screen');
  const successStudentName = document.getElementById('success-student-name');
  const successClassName = document.getElementById('success-class-name');
  const successRefNum = document.getElementById('success-ref-num');
  const successEmailNotice = document.getElementById('success-email-notice');

  // Safe checks for setting text contents to avoid null property errors
  if (successStudentName) {
    successStudentName.textContent = result.studentName || `${payload.studentName} ${payload.surname}`;
  }
  if (successClassName) {
    successClassName.textContent = result.classJoining || payload.classJoining;
  }
  if (successRefNum) {
    successRefNum.textContent = result.admissionNumber;
  }

  // Duplicate Check UI updates
  const certTitle = document.querySelector('.cert-title');
  const certIntro = document.querySelector('.cert-intro');
  const stamp = document.querySelector('.status-stamp');

  if (result.alreadySubmitted) {
    if (certTitle) certTitle.textContent = "Registration Record";
    if (certIntro) certIntro.textContent = "This student application was already received:";
    if (stamp) {
      stamp.textContent = "DUPLICATE";
      stamp.style.borderColor = "var(--color-gold-dark)";
      stamp.style.color = "var(--color-gold-dark)";
    }
  } else {
    if (certTitle) certTitle.textContent = "Admission Status";
    if (certIntro) certIntro.textContent = "This is to confirm that the online admission request for";
    if (stamp) {
      stamp.textContent = "RECEIVED";
      stamp.style.borderColor = "var(--color-success)";
      stamp.style.color = "var(--color-success)";
    }
  }

  if (successEmailNotice) {
    if (payload.emailId && !result.alreadySubmitted) {
      successEmailNotice.textContent = "Confirmation sent to your email";
      successEmailNotice.classList.remove('hidden');
    } else if (payload.emailId && result.alreadySubmitted) {
      successEmailNotice.textContent = "Confirmation already sent to your email";
      successEmailNotice.classList.remove('hidden');
    } else {
      successEmailNotice.classList.add('hidden');
    }
  }

  // Generate certificate sparkles
  startCertificateSparkles();

  // Animate Certificate card in
  if (successScreen) {
    successScreen.classList.remove('hidden');
    
    gsap.fromTo('.certificate-card',
      { scale: 0.7, opacity: 0, y: 50 },
      { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.4)' }
    );
  }
}

// Unified function to close the success screen
function closeSuccessOverlay() {
  const successScreen = document.getElementById('success-screen');
  if (!successScreen) return;

  // Fully reset form inputs and remove localStorage cached values on popup closure
  const form = document.getElementById('admission-form');
  if (form) form.reset();
  localStorage.removeItem(DRAFT_STORAGE_KEY);

  gsap.to('.certificate-card', {
    scale: 0.8,
    opacity: 0,
    y: 30,
    duration: 0.4,
    onComplete: () => {
      successScreen.classList.add('hidden');
    }
  });
}


// Success Done Button click listener
const doneBtn = document.getElementById('success-done-btn');
if (doneBtn) {
  doneBtn.addEventListener('click', closeSuccessOverlay);
}

// Close Button (X) click listener
const closeBtn = document.getElementById('cert-close-btn');
if (closeBtn) {
  closeBtn.addEventListener('click', closeSuccessOverlay);
}

// Close overlay when clicking on blurred background
const successScreen = document.getElementById('success-screen');
if (successScreen) {
  successScreen.addEventListener('click', (e) => {
    if (e.target === successScreen) {
      closeSuccessOverlay();
    }
  });
}


// ==========================================================================
// 5. PWA Service Worker Registration
// ==========================================================================
// If running on localhost or 127.0.0.1, unregister any active service worker
// and delete caches to avoid persistent offline caching during development.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister().then(() => {
          console.log('Local developer Service Worker unregistered successfully.');
          caches.keys().then(names => {
            for (let name of names) caches.delete(name);
          });
        });
      }
    });
  }
} else {
  // Only register service worker in production
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker Registered', reg.scope))
        .catch(err => console.log('Service Worker registration failed', err));
    });
  }
}


