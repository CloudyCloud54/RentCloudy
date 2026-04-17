// ─── INITIALISATION ───────────────────────────────────
window.addEventListener('load', () => {
  if (localStorage.getItem('adminToken')) afficherDashboard()
})

// ─── CONNEXION / DÉCONNEXION ──────────────────────────
async function seConnecter() {
  const email    = document.getElementById('admin-email').value
  const password = document.getElementById('admin-password').value

  const response = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()

  if (data.token) {
    localStorage.setItem('adminToken', data.token)
    afficherDashboard()
  } else {
    document.getElementById('login-erreur').textContent = data.erreur
  }
}

function afficherDashboard() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('dashboard').style.display = 'block'
  chargerStats()
  chargerReservations()
  chargerVehicules()
  chargerHotels()
}

function seDeconnecter() {
  localStorage.removeItem('adminToken')
  window.location.reload()
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('adminToken')
  }
}

// ─── ONGLETS ──────────────────────────────────────────
function afficherSection(nom, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none')
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  document.getElementById(`section-${nom}`).style.display = 'block'
  el.classList.add('active')
}

// ─── STATS GLOBALES ───────────────────────────────────
async function chargerStats() {
  const [rRes, vRes, hRes] = await Promise.all([
    fetch('/admin/reservations', { headers: getHeaders() }),
    fetch('/admin/vehicules', { headers: getHeaders() }),
    fetch('/admin/hotels', { headers: getHeaders() })
  ])
  const reservations = await rRes.json()
  const vehicules = await vRes.json()
  const hotels = await hRes.json()

  const totalRevenu = Array.isArray(reservations)
    ? reservations.reduce((s, r) => s + (r.prix_total || 0), 0)
    : 0

  document.getElementById('stats').innerHTML = `
    <div class="stat-card">
      <i class="fas fa-list-alt" style="color:#3b82f6;"></i>
      <div>
        <span class="stat-val">${Array.isArray(reservations) ? reservations.length : 0}</span>
        <span class="stat-label">Réservations</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fas fa-car" style="color:#8b5cf6;"></i>
      <div>
        <span class="stat-val">${Array.isArray(vehicules) ? vehicules.length : 0}</span>
        <span class="stat-label">Véhicules</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fas fa-hotel" style="color:#f59e0b;"></i>
      <div>
        <span class="stat-val">${Array.isArray(hotels) ? hotels.length : 0}</span>
        <span class="stat-label">Hôtels</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fas fa-coins" style="color:#22c55e;"></i>
      <div>
        <span class="stat-val">${totalRevenu.toLocaleString()}</span>
        <span class="stat-label">FCFA total</span>
      </div>
    </div>
  `
}

// ─── RÉSERVATIONS ─────────────────────────────────────
async function chargerReservations() {
  const response = await fetch('/admin/reservations', { headers: getHeaders() })
  const data = await response.json()
  const container = document.getElementById('tableau-reservations')

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>Aucune réservation pour le moment.</div>'
    return
  }

  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>#</th><th>Type</th><th>Item réservé</th><th>Client</th>
          <th>Email</th><th>Début</th><th>Fin</th><th>Total</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
  `

  data.forEach(r => {
    html += `
      <tr id="resa-row-${r.id}">
        <td>#${r.id}</td>
        <td><span class="card-badge">${r.type === 'vehicule' ? '🚗 Véhicule' : '🏨 Hôtel'}</span></td>
        <td><strong>${r.nom_item || '—'}</strong></td>
        <td>${r.nom_client}</td>
        <td>${r.email_client}</td>
        <td>${r.date_debut}</td>
        <td>${r.date_fin}</td>
        <td><strong style="color:#16a34a;">${r.prix_total.toLocaleString()} FCFA</strong></td>
        <td>
          <button onclick="supprimerReservation(${r.id})" class="btn-small btn-danger">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
  })

  html += '</tbody></table>'
  container.innerHTML = html
}

async function supprimerReservation(id) {
  if (!confirm(`Supprimer la réservation #${id} définitivement ?`)) return
  const response = await fetch(`/admin/reservations/${id}`, {
    method: 'DELETE', headers: getHeaders()
  })
  const data = await response.json()
  if (data.message) {
    document.getElementById(`resa-row-${id}`)?.remove()
    chargerStats()
  } else {
    alert(data.erreur)
  }
}

// ─── VÉHICULES ────────────────────────────────────────
async function chargerVehicules() {
  const response = await fetch('/admin/vehicules', { headers: getHeaders() })
  const data = await response.json()
  const container = document.getElementById('liste-vehicules')

  let html = `<table class="admin-table">
    <thead><tr><th>#</th><th>Nom</th><th>Type</th><th>Prix/jour</th><th>Places</th><th>Statut</th><th>Actions</th></tr></thead>
    <tbody>`

  data.forEach(v => {
    html += `
      <tr id="v-row-${v.id}">
        <td>#${v.id}</td>
        <td>${v.nom}</td>
        <td>${v.type}</td>
        <td>${v.prix_par_jour.toLocaleString()} FCFA</td>
        <td>${v.places} places</td>
        <td><span class="statut ${v.disponible ? 'actif' : 'inactif'}">${v.disponible ? '✅ Actif' : '⏸️ Inactif'}</span></td>
        <td class="actions">
          <button onclick="toggleVehicule(${v.id})" class="btn-small ${v.disponible ? 'btn-warning' : 'btn-success'}">
            ${v.disponible ? 'Désactiver' : 'Activer'}
          </button>
          <button onclick="supprimerVehicule(${v.id})" class="btn-small btn-danger">Supprimer</button>
        </td>
      </tr>`
  })
  html += '</tbody></table>'
  container.innerHTML = html
}

async function toggleVehicule(id) {
  const res = await fetch(`/admin/vehicules/${id}/desactiver`, { method: 'PUT', headers: getHeaders() })
  const data = await res.json()
  alert(data.message)
  chargerVehicules()
  chargerStats()
}

async function supprimerVehicule(id) {
  if (!confirm('Supprimer ce véhicule définitivement ?')) return
  const res = await fetch(`/admin/vehicules/${id}`, { method: 'DELETE', headers: getHeaders() })
  const data = await res.json()
  alert(data.message)
  chargerVehicules()
  chargerStats()
}

async function ajouterVehicule() {
  const body = {
    nom:           document.getElementById('v-nom').value,
    type:          document.getElementById('v-type').value,
    prix_par_jour: parseFloat(document.getElementById('v-prix').value),
    places:        parseInt(document.getElementById('v-places').value)
  }

  if (!body.nom || !body.type || !body.prix_par_jour || !body.places) {
    document.getElementById('v-msg').textContent = '⚠️ Remplissez tous les champs'
    return
  }

  const res = await fetch('/admin/vehicules', {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(body)
  })
  const data = await res.json()
  document.getElementById('v-msg').textContent = data.message || data.erreur
  if (data.message) {
    document.getElementById('v-nom').value = ''
    document.getElementById('v-type').value = ''
    document.getElementById('v-prix').value = ''
    document.getElementById('v-places').value = ''
    chargerVehicules()
    chargerStats()
  }
}

// ─── HÔTELS ───────────────────────────────────────────
async function chargerHotels() {
  const response = await fetch('/admin/hotels', { headers: getHeaders() })
  const data = await response.json()
  const container = document.getElementById('liste-hotels')

  let html = `<table class="admin-table">
    <thead><tr><th>#</th><th>Nom</th><th>Ville</th><th>Prix/nuit</th><th>Étoiles</th><th>Statut</th><th>Actions</th></tr></thead>
    <tbody>`

  data.forEach(h => {
    html += `
      <tr id="h-row-${h.id}">
        <td>#${h.id}</td>
        <td>${h.nom}</td>
        <td>${h.ville}</td>
        <td>${h.prix_par_nuit.toLocaleString()} FCFA</td>
        <td>${'★'.repeat(h.etoiles)}${'☆'.repeat(5 - h.etoiles)}</td>
        <td><span class="statut ${h.disponible ? 'actif' : 'inactif'}">${h.disponible ? '✅ Actif' : '⏸️ Inactif'}</span></td>
        <td class="actions">
          <button onclick="toggleHotel(${h.id})" class="btn-small ${h.disponible ? 'btn-warning' : 'btn-success'}">
            ${h.disponible ? 'Désactiver' : 'Activer'}
          </button>
          <button onclick="supprimerHotel(${h.id})" class="btn-small btn-danger">Supprimer</button>
        </td>
      </tr>`
  })
  html += '</tbody></table>'
  container.innerHTML = html
}

async function toggleHotel(id) {
  const res = await fetch(`/admin/hotels/${id}/desactiver`, { method: 'PUT', headers: getHeaders() })
  const data = await res.json()
  alert(data.message)
  chargerHotels()
  chargerStats()
}

async function supprimerHotel(id) {
  if (!confirm('Supprimer cet hôtel définitivement ?')) return
  const res = await fetch(`/admin/hotels/${id}`, { method: 'DELETE', headers: getHeaders() })
  const data = await res.json()
  alert(data.message)
  chargerHotels()
  chargerStats()
}

async function ajouterHotel() {
  const body = {
    nom:           document.getElementById('h-nom').value,
    ville:         document.getElementById('h-ville').value,
    prix_par_nuit: parseFloat(document.getElementById('h-prix').value),
    etoiles:       parseInt(document.getElementById('h-etoiles').value)
  }

  if (!body.nom || !body.ville || !body.prix_par_nuit || !body.etoiles) {
    document.getElementById('h-msg').textContent = '⚠️ Remplissez tous les champs'
    return
  }

  const res = await fetch('/admin/hotels', {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(body)
  })
  const data = await res.json()
  document.getElementById('h-msg').textContent = data.message || data.erreur
  if (data.message) {
    document.getElementById('h-nom').value = ''
    document.getElementById('h-ville').value = ''
    document.getElementById('h-prix').value = ''
    document.getElementById('h-etoiles').value = ''
    chargerHotels()
    chargerStats()
  }
}
