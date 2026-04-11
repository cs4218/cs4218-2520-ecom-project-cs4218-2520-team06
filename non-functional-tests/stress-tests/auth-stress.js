// Gallen Ong, A0252614L
// Stress Test: Auth Overload - sustained login pressure and degradation behavior

import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Trend, Rate, Counter } from 'k6/metrics';
import { loadProfile } from './config/load-profiles.js';
import { thresholds } from './config/thresholds.js';
import {
  loginUser,
  buildStressUserPool,
  pickUserFromPool,
  getLoadPhase,
  createStageLogger,
} from './utils/helpers.js';

const authLoginLatency = new Trend('auth_login_latency', true);
const authSuccessRate = new Rate('auth_success_rate');
const authErrorRate = new Rate('auth_error_rate');
const authFailures = new Counter('auth_failures');
const logAuthStage = createStageLogger('auth-stress', loadProfile.rampSustainRecover);

export const options = {
  stages: loadProfile.rampSustainRecover,
  thresholds: thresholds.auth,
};

export function setup() {
  return {
    userPool: buildStressUserPool(),
  };
}

export default function (data) {
  logAuthStage(exec.scenario.progress);
  const phase = getLoadPhase(exec.scenario.progress, loadProfile.rampSustainRecover);
  const userEmail = pickUserFromPool(data?.userPool);

  const start = Date.now();
  const token = loginUser(userEmail);
  const latency = Date.now() - start;

  authLoginLatency.add(latency, { phase });

  const success = token !== null;
  authSuccessRate.add(success, { phase });
  authErrorRate.add(!success, { phase });
  if (!success) {
    authFailures.add(1, { phase });
  }

  check(token, {
    'login returned auth token': (t) => t !== null,
  });

  sleep(1);
}
