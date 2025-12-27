import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const SALT_ROUNDS = 10;
// Simple, broad email validation: non-space chars + @ + domain + dot + tld
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function findUserByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
}

export function findUserByProvider(provider, providerSub) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM users WHERE provider = ? AND provider_sub = ?')
    .get(provider, providerSub);
}

export function createUser({ email, password }) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  const stmt = db.prepare(
    'INSERT INTO users (email, password_hash, provider) VALUES (?, ?, ?)'
  );

  const info = stmt.run(normalizedEmail, passwordHash, 'local');
  return { id: info.lastInsertRowid, email: normalizedEmail };
}

export function createOAuthUser({ provider, providerSub, email }) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const stmt = db.prepare(
    'INSERT INTO users (email, provider, provider_sub, password_hash) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(normalizedEmail, provider, providerSub, '');
  return { id: info.lastInsertRowid, email: normalizedEmail, provider, provider_sub: providerSub };
}

export function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.password_hash);
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || '').trim());
}

export function passwordRuleCheck(password) {
  const pwd = String(password || '');
  const rules = {
    length: pwd.length >= 8,
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*]/.test(pwd),
  };
  const categoriesPassed = ['lower', 'upper', 'number', 'special'].filter(k => rules[k]).length;
  rules.mix = categoriesPassed >= 3;
  rules.valid = rules.length && rules.mix;
  return rules;
}
