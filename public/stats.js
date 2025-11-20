async function load() {
  const parts = location.pathname.split('/');
  const code = parts[2];
  const el = document.getElementById('content');

  try {
    const res = await fetch('/api/links/' + code);

    if (res.status === 404) {
      el.innerHTML = '<p class="muted">Not found</p>';
      return;
    }

    const data = await res.json();

    el.innerHTML = `
      <h2>Link Analytics</h2>
      <p><strong>Code:</strong> ${data.code}</p>
      <p><strong>Target URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>
      <p><strong>Short URL:</strong> <a href="${location.origin}/${data.code}">${location.origin}/${data.code}</a></p>
      <p><strong>Clicks:</strong> ${data.clicks}</p>
      <p><strong>Last Clicked:</strong> ${data.last_clicked ? new Date(data.last_clicked).toLocaleString() : "—"}</p>
      <p><strong>Created At:</strong> ${new Date(data.created_at).toLocaleString()}</p>
    `;
  } catch (err) {
    el.innerHTML = '<p class="error">Error loading data</p>';
  }
}

load();
