const api = {
  list: async () => {
    const r = await fetch('/api/links');
    return await r.json();
  },

  create: async (data) => {
    const r = await fetch('/api/links', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  },

  delete: async (code) => {
    const r = await fetch('/api/links/' + code, { method: 'DELETE' });
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  }
};

const urlInput = document.getElementById('url');
const codeInput = document.getElementById('code');
const createBtn = document.getElementById('createBtn');
const createForm = document.getElementById('createForm');
const formMsg = document.getElementById('formMsg');
const linksBody = document.getElementById('linksBody');
const emptyState = document.getElementById('emptyState');
const filterInput = document.getElementById('filter');
const refreshBtn = document.getElementById('refresh');

function showMsg(msg, isError = false) {
  formMsg.textContent = msg;
  formMsg.className = isError ? 'error' : 'success';

  setTimeout(() => {
    if (formMsg.textContent === msg) formMsg.textContent = '';
  }, 2500);
}

async function load() {
  linksBody.innerHTML =
    '<tr><td colspan="5" class="muted">Loading...</td></tr>';

  try {
    const list = await api.list();
    renderList(list);
  } catch (err) {
    linksBody.innerHTML =
      '<tr><td colspan="5" class="error">Failed to load</td></tr>';
  }
}

function renderList(list) {
  const q = filterInput.value.trim().toLowerCase();

  const filtered = list.filter(
    (l) =>
      !q ||
      l.code.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    linksBody.innerHTML =
      '<tr><td colspan="5" class="muted">No results</td></tr>';

    emptyState.style.display = list.length === 0 ? 'block' : 'none';
    return;
  }

  emptyState.style.display = 'none';
  linksBody.innerHTML = '';

  for (const l of filtered) {
    const shortUrl = `${location.origin}/${l.code}`;
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><a href="/code/${l.code}" class="small">${l.code}</a></td>
      <td><span class="urlcell">${l.url}</span></td>
      <td>${l.clicks}</td>
      <td>${l.last_clicked ? new Date(l.last_clicked).toLocaleString() : '—'}</td>
      <td>
        <button class="action-btn copy" data-short="${shortUrl}">Copy</button>
        <button class="action-btn delete" data-code="${l.code}">Delete</button>
      </td>
    `;

    linksBody.appendChild(tr);
  }
}

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  createBtn.disabled = true;

  showMsg('Creating...');

  const url = urlInput.value.trim();
  const code = codeInput.value.trim() || undefined;

  try {
    const res = await api.create({ url, code });

    if (res.status === 201) {
      const short = `${location.origin}/${res.body.code}`;
      showMsg(`Created: ${short}`);

      urlInput.value = '';
      codeInput.value = '';

      load();
    } else if (res.status === 409) {
      showMsg('Code already exists', true);
    } else {
      showMsg(res.body?.error || 'Failed to create link', true);
    }
  } catch {
    showMsg('Network error', true);
  }

  createBtn.disabled = false;
});

document.addEventListener('click', async (e) => {
  if (e.target.matches('button.copy')) {
    const txt = e.target.dataset.short;
    try {
      await navigator.clipboard.writeText(txt);
      showMsg('Copied');
    } catch {
      showMsg('Copy failed', true);
    }
    return;
  }

  if (e.target.matches('button.delete')) {
    const code = e.target.dataset.code;

    if (!confirm(`Delete "${code}" ?`)) return;

    e.target.disabled = true;

    const res = await api.delete(code);

    if (res.status === 200) {
      showMsg('Deleted');
      load();
    } else {
      showMsg('Delete failed', true);
    }

    e.target.disabled = false;
  }
});

filterInput.addEventListener('input', () => load());
refreshBtn.addEventListener('click', () => load());

document.getElementById('clearBtn').addEventListener('click', () => {
  urlInput.value = '';
  codeInput.value = '';
});

load();
