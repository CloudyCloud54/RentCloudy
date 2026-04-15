// On garde tous les véhicules en mémoire pour filtrer sans rappeler le serveur
let tousLesVehicules = []

async function chargerVehicules() {
  const response = await fetch('/api/vehicules')
  tousLesVehicules = await response.json()
  afficherVehicules(tousLesVehicules)
}

function afficherVehicules(liste) {
  const grid = document.getElementById('vehicules-grid')

  // Si la liste est vide après filtre
  if (liste.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center; padding:3rem; color:#64748b; grid-column:1/-1;">
        <i class="fas fa-car" style="font-size:3rem; margin-bottom:1rem;"></i>
        <p>Aucun véhicule dans cette catégorie.</p>
      </div>
    `
    return
  }

  grid.innerHTML = ''

  liste.forEach(v => {
    grid.innerHTML += `
      <div class="card">
        <img src="images/${v.image}" alt="${v.nom}"
             onerror="this.src='images/placeholder.jpg'" />
        <div class="card-body">
          <span class="card-badge">${v.type}</span>
          <h3>${v.nom}</h3>
          <div class="card-info">
            <span><i class="fas fa-users"></i> ${v.places} places</span>
          </div>
          <div class="card-price">
            ${v.prix_par_jour.toLocaleString()} FCFA
            <span>/ jour</span>
          </div>
          <a href="reservation.html?type=vehicule&id=${v.id}&nom=${encodeURIComponent(v.nom)}&prix=${v.prix_par_jour}"
             class="btn btn-primary" style="width:100%; justify-content:center;">
            <i class="fas fa-calendar-check"></i> Réserver
          </a>
        </div>
      </div>
    `
  })
}

function filtrer(type, bouton) {
  // Met à jour le bouton actif
  document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('active'))
  bouton.classList.add('active')

  // Filtre la liste déjà en mémoire — pas besoin de rappeler le serveur
  if (type === 'tous') {
    afficherVehicules(tousLesVehicules)
  } else {
    const filtres = tousLesVehicules.filter(v => v.type === type)
    afficherVehicules(filtres)
  }
}

chargerVehicules()