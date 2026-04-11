// Gallen Ong, A0252614L
// Stress Test: Checkout Breakpoint

import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Trend, Rate, Counter } from 'k6/metrics';
import { loadProfile } from './config/load-profiles.js';
import { thresholds } from './config/thresholds.js';
import {
  searchProduct,
  checkout as spikeCheckout,
} from '../spike-tests/spike-helpers.js';
import {
  loginUser,
  getTestUserEmail,
  buildStressUserPool,
  pickUserFromPool,
  getLoadPhase,
  createStageLogger,
} from './utils/helpers.js';

const checkoutLoginDuration = new Trend('checkout_login_duration', true);
const checkoutSearchDuration = new Trend('checkout_search_duration', true);
const checkoutMockPaymentLatency = new Trend('checkout_mock_payment_latency', true);
const checkoutSuccessRate = new Rate('checkout_success_rate');
const checkoutErrorRate = new Rate('checkout_error_rate');
const checkoutFailures = new Counter('checkout_failures');
const logCheckoutStage = createStageLogger('checkout-stress', loadProfile.rampSustainRecover);

const TEST_USER_EMAIL = getTestUserEmail();

export const options = {
  stages: loadProfile.rampSustainRecover,
  thresholds: thresholds.checkout,
};

export function setup() {
  return {
    userPool: buildStressUserPool(),
  };
}

export default function (data) {
  logCheckoutStage(exec.scenario.progress);
  const phase = getLoadPhase(exec.scenario.progress, loadProfile.rampSustainRecover);
  const selectedEmail = pickUserFromPool(data?.userPool) || TEST_USER_EMAIL;

  const searchMetricSink = {
    add: (value) => checkoutSearchDuration.add(value, { phase }),
  };
  const checkoutMetricSink = {
    add: (value) => checkoutMockPaymentLatency.add(value, { phase }),
  };

  const loginStart = Date.now();
  const token = loginUser(selectedEmail, undefined, 'checkout_login');
  checkoutLoginDuration.add(Date.now() - loginStart, { phase });
  if (!token) {
    checkoutSuccessRate.add(false, { phase });
    checkoutErrorRate.add(true, { phase });
    checkoutFailures.add(1, { phase });
    sleep(1);
    return;
  }

  const product = searchProduct(searchMetricSink);
  if (!product) {
    checkoutSuccessRate.add(false, { phase });
    checkoutErrorRate.add(true, { phase });
    checkoutFailures.add(1, { phase });
    sleep(1);
    return;
  }

  const success = spikeCheckout(token, product, checkoutMetricSink);
  checkoutSuccessRate.add(success, { phase });
  checkoutErrorRate.add(!success, { phase });
  if (!success) {
    checkoutFailures.add(1, { phase });
  }

  check(success, {
    'mock checkout succeeded': (ok) => ok === true,
  });

  sleep(1);
}
