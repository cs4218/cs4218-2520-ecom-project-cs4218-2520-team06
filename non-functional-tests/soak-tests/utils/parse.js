export function parseJson(response) {
    try {
        return response.json();
    } catch {
        return null;
    }
}