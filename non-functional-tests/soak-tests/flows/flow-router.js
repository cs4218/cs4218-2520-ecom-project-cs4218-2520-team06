import { seededUserFlow } from "./seeded-user.flow.js";
import { newUserFlow } from "./new-user.flow.js";

export function runUserFlow(isSeeded, email, metrics) {
    if (isSeeded) {
        return seededUserFlow(email, metrics);
    } else {
        return newUserFlow(email, metrics);
    }
}