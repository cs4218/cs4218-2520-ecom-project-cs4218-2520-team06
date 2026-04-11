// Kok Bo Chang, A0273542E
import { createSeededUserFlow } from "./seeded-user.flow.js";
import { newUserFlow } from "./new-user.flow.js";

const seededUserFlow = createSeededUserFlow();

export function runUserFlow(isSeeded, email, metrics) {
    if (isSeeded) {
        return seededUserFlow(email, metrics);
    } else {
        return newUserFlow(email, metrics);
    }
}