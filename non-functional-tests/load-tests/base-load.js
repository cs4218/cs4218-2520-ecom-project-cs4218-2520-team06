import http from "k6/http";
import { check } from "k6";

const EXPECTED_USERS = 150;
const RAMP_UP_TIME = 1;
const RAMP_DOWN_TIME = 3;
const SUSTAINED_LOAD_TIME = 30;
// const RAMP_UP_TIME = 60;
// const RAMP_DOWN_TIME = 60;
// const SUSTAINED_LOAD_TIME = 300;

export const baseOptions = {
  stages: [
    { duration: `${RAMP_UP_TIME}s`, target: EXPECTED_USERS },
    { duration: `${SUSTAINED_LOAD_TIME}s`, target: EXPECTED_USERS },
    { duration: `${RAMP_DOWN_TIME}s`, target: 0 },
  ],
};

export const loadTestBasic = (...requests) => {
  const responses = http.batch(requests);
  return responses.map((res) => {
    const success = check(res, { "status was 200": (r) => r.status == 200 });
    return { success, duration: res.timings.duration };
  });
};
