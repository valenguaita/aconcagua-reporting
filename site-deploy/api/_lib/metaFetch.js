// Sigue la paginación de la Graph API (paging.next) hasta traer todas las filas.
async function fetchAllPages(url, maxPages = 10) {
  const rows = [];
  let next = url;
  for (let i = 0; i < maxPages && next; i++) {
    const res = await fetch(next);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'Error de la API de Meta');
    rows.push(...(json.data || []));
    next = json.paging && json.paging.next;
  }
  return rows;
}

module.exports = { fetchAllPages };
