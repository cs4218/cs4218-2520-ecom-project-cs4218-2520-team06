import http from "k6/http";
import {
  USER_POOL_SIZE,
  PASSWORD,
  USER_EMAIL_PREFIX,
  USER_EMAIL_DOMAIN,
} from "./scripts/constants.js";

const categories = ["book", "clothing", "electronics", "sports"];
const priceRanges = [
  [0, 19],
  [20, 39],
  [40, 59],
  [60, 79],
  [80, 99],
  [100, 9999],
];

export function getRandomUserCredentials() {
  const randomId = Math.floor(Math.random() * USER_POOL_SIZE);
  return {
    email: `${USER_EMAIL_PREFIX}-${randomId}@${USER_EMAIL_DOMAIN}`,
    password: PASSWORD,
  };
}

export function getRandomCategory() {
  const randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex];
}

export function getRandomPriceRange() {
  const randomIndex = Math.floor(Math.random() * priceRanges.length);
  return priceRanges[randomIndex];
}
