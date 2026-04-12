// Gallen Ong, A0252614L
// Stress Test: Admin Product Management

import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Trend, Rate, Counter } from 'k6/metrics';
import { loadProfile } from './config/load-profiles.js';
import { thresholds } from './config/thresholds.js';
import { BASE_URL } from './scripts/constants.js';
import {
  loginAdmin,
  buildProductPayload,
  tagEndpoint,
  getLoadPhase,
  createStageLogger,
} from './utils/helpers.js';

const adminProductLatency = new Trend('admin_product_latency', true);
const adminProductSuccessRate = new Rate('admin_product_success_rate');
const adminProductErrorRate = new Rate('admin_product_error_rate');
const adminProductFailures = new Counter('admin_product_failures');
const logAdminProductStage = createStageLogger('admin-product-stress', loadProfile.adminStress);

export const options = {
  stages: loadProfile.adminStress,
  thresholds: thresholds.adminProduct,
};

export function setup() {
  const adminToken = loginAdmin();
  let categoryId = null;

  if (adminToken) {
    const categoryRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: tagEndpoint('admin_product_category_lookup'),
    });

    try {
      const body = categoryRes.json();
      if (categoryRes.status === 200 && body?.success && Array.isArray(body?.category) && body.category.length > 0) {
        categoryId = body.category[0]?._id || null;
      }
    } catch (error) {
      categoryId = null;
    }
  }

  return {
    startedAt: Date.now(),
    adminToken,
    categoryId,
  };
}

let lastCreatedProductId = null;

function parseJsonSafe(response) {
  const contentType = (response.headers['Content-Type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

function getAnyProductId() {
  const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: tagEndpoint('admin_product_lookup'),
  });
  const body = parseJsonSafe(res);
  if (res.status !== 200 || !body || !Array.isArray(body.products) || body.products.length === 0) {
    return null;
  }

  return body.products[0]?._id || null;
}

export default function (data) {
  logAdminProductStage(exec.scenario.progress);
  const phase = getLoadPhase(exec.scenario.progress, loadProfile.adminStress);
  const adminToken = data?.adminToken || loginAdmin();
  if (!adminToken) {
    console.error('Failed to obtain admin token');
    adminProductSuccessRate.add(false, { phase });
    adminProductErrorRate.add(true, { phase });
    adminProductFailures.add(1, { phase });
    return;
  }

  const headers = {
    'Authorization': adminToken,
  };

  const categoryId = data?.categoryId;
  if (!categoryId) {
    console.error('No category available for admin product stress operations');
    adminProductSuccessRate.add(false, { phase });
    adminProductErrorRate.add(true, { phase });
    adminProductFailures.add(1, { phase });
    return;
  }

  // Random: create new product or update existing
  const op = Math.random();
  
  if (op < 0.5) {
    // Create product
    const productPayload = {
      ...buildProductPayload(),
      category: categoryId,
    };
    const createRes = http.post(
      `${BASE_URL}/api/v1/product/create-product`,
      productPayload,
      {
        headers,
        tags: tagEndpoint('admin_product'),
      }
    );
    adminProductLatency.add(createRes.timings.duration, { phase });

    const createBody = parseJsonSafe(createRes);
    const createSuccess =
      (createRes.status === 200 || createRes.status === 201) &&
      (createBody?.success !== false);

    if (createSuccess) {
      const createdId = createBody?.products?._id;
      if (createdId) {
        lastCreatedProductId = createdId;
      }
    }

    check(createRes, {
      'product creation succeeded': () => createSuccess,
      'no admin rate limiting': (r) => r.status !== 429,
      'no 5xx errors': (r) => r.status < 500,
    });

    const success = createSuccess;
    adminProductSuccessRate.add(success, { phase });
    adminProductErrorRate.add(!success, { phase });
    if (!success) {
      adminProductFailures.add(1, { phase });
    }
  } else {
    // Update existing product
    const productId = lastCreatedProductId || getAnyProductId();
    if (!productId) {
      adminProductSuccessRate.add(false, { phase });
      adminProductErrorRate.add(true, { phase });
      adminProductFailures.add(1, { phase });
      sleep(1);
      return;
    }

    const updatePayload = {
      ...buildProductPayload(),
      category: categoryId,
    };
    const updateRes = http.put(
      `${BASE_URL}/api/v1/product/update-product/${productId}`,
      updatePayload,
      {
        headers,
        tags: tagEndpoint('admin_product'),
      }
    );
    adminProductLatency.add(updateRes.timings.duration, { phase });

    const updateBody = parseJsonSafe(updateRes);
    const updateSuccess =
      (updateRes.status === 200 || updateRes.status === 201) &&
      (updateBody?.success !== false);

    check(updateRes, {
      'product update succeeded': () => updateSuccess,
      'no 5xx errors': (r) => r.status < 500,
    });

    const success = updateSuccess;
    adminProductSuccessRate.add(success, { phase });
    adminProductErrorRate.add(!success, { phase });
    if (!success) {
      adminProductFailures.add(1, { phase });
    }
  }

  sleep(1);
}
