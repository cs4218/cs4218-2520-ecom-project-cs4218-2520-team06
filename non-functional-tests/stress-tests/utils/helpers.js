// Gallen Ong, A0252614L
import http from 'k6/http';
import {
  BASE_URL,
  USER_POOL_SIZE,
  USER_EMAIL_PREFIX,
  USER_EMAIL_DOMAIN,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
  PRODUCT_IDS,
  SEARCH_TERMS,
} from '../scripts/constants.js';

const STRESS_USER_PREFIX = USER_EMAIL_PREFIX;
const STRESS_USER_DOMAIN = USER_EMAIL_DOMAIN;
const STRESS_USER_POOL_SIZE = USER_POOL_SIZE;

// Get valid test credentials
export function getValidCredentials() {
  return {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };
}

// Login a user and return auth token
export function loginUser(
  email = TEST_USER_EMAIL,
  password = TEST_USER_PASSWORD,
  endpoint = 'auth_login'
) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email,
      password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint },
    }
  );

  if (res.status === 200) {
    const body = res.json();
    return body.token || body.auth_token || null;
  }
  return null;
}

// Return test user email for scripts that need direct identity usage
export function getTestUserEmail() {
  return TEST_USER_EMAIL;
}

export function getBaseUrl() {
  return BASE_URL;
}

export function buildStressUserPool() {
  return Array.from({ length: STRESS_USER_POOL_SIZE }, (_, index) => (
    `${STRESS_USER_PREFIX}-${index}@${STRESS_USER_DOMAIN}`
  ));
}

export function pickUserFromPool(pool) {
  if (!pool || pool.length === 0) {
    return TEST_USER_EMAIL;
  }
  return pool[(__VU + __ITER) % pool.length];
}

export function parseDurationSeconds(duration) {
  const match = /^\s*(\d+)\s*([smh])\s*$/.exec(duration || '');
  if (!match) {
    return 0;
  }
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 'h') return value * 3600;
  if (unit === 'm') return value * 60;
  return value;
}

export function getLoadPhase(progress, stages) {
  if (!Array.isArray(stages) || stages.length === 0) {
    return 'unknown';
  }

  const totalSeconds = stages.reduce(
    (sum, stage) => sum + parseDurationSeconds(stage.duration),
    0
  );

  if (totalSeconds <= 0) {
    return 'unknown';
  }

  const elapsed = Math.max(0, Math.min(1, progress || 0)) * totalSeconds;
  let cumulative = 0;

  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i];
    const previousTarget = i === 0 ? 0 : Number(stages[i - 1].target || 0);
    const currentTarget = Number(stage.target || 0);
    cumulative += parseDurationSeconds(stage.duration);
    if (elapsed <= cumulative) {
      if (currentTarget === 0) return 'recover';
      if (i > 0 && previousTarget === 0) return 'post_recovery_observation';
      if (currentTarget > previousTarget) return 'ramp';
      return 'sustain';
    }
  }

  return 'recover';
}

export function getStageIndex(progress, stages) {
  if (!Array.isArray(stages) || stages.length === 0) {
    return -1;
  }

  const totalSeconds = stages.reduce(
    (sum, stage) => sum + parseDurationSeconds(stage.duration),
    0
  );

  if (totalSeconds <= 0) {
    return -1;
  }

  const elapsed = Math.max(0, Math.min(1, progress || 0)) * totalSeconds;
  let cumulative = 0;

  for (let i = 0; i < stages.length; i += 1) {
    cumulative += parseDurationSeconds(stages[i].duration);
    if (elapsed <= cumulative) {
      return i;
    }
  }

  return stages.length - 1;
}

export function createStageLogger(testName, stages) {
  let lastStageIndex = -1;

  return function logStage(progress) {
    if (__VU !== 1) {
      return;
    }

    const stageIndex = getStageIndex(progress, stages);
    if (stageIndex < 0 || stageIndex === lastStageIndex) {
      return;
    }

    lastStageIndex = stageIndex;
    const stage = stages[stageIndex];
    const previousTarget =
      stageIndex === 0 ? 0 : Number(stages[stageIndex - 1].target || 0);
    const currentTarget = Number(stage.target || 0);

    let stageType = 'hold';
    if (currentTarget === 0) {
      stageType = 'recover';
    } else if (stageIndex > 0 && previousTarget === 0) {
      stageType = 'post-recovery-observation';
    } else if (currentTarget > previousTarget) {
      stageType = 'ramp';
    }

    console.log(
      `[${testName}] stage ${stageIndex + 1}/${stages.length} (${stageType}) target=${stage.target} duration=${stage.duration}`
    );
  };
}

// Login as admin and return admin auth token
export function loginAdmin() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'admin_login' },
    }
  );

  if (res.status === 200) {
    const body = res.json();
    return body.token || body.auth_token || null;
  }
  return null;
}

// Get random product ID
export function randomProduct() {
  return PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
}

// Get random search term
export function randomSearchTerm() {
  return SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
}

// Build checkout/order payload
export function buildCheckoutPayload() {
  return {
    products: [{ _id: randomProduct(), count: 1, price: 100 }],
    payment_method: 'card',
    total_amount: 100,
    shipping_address: '123 Test St',
  };
}

// Build product creation payload for admin
export function buildProductPayload() {
  const timestamp = Date.now();
  return {
    name: `Test Product ${timestamp}`,
    slug: `test-product-${timestamp}`,
    description: 'Test product for stress testing',
    price: Math.floor(Math.random() * 1000) + 10,
    category: 1,
    quantity: 50,
  };
}

// Generate random filter criteria for admin orders query
export function randomFilterCriteria() {
  const statuses = ['Not Process', 'Processing', 'Shipped', 'deliverd', 'cancel'];
  return {
    status: statuses[Math.floor(Math.random() * statuses.length)],
  };
}

// Tag HTTP requests with endpoint name for better metrics
export function tagEndpoint(name) {
  return { endpoint: name };
}
