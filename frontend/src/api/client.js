const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const { headers: optionHeaders, ...requestOptions } = options;
  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(optionHeaders ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API ${response.status} ${response.statusText} — ${body}`);
  }

  return response.json();
}

export { API_BASE_URL };
