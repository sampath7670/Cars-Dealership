export async function api(path, data) {
  const options = { credentials: 'same-origin' };
  if (data !== undefined) {
    Object.assign(options, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
  const response = await fetch(`/api/${path.replace(/^\/+/, '')}`, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || 'Request failed. Please try again.');
  return json;
}
