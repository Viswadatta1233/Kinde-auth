const request = require('supertest');
const mongoose = require('mongoose');
const nock = require('nock');
const app = require('../server'); // Make sure this exports the app without listening

// Setup test MongoDB URI (use a test DB or mock in-memory Mongo later)
// beforeAll(async () => {
//   await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/kinde-test', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });
// });

beforeEach(() => {
  // Mock Kinde OAuth token request
  nock('https://shopifynew.kinde.com')
    .post('/oauth2/token')
    .reply(200, { access_token: 'fake_token' });

  // Mock organization check
  nock('https://shopifynew.kinde.com')
    .get(/\/api\/v1\/organizations/)
    .reply(200, { organizations: [{ code: 'org_test_123' }] });

  // Mock role check
  nock('https://shopifynew.kinde.com')
    .get(/\/api\/v1\/roles/)
    .reply(200, { roles: [{ id: 'role_test_456' }] });

  // Mock user creation in Kinde
  nock('https://shopifynew.kinde.com')
    .post('/api/v1/user')
    .reply(200, { id: 'kinde_user_mocked' });

  // Mock assigning role to user
  nock('https://shopifynew.kinde.com')
    .post(/\/api\/v1\/organizations\/.*\/users\/.*\/roles/)
    .reply(200);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // optional: clean up test DB
  await mongoose.connection.close();
});

describe('Auth API', () => {
  let token; // ✅ Declare at the top of the describe block

  it('should sign up a new user', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({
        firstName: 'abc',
        lastName: 'cde',
        email: 'gef@gmail.com',
        password: 'pass123',
        organizationName: 'I2',
        roleName: 'warden'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('gef@gmail.com');

    
    token = res.body.token; // ✅ Save token to use in the next test
  });

  it('should return user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`); // ✅ Now this works

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('gef@gmail.com');
    expect(res.body.user).toHaveProperty('firstName');
    expect(res.body.user).toHaveProperty('organizationName');
    expect(res.body.user).toHaveProperty('roleName');
  });
console.log("tests");











});

