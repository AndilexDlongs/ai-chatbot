console.log('Login page loaded');

// Reuse starfield from landing
const canvas = document.getElementById('stars');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = Array(50)
      .fill()
      .map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        t: Math.random() * 360,
      }));
  }

  function createShootingStar() {
    shootingStars.push({
      x: Math.random() * w,
      y: Math.random() * (h / 2),
      len: Math.random() * 120 + 80,
      speed: Math.random() * 4 + 2,
      opacity: 1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(star => {
      const opacity = 0.6 + 0.4 * Math.sin((star.t * Math.PI) / 180);
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
      ctx.fill();
      star.t += 0.2;
    });

    if (Math.random() < 0.002) createShootingStar();
    shootingStars.forEach((s, i) => {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y + s.len / 3);
      grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len, s.y + s.len / 3);
      ctx.stroke();
      s.x -= s.speed;
      s.y += s.speed / 3;
      s.opacity -= 0.01;
      if (s.opacity <= 0) shootingStars.splice(i, 1);
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// Auth form handling
const form = document.getElementById('authForm');
const tabSignin = document.getElementById('tab-signin');
const tabSignup = document.getElementById('tab-signup');
const submitLabel = document.getElementById('submitLabel');
const spinner = document.getElementById('spinner');
const errorBox = document.getElementById('errorBox');
const pwdInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const passwordRulesBox = document.getElementById('passwordRules');
const passwordRules = document.querySelectorAll('#passwordRules [data-rule]');
let rulesVisible = false;

function setMode(mode) {
  const isSignup = mode === 'signup';
  form.dataset.mode = mode;
  submitLabel.textContent = isSignup ? 'Create account' : 'Sign in';
  tabSignin.classList.toggle('active', !isSignup);
  tabSignup.classList.toggle('active', isSignup);
}

tabSignin?.addEventListener('click', () => setMode('signin'));
tabSignup?.addEventListener('click', () => setMode('signup'));

// Toggle password visibility
togglePassword?.addEventListener('click', () => {
  const isText = pwdInput.type === 'text';
  pwdInput.type = isText ? 'password' : 'text';
});

function updateRuleStyles(rules) {
  passwordRules.forEach(el => {
    const key = el.getAttribute('data-rule');
    let pass = rules[key];
    // If the "mix" rule is satisfied, show all sub-rules as green for clarity.
    if (rules.mix && ['lower', 'upper', 'number', 'special'].includes(key)) {
      pass = true;
    }
    el.classList.remove('pass', 'fail', 'text-red-400', 'text-green-400');
    el.classList.add(pass ? 'pass' : 'fail');
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function computeRules(pwd) {
  const rules = {
    length: pwd.length >= 8,
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*]/.test(pwd),
  };
  const categoriesPassed = ['lower', 'upper', 'number', 'special'].filter(k => rules[k]).length;
  rules.mix = categoriesPassed >= 3;
  return rules;
}

// Update password rules only when the box is visible (shown after invalid signup attempt)
pwdInput?.addEventListener('input', e => {
  if (!rulesVisible || !passwordRulesBox || passwordRulesBox.classList.contains('hidden')) return;
  const pwd = e.target.value || '';
  updateRuleStyles(computeRules(pwd));
});

form?.addEventListener('submit', async e => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  spinner.classList.remove('hidden');
  submitLabel.textContent = 'Working...';

  const data = Object.fromEntries(new FormData(form).entries());
  const endpoint = form.dataset.mode === 'signup' ? '/auth/register' : '/auth/login';

  // Front-end email sanity check
  if (!validateEmail(data.email || '')) {
    errorBox.textContent = 'Invalid email address.';
    errorBox.classList.remove('hidden');
    spinner.classList.add('hidden');
    submitLabel.textContent = form.dataset.mode === 'signup' ? 'Create account' : 'Sign in';
    return;
  }

  if (form.dataset.mode === 'signup') {
    const rules = computeRules(data.password || '');
    if (!(rules.length && rules.mix)) {
      errorBox.textContent = 'Password does not meet requirements.';
      errorBox.classList.remove('hidden');
      // Show rules box on first invalid attempt for sign-up only
      if (passwordRulesBox) {
        rulesVisible = true;
        passwordRulesBox.classList.remove('hidden');
        updateRuleStyles(rules);
      }
      spinner.classList.add('hidden');
      submitLabel.textContent = 'Create account';
      return;
    }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Unable to sign in.');
    window.location.href = json.redirect || '/chat';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');

    if (String(err.message).toLowerCase().includes('create account')) {
      setMode('signup');
      submitLabel.textContent = 'Create account';
    }
  } finally {
    spinner.classList.add('hidden');
    submitLabel.textContent = form.dataset.mode === 'signup' ? 'Create account' : 'Sign in';
  }
});

// Initialize default tab if page was opened in signup mode
if (form?.dataset.mode === 'signup') setMode('signup');

// Show error for failed OAuth if present in query string
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('oauth') === 'failed') {
  errorBox.textContent = 'Google sign-in was unsuccessful. Please try again.';
  errorBox.classList.remove('hidden');
}
