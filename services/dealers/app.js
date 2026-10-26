import express from 'express';
import { MongoClient } from 'mongodb';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  InputError, analyzeSentiment, hashPassword, isSameOrigin, validateDealerId,
  validateLogin, validateRegistration, validateReview, verifyPassword,
} from './lib.js';

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/cars_dealership';
const mongoDb = process.env.MONGO_DB || new URL(mongoUrl).pathname.slice(1) || 'cars_dealership';
const port = Number(process.env.PORT || 3000);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const cookieName = 'cars_session';
const distDir = fileURLToPath(new URL('../../server/frontend/dist/', import.meta.url));

const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });
let server;

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readCookie(req, name) {
  const item = (req.get('cookie') || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));
  if (!item) return null;
  try { return decodeURIComponent(item.slice(name.length + 1)); }
  catch { return null; }
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || req.secure,
    path: '/',
  };
}

function requireSameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next(); // Non-browser clients may omit Origin.
  if (isSameOrigin(origin, req.get('host') || '')) return next();
  return res.status(403).json({ error: 'Cross-origin request denied.' });
}

async function seedDatabase(db) {
  const dealers = db.collection('dealers');
  const cars = db.collection('cars');
  const reviews = db.collection('reviews');
  await Promise.all([
    dealers.createIndex({ id: 1 }, { unique: true }),
    cars.createIndex({ id: 1 }, { unique: true }),
    reviews.createIndex({ id: 1 }, { unique: true }),
    reviews.createIndex({ dealer_id: 1, created_at: -1 }),
    db.collection('users').createIndex({ usernameKey: 1 }, { unique: true }),
    db.collection('users').createIndex({ emailKey: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  const dealerSeed = JSON.parse(await readFile(new URL('../../server/seed/dealers.json', import.meta.url), 'utf8'));
  await Promise.all(dealerSeed.map(dealer =>
    dealers.updateOne({ id: dealer.id }, { $setOnInsert: dealer }, { upsert: true })));

  const makes = [
    { name: 'Toyota', models: ['Camry', 'RAV4'] },
    { name: 'Honda', models: ['Civic', 'CR-V'] },
    { name: 'Ford', models: ['Mustang', 'Escape'] },
    { name: 'Chevrolet', models: ['Malibu', 'Equinox'] },
    { name: 'Tesla', models: ['Model 3', 'Model Y'] },
  ];
  const carSeed = makes.flatMap((make, makeIndex) => make.models.map((name, modelIndex) => ({
    id: makeIndex * 2 + modelIndex + 1,
    name,
    year: 2025,
    make_id: makeIndex + 1,
    make__name: make.name,
  })));
  await Promise.all(carSeed.map(car =>
    cars.updateOne({ id: car.id }, { $setOnInsert: car }, { upsert: true })));

  await reviews.updateOne({ id: 'seed-review' }, { $setOnInsert: {
    id: 'seed-review', dealer_id: 1, name: 'Alex Morgan',
    review: 'Friendly staff and a clear explanation of every option. A great visit!',
    rating: 5, purchase: true, purchase_date: '2025-06-12',
    car_make: 'Toyota', car_model: 'Camry', car_year: 2025,
    sentiment: 'positive', created_at: '2025-06-12T12:00:00.000Z',
  } }, { upsert: true });
}

function makeApp(db) {
  const users = db.collection('users');
  const sessions = db.collection('sessions');
  const dealers = db.collection('dealers');
  const reviews = db.collection('reviews');
  const cars = db.collection('cars');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  app.use(express.json({ limit: '16kb' }));
  app.use(requireSameOrigin);

  async function issueSession(req, res, user) {
    if (req.sessionTokenHash) await sessions.deleteOne({ tokenHash: req.sessionTokenHash });
    const token = randomBytes(32).toString('base64url');
    await sessions.insertOne({
      tokenHash: tokenHash(token), userId: user._id,
      expiresAt: new Date(Date.now() + sessionLifetimeMs),
    });
    res.cookie(cookieName, token, { ...cookieOptions(req), maxAge: sessionLifetimeMs });
  }

  app.get('/health', async (req, res) => {
    await db.command({ ping: 1 });
    res.json({ status: 'ok' });
  });

  app.use('/api', async (req, res, next) => {
    const token = readCookie(req, cookieName);
    if (token) {
      const hashed = tokenHash(token);
      const session = await sessions.findOne({ tokenHash: hashed, expiresAt: { $gt: new Date() } });
      if (session) req.user = await users.findOne({ _id: session.userId });
      req.sessionTokenHash = hashed;
    }
    next();
  });

  app.get('/api/session', (req, res) => {
    res.json({ status: 200, username: req.user?.username || null });
  });

  app.post('/api/register', async (req, res) => {
    const { password, ...details } = validateRegistration(req.body);
    const user = { ...details, passwordHash: await hashPassword(password), created_at: new Date().toISOString() };
    try {
      const inserted = await users.insertOne(user);
      user._id = inserted.insertedId;
    }
    catch (error) {
      if (error.code === 11000) {
        const field = error.keyPattern?.emailKey ? 'Email' : 'Username';
        throw new InputError(`${field} already exists.`, 409);
      }
      throw error;
    }
    await issueSession(req, res, user);
    res.status(201).json({ status: 201, username: user.username, message: 'Registration successful' });
  });

  app.post('/api/login', async (req, res) => {
    const { usernameKey, password } = validateLogin(req.body);
    const user = await users.findOne({ usernameKey });
    if (!user || !await verifyPassword(password, user.passwordHash)) {
      throw new InputError('Invalid username or password.', 401);
    }
    await issueSession(req, res, user);
    res.json({ status: 200, username: user.username, message: 'Login successful' });
  });

  app.post('/api/logout', async (req, res) => {
    if (req.sessionTokenHash) await sessions.deleteOne({ tokenHash: req.sessionTokenHash });
    res.clearCookie(cookieName, cookieOptions(req));
    res.json({ status: 200, message: 'Logout successful' });
  });

  async function listDealers(req, res) {
    const state = req.params.state || req.query.state || 'All';
    let values = await dealers.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();
    if (state !== 'All') values = values.filter(dealer => dealer.state.toLowerCase() === String(state).toLowerCase());
    res.json({ status: 200, dealers: values });
  }
  app.get('/api/get_dealers', listDealers);
  app.get('/api/get_dealers/:state', listDealers);

  app.get('/api/dealer/:id', async (req, res) => {
    const id = validateDealerId(req.params.id);
    const dealer = await dealers.findOne({ id }, { projection: { _id: 0 } });
    if (!dealer) throw new InputError('Dealer not found.', 404);
    res.json({ status: 200, dealer });
  });

  app.get('/api/reviews/dealer/:id', async (req, res) => {
    const id = validateDealerId(req.params.id);
    if (!await dealers.findOne({ id }, { projection: { _id: 1 } })) {
      throw new InputError('Dealer not found.', 404);
    }
    const values = await reviews.find({ dealer_id: id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 }).toArray();
    res.json({ status: 200, reviews: values });
  });

  app.get('/api/get_cars', async (req, res) => {
    const models = await cars.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();
    const byMake = new Map();
    for (const model of models) {
      if (!byMake.has(model.make_id)) byMake.set(model.make_id, { id: model.make_id, name: model.make__name, models: [] });
      byMake.get(model.make_id).models.push({ id: model.id, name: model.name, year: model.year });
    }
    res.json({
      status: 200,
      car_makes: [...byMake.values()].sort((a, b) => a.name.localeCompare(b.name)),
      car_models: models.map(({ id, name, year, make__name }) => ({ id, name, year, make__name })),
    });
  });

  app.post('/api/add_review', async (req, res) => {
    if (!req.user) throw new InputError('Log in to post a review.', 401);
    const data = validateReview(req.body);
    if (!await dealers.findOne({ id: data.dealer_id }, { projection: { _id: 1 } })) {
      throw new InputError('Dealer not found.', 404);
    }
    const car = data.purchase ? await cars.findOne({ id: data.car_model_id }) : null;
    if (data.purchase && !car) throw new InputError('Choose a valid vehicle.');
    const review = {
      id: randomUUID(), dealer_id: data.dealer_id,
      name: `${req.user.first_name} ${req.user.last_name}`.trim() || req.user.username,
      review: data.review, rating: data.rating, purchase: data.purchase,
      purchase_date: data.purchase_date,
      car_make: car?.make__name || '', car_model: car?.name || '', car_year: car?.year || null,
      sentiment: analyzeSentiment(data.review).sentiment,
      created_at: new Date().toISOString(),
    };
    await reviews.insertOne(review);
    delete review._id;
    res.status(201).json({ status: 201, review });
  });

  app.get('/api/analyze/:text', (req, res) => {
    const text = req.params.text;
    if (text.length < 1 || text.length > 3000) throw new InputError('Text must contain 1 to 3000 characters.');
    res.json({ status: 200, ...analyzeSentiment(text) });
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
  if (existsSync(distDir)) app.use(express.static(distDir, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.includes('.')) return next();
    if (!existsSync(join(distDir, 'index.html'))) {
      return res.status(503).send('Build the React app first: npm run build');
    }
    return res.sendFile(join(distDir, 'index.html'));
  });
  app.use((req, res) => res.status(404).send('Not found.'));
  app.use((error, req, res, next) => {
    if (error instanceof InputError) return res.status(error.status).json({ status: error.status, error: error.message });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ status: 400, error: 'Invalid JSON.' });
    console.error(error);
    return res.status(500).json({ status: 500, error: 'Server error. Please try again.' });
  });
  return app;
}

async function start() {
  await client.connect();
  const db = client.db(mongoDb);
  await seedDatabase(db);
  const app = makeApp(db);
  server = app.listen(port, '0.0.0.0', () => console.log(`Cars Dealership listening on port ${port}`));
}

async function shutdown() {
  if (server) await new Promise(resolve => server.close(resolve));
  await client.close();
}

process.once('SIGINT', () => { shutdown().finally(() => process.exit(0)); });
process.once('SIGTERM', () => { shutdown().finally(() => process.exit(0)); });
start().catch(error => { console.error('Server startup failed:', error); client.close().finally(() => process.exit(1)); });
