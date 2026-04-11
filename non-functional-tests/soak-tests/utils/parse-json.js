// Kok Bo Chang, A0273542E
export function parseJson(response) {
    try {
        return response.json();
    } catch {
        return null;
    }
}