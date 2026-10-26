import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputError('A JSON object is required.');
  }
  return value;
}

export function validateRegistration(body) {
  const data = object(body);
  const username = typeof data.username === 'string' ? data.username.trim() : '';
  const first_name = typeof data.first_name === 'string' ? data.first_name.trim() : '';
  const last_name = typeof data.last_name === 'string' ? data.last_name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const password = data.password;

  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
    throw new InputError('Username must have 3 to 30 letters, numbers, dots, underscores, or hyphens.');
  }
  if (!first_name || first_name.length > 60 || !last_name || last_name.length > 60) {
    throw new InputError('First and last names are required (up to 60 characters each).');
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputError('Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new InputError('Password must contain 8 to 128 characters.');
  }
  return {
    username, usernameKey: username.toLowerCase(), first_name, last_name,
    email, emailKey: email.toLowerCase(), password,
  };
}

export function validateLogin(body) {
  const data = object(body);
  if (typeof data.username !== 'string' || typeof data.password !== 'string' ||
      !data.username.trim() || !data.password) {
    throw new InputError('Username and password are required.');
  }
  return { usernameKey: data.username.trim().toLowerCase(), password: data.password };
}

export function validateDealerId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new InputError('Invalid dealer ID.');
  return id;
}

export function isSameOrigin(origin, host) {
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) && url.host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateReview(body) {
  const data = object(body);
  const dealer_id = validateDealerId(data.dealer_id);
  const review = typeof data.review === 'string' ? data.review.trim() : '';
  const rating = data.rating;
  const purchase = data.purchase;

  if (review.length < 3 || review.length > 3000) {
    throw new InputError('Review must contain 3 to 3000 characters.');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new InputError('Choose a rating from 1 to 5.');
  }
  if (typeof purchase !== 'boolean') throw new InputError('Purchase must be true or false.');

  let car_model_id = null;
  let purchase_date = null;
  if (purchase) {
    car_model_id = Number(data.car_model_id);
    purchase_date = data.purchase_date;
    if (!Number.isSafeInteger(car_model_id) || car_model_id < 1) {
      throw new InputError('Choose a valid vehicle.');
    }
    if (!validDate(purchase_date)) throw new InputError('Enter a valid purchase date.');
    if (purchase_date > new Date().toISOString().slice(0, 10)) {
      throw new InputError('Purchase date cannot be in the future.');
    }
  }
  return { dealer_id, review, rating, purchase, car_model_id, purchase_date };
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored)) return false;
  const [saltHex, hashHex] = stored.split(':');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), 64);
  return timingSafeEqual(actual, Buffer.from(hashHex, 'hex'));
}

const positive = new Set([
  'amazing', 'awesome', 'best', 'clear', 'comfortable', 'easy', 'excellent',
  'fantastic', 'fast', 'friendly', 'good', 'great', 'happy', 'helpful', 'honest',
  'impressed', 'kind', 'love', 'loved', 'perfect', 'pleasant', 'professional',
  'recommend', 'smooth', 'satisfied', 'thankful', 'wonderful',
]);
const negative = new Set([
  'awful', 'bad', 'broken', 'confusing', 'disappointed', 'dishonest', 'horrible',
  'late', 'poor', 'problem', 'rude', 'slow', 'terrible', 'unhelpful', 'unprofessional',
  'upset', 'worst',
]);

export function analyzeSentiment(text) {
  const words = String(text).toLowerCase().match(/[a-z]+/g) || [];
  let score = 0;
  for (let i = 0; i < words.length; i += 1) {
    const value = (positive.has(words[i]) ? 1 : 0) - (negative.has(words[i]) ? 1 : 0);
    score += ['not', 'never', 'no'].includes(words[i - 1]) ? -value : value;
  }
  return {
    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    scores: { compound: score / Math.max(1, words.length) },
    text,
  };
}
