import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeSentiment, hashPassword, isSameOrigin, validateRegistration,
  validateReview, verifyPassword,
} from './lib.js';

test('registration normalizes identifiers and never exposes the password as a stored hash', async () => {
  const data = validateRegistration({
    username: ' Driver_01 ', first_name: 'Ava', last_name: 'Lee',
    email: ' Ava@Example.com ', password: 'strong passphrase',
  });
  assert.equal(data.username, 'Driver_01');
  assert.equal(data.usernameKey, 'driver_01');
  assert.equal(data.emailKey, 'ava@example.com');
  const hash = await hashPassword(data.password);
  assert.equal(hash.includes(data.password), false);
  assert.equal(await verifyPassword(data.password, hash), true);
  assert.equal(await verifyPassword('incorrect', hash), false);
});

test('review validation rejects forged or invalid purchase details', () => {
  const valid = { dealer_id: 1, review: 'Helpful team', rating: 5, purchase: false };
  assert.deepEqual(validateReview(valid), {
    dealer_id: 1, review: 'Helpful team', rating: 5, purchase: false,
    car_model_id: null, purchase_date: null,
  });
  assert.throws(() => validateReview({ ...valid, rating: 6 }), /rating/);
  assert.throws(() => validateReview({ ...valid, purchase: true, car_model_id: 1, purchase_date: '2025-02-30' }), /date/);
  assert.throws(() => validateReview({ ...valid, purchase: true, car_model_id: 1, purchase_date: '2999-01-01' }), /future/);
});

test('cross-origin requests cannot pass the origin comparison', () => {
  assert.equal(isSameOrigin('http://localhost:5173', 'localhost:5173'), true);
  assert.equal(isSameOrigin('https://cars.example', 'cars.example'), true);
  assert.equal(isSameOrigin('https://evil.example', 'cars.example'), false);
  assert.equal(isSameOrigin('null', 'cars.example'), false);
});

test('sentiment labels simple positive, negative, and negated reviews', () => {
  assert.equal(analyzeSentiment('Friendly helpful service').sentiment, 'positive');
  assert.equal(analyzeSentiment('Rude and slow service').sentiment, 'negative');
  assert.equal(analyzeSentiment('Not good service').sentiment, 'negative');
});
