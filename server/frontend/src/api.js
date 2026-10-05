export async function api(path, data) {
  const options = { credentials:'same-origin' };
  if (data !== undefined) {
    const response = await fetch('/djangoapp/csrf', {credentials:'same-origin'});
    const {csrfToken} = await response.json();
    Object.assign(options, {method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':csrfToken},body:JSON.stringify(data)});
  }
  const response = await fetch('/djangoapp/' + path, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Request failed. Please try again.');
  return json;
}
