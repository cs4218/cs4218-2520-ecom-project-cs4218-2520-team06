import http from "k6/http";
import { check } from "k6";

const EXPECTED_USERS = 10;
const RAMP_UP_TIME = 1;
const RAMP_DOWN_TIME = 3;
const SUSTAINED_LOAD_TIME = 5;

export const baseOptions = {
  stages: [
    { duration: `${RAMP_UP_TIME}s`, target: EXPECTED_USERS },
    { duration: `${SUSTAINED_LOAD_TIME}s`, target: EXPECTED_USERS },
    { duration: `${RAMP_DOWN_TIME}s`, target: 0 },
  ],
};

export const loadTestBasic = (...requests) => {
  const responses = http.batch(requests);
  responses.forEach((res) => {
    check(res, { "status was 200": (r) => r.status == 200 });
  });
};
