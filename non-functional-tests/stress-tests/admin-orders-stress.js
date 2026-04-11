// Gallen Ong, A0252614L
// Stress Test: Admin Orders Management - Detect query timeout/slow filters

import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Trend, Rate, Counter } from 'k6/metrics';
import { loadProfile } from './config/load-profiles.js';
import { thresholds } from './config/thresholds.js';
import { BASE_URL } from './scripts/constants.js';
import {
  loginAdmin,
  randomFilterCriteria,
  tagEndpoint,
  getLoadPhase,
  createStageLogger,
} from './utils/helpers.js';

const adminOrdersLatency = new Trend('admin_orders_latency', true);
const adminOrdersSuccessRate = new Rate('admin_orders_success_rate');
const adminOrdersErrorRate = new Rate('admin_orders_error_rate');
const adminOrdersFailures = new Counter('admin_orders_failures');
const logAdminOrdersStage = createStageLogger('admin-orders-stress', loadProfile.adminOrdersStress);

export const options = {
  stages: loadProfile.adminOrdersStress,
  thresholds: thresholds.adminOrders,
};

export function setup() {
  const adminToken = loginAdmin();
  return {
    startedAt: Date.now(),
    adminToken,
  };
}

function isJsonArrayResponse(response) {
  const contentType = (response.headers['Content-Type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return false;
  }

  try {
    return Array.isArray(response.json());
  } catch (error) {
    return false;
  }
}

function toQueryString(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export default function (data) {
  logAdminOrdersStage(exec.scenario.progress);
  const phase = getLoadPhase(exec.scenario.progress, loadProfile.adminOrdersStress);
  const adminToken = data?.adminToken || loginAdmin();
  if (!adminToken) {
    console.error('Failed to obtain admin token');
    adminOrdersSuccessRate.add(false, { phase });
    adminOrdersErrorRate.add(true, { phase });
    adminOrdersFailures.add(1, { phase });
    return;
  }

  const headers = {
    'Authorization': adminToken,
  };

  const choice = Math.random();

  if (choice < 0.6) {
    // Get all orders
    const listRes = http.get(
      `${BASE_URL}/api/v1/auth/all-orders`,
      {
        headers,
        tags: tagEndpoint('admin_orders_list'),
      }
    );
    adminOrdersLatency.add(listRes.timings.duration, { phase });

    check(listRes, {
      'orders list loaded': (r) => r.status === 200,
      'is array': (r) => isJsonArrayResponse(r),
      'no 5xx errors': (r) => r.status < 500,
    });

    const success = listRes.status === 200;
    adminOrdersSuccessRate.add(success, { phase });
    adminOrdersErrorRate.add(!success, { phase });
    if (!success) {
      adminOrdersFailures.add(1, { phase });
    }
  } else {
    // Filtered orders query (simulate various filters)
    const criteria = randomFilterCriteria();
    const params = toQueryString(criteria);
    
    const filterRes = http.get(
      `${BASE_URL}/api/v1/auth/all-orders?${params}`,
      {
        headers,
        tags: tagEndpoint('admin_orders_filter'),
      }
    );
    adminOrdersLatency.add(filterRes.timings.duration, { phase });

    check(filterRes, {
      'filtered query succeeded': (r) => r.status === 200 || r.status === 400,
      'no query timeout': (r) => r.status !== 504,
      'no 5xx errors': (r) => r.status < 500,
    });

    const success = filterRes.status === 200 || filterRes.status === 400;
    adminOrdersSuccessRate.add(success, { phase });
    adminOrdersErrorRate.add(!success, { phase });
    if (!success) {
      adminOrdersFailures.add(1, { phase });
    }
  }

  sleep(1);
}
