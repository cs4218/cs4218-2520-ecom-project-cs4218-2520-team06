// Kok Bo Chang, A0273542E
import { sleep } from "k6";

export function gaussianThink(mean = 3, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();

  let z = Math.sqrt(-2.0 * Math.log(u1)) *
          Math.cos(2.0 * Math.PI * u2);

  let value = mean + z * stdDev;

  // prevent negative sleep
  if (value < 0) value = 0;

  sleep(value);
}