// ─── INITIALISATION ──────────────────────────────────
window.addEventListener('load', () => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    afficherDashboard()
  }
})

// ─── CONNEXION / DÉCONNEXION ─────────────────────────
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
  // Charge les données de la section active par défaut
  chargerReservations()
  chargerVehicules()
  chargerHotels()
}

function seDeconnecter() {
  localStorage.removeItem('adminToken')
  window.location.reload()
}

// ─── ONGLETS ─────────────────────────────────────────
function afficherSection(nom) {
  // Cache toutes les sections
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none')
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))

  // Affiche la bonne
  document.getElementById(`section-${nom}`).style.display = 'block'
  event.target.classList.add('active')
}

// ─── HEADERS avec token ───────────────────────────────
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('adminToken')
  }
}

// ─── RÉSERVATIONS ─────────────────────────────────────
async function chargerReservations() {
  const response = await fetch('/admin/reservations', { headers: getHeaders() })
  const data = await response.json()

  const container = document.getElementById('tableau-reservations')

  if (!data.length) {
    container.innerHTML = '<p>Aucune réservation pour le moment.</p>'
    return
  }

  // On construit un tableau HTML
  let html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Type</th>
          <th>Client</th>
          <th>Email</th>
          <th>Début</th>
          <th>Fin</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
  `

  data.forEach(r => {
    html += `
      <tr>
        <td>#${r.id}</td>
        <td><span class="card-badge">${r.type}</span></td>
        <td>${r.nom_client}</td>
        <td>${r.email_client}</td>
        <td>${r.date_debut}</td>
        <td>${r.date_fin}</td>
        <td><strong>${r.prix_total.toLocaleString()} FCFA</strong></td>
      </tr>
    `
  })

  html += `</tbody></table>`
  container.innerHTML = html
}

// ─── VÉHICULES ────────────────────────────────────────
async function chargerVehicules() {
  const response = await fetch('/admin/vehicules', { headers: getHeaders() })
  const data = await response.json()

  const container = document.getElementById('liste-vehicules')

  let html = `<table class="admin-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Nom</th>
        <th>Type</th>
        <th>Prix/jour</th>
        <th>Places</th>
        <th>Statut</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>`

  data.forEach(v => {
    html += `
      <tr id="v-row-${v.id}">
        <td>#${v.id}</td>
        <td>${v.nom}</td>
        <td>${v.type}</td>
        <td>${v.prix_par_jour.toLocaleString()} FCFA</td>
        <td>${v.places} places</td>
        <td>
          <span class="statut ${v.disponible ? 'actif' : 'inactif'}">
            ${v.disponible ? '✅ Actif' : '⏸️ Inactif'}
          </span>
        </td>
        <td class="actions">
          <button onclick="toggleVehicule(${v.id}, ${v.disponible})"
                  class="btn-small ${v.disponible ? 'btn-warning' : 'btn-success'}">
            ${v.disponible ? 'Désactiver' : 'Activer'}
          </button>
          <button onclick="supprimerVehicule(${v.id})" class="btn-small btn-danger">
            Supprimer
          </button>
        </td>
      </tr>
    `
  })

  html += `</tbody></table>`
  container.innerHTML = html
}

async function toggleVehicule(id, etatActuel) {
  const response = await fetch(`/admin/vehicules/${id}/desactiver`, {
    method: 'PUT',
    headers: getHeaders()
  })
  const data = await response.json()
  alert(data.message)
  chargerVehicules() // recharge la liste
}

async function supprimerVehicule(id) {
  if (!confirm('Supprimer ce véhicule définitivement ?')) return

  const response = await fetch(`/admin/vehicules/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  const data = await response.json()
  alert(data.message)
  chargerVehicules()
}

async function ajouterVehicule() {
  const body = {
    nom:           document.getElementById('v-nom').value,
    type:          document.getElementById('v-type').value,
    prix_par_jour: parseFloat(document.getElementById('v-prix').value),
    places:        parseInt(document.getElementById('v-places').value)
  }

  const response = await fetch('/admin/vehicules', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  })

  const data = await response.json()
  document.getElementById('v-msg').textContent = data.message || data.erreur
  chargerVehicules()
}

// ─── HÔTELS ───────────────────────────────────────────
async function chargerHotels() {
  const response = await fetch('/admin/hotels', { headers: getHeaders() })
  const data = await response.json()

  const container = document.getElementById('liste-hotels')

  let html = `<table class="admin-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Nom</th>
        <th>Ville</th>
        <th>Prix/nuit</th>
        <th>Étoiles</th>
        <th>Statut</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>`

  data.forEach(h => {
    html += `
      <tr id="h-row-${h.id}">
        <td>#${h.id}</td>
        <td>${h.nom}</td>
        <td>${h.ville}</td>
        <td>${h.prix_par_nuit.toLocaleString()} FCFA</td>
        <td>${'★'.repeat(h.etoiles)}${'☆'.repeat(5 - h.etoiles)}</td>
        <td>
          <span class="statut ${h.disponible ? 'actif' : 'inactif'}">
            ${h.disponible ? '✅ Actif' : '⏸️ Inactif'}
          </span>
        </td>
        <td class="actions">
          <button onclick="toggleHotel(${h.id}, ${h.disponible})"
                  class="btn-small ${h.disponible ? 'btn-warning' : 'btn-success'}">
            ${h.disponible ? 'Désactiver' : 'Activer'}
          </button>
          <button onclick="supprimerHotel(${h.id})" class="btn-small btn-danger">
            Supprimer
          </button>
        </td>
      </tr>
    `
  })

  html += `</tbody></table>`
  container.innerHTML = html
}

async function toggleHotel(id) {
  const response = await fetch(`/admin/hotels/${id}/desactiver`, {
    method: 'PUT',
    headers: getHeaders()
  })
  const data = await response.json()
  alert(data.message)
  chargerHotels()
}

async function supprimerHotel(id) {
  if (!confirm('Supprimer cet hôtel définitivement ?')) return

  const response = await fetch(`/admin/hotels/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  const data = await response.json()
  alert(data.message)
  chargerHotels()
}

async function ajouterHotel() {
  const body = {
    nom:           document.getElementById('h-nom').value,
    ville:         document.getElementById('h-ville').value,
    prix_par_nuit: parseFloat(document.getElementById('h-prix').value),
    etoiles:       parseInt(document.getElementById('h-etoiles').value)
  }

  const response = await fetch('/admin/hotels', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  })

  const data = await response.json()
  document.getElementById('h-msg').textContent = data.message || data.erreur
  chargerHotels()
}