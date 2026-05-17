const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000;

export async function uploadWithRetry(url, formData) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(url, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server responded with ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;

      if (err?.name === "AbortError") {
        throw new Error("Upload timed out after 30 seconds. Check your connection and try again.");
      }

      if (String(err?.message || "").includes("4")) {
        throw err;
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 800 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
