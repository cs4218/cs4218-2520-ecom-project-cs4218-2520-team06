// Gallen Ong, A0252614L
// Stress Test: Browse/Search Saturation

import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Trend, Rate, Counter } from 'k6/metrics';
import { loadProfile } from './config/load-profiles.js';
import { thresholds } from './config/thresholds.js';
import { BASE_URL } from './scripts/constants.js';
import {
  randomSearchTerm,
  tagEndpoint,
  buildStressUserPool,
  getLoadPhase,
  createStageLogger,
} from './utils/helpers.js';

const browseRequestLatency = new Trend('browse_request_latency', true);
const browseSuccessRate = new Rate('browse_success_rate');
const browseErrorRate = new Rate('browse_error_rate');
const browseFailures = new Counter('browse_failures');
const logBrowseStage = createStageLogger('browse-search-stress', loadProfile.rampSustainRecover);

export const options = {
  stages: loadProfile.rampSustainRecover,
  thresholds: thresholds.browse,
};

export function setup() {
  return {
    userPool: buildStressUserPool(),
  };
}

export default function () {
  logBrowseStage(exec.scenario.progress);
  const phase = getLoadPhase(exec.scenario.progress, loadProfile.rampSustainRecover);
  // Random choice: browse products or search
  const choice = Math.random();
  
  if (choice < 0.5) {
    // Browse products
    const listRes = http.get(
      `${BASE_URL}/api/v1/product/get-product`,
      { tags: tagEndpoint('list') }
    );
    browseRequestLatency.add(listRes.timings.duration, { phase });
    
    check(listRes, {
      'product list loaded': (r) => r.status === 200,
      'has products': (r) => r.json('products') && r.json('products').length > 0,
    });

    const success = listRes.status === 200;
    browseSuccessRate.add(success, { phase });
    browseErrorRate.add(!success, { phase });
    if (!success) {
      browseFailures.add(1, { phase });
    }
  } else {
    // Search products
    const searchTerm = randomSearchTerm();
    const searchRes = http.get(
      `${BASE_URL}/api/v1/product/search/${searchTerm}`,
      { tags: tagEndpoint('search') }
    );
    browseRequestLatency.add(searchRes.timings.duration, { phase });
    
    check(searchRes, {
      'search succeeded': (r) => r.status === 200 || r.status === 404,
      'no 5xx errors': (r) => r.status < 500,
    });

    const success = searchRes.status === 200 || searchRes.status === 404;
    browseSuccessRate.add(success, { phase });
    browseErrorRate.add(!success, { phase });
    if (!success) {
      browseFailures.add(1, { phase });
    }
  }

  sleep(1);
}
