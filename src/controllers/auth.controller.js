import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByEmail,
  verifyPassword,
  isValidEmail,
  passwordRuleCheck,
  createOAuthUser,
  findUserByProvider,
} from '../services/user.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const TOKEN_TTL_DAYS = 7;

function setSessionCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${TOKEN_TTL_DAYS}d` });
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function renderLogin(req, res) {
  const tier = req.query.tier === 'pro' ? 'pro' : 'free';
  res.render('auth/login', { tier });
}

export function renderSignup(req, res) {
  const tier = req.query.tier === 'pro' ? 'pro' : 'free';
  res.render('auth/login', { tier, mode: 'signup' });
}

export function logout(req, res) {
  res.clearCookie('session');
  res.redirect('/login');
}

export function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });

  const rules = passwordRuleCheck(password);
  if (!rules.valid)
    return res.status(400).json({ error: 'Password does not meet requirements.' });

  const existing = findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'Email already exists.' });

  const user = createUser({ email, password });
  setSessionCookie(res, { userId: user.id, email: user.email });
  res.json({ ok: true, redirect: '/chat' });
}

export function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Please create account.', suggest: 'signup' });
  }

  if (!verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  setSessionCookie(res, { userId: user.id, email: user.email });
  res.json({ ok: true, redirect: '/chat' });
}

// Google OAuth handlers use Passport; user is set on req.user by passport.authenticate
export function handleOAuthSuccess(req, res) {
  if (!req.user) return res.redirect('/login?oauth=failed');
  setSessionCookie(res, { userId: req.user.id, email: req.user.email });
  return res.redirect('/chat');
}

export function handleOAuthFailure(req, res) {
  return res.redirect('/login?oauth=failed');
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    res.clearCookie('session');
    return res.redirect('/login');
  }
}
