let tousLesHotels = []

async function chargerHotels() {
  const response = await fetch('/api/hotels')
  tousLesHotels = await response.json()
  afficherHotels(tousLesHotels)
}

function afficherHotels(liste) {
  const grid = document.getElementById('hotels-grid')

  if (liste.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center; padding:3rem; color:#64748b; grid-column:1/-1;">
        <i class="fas fa-hotel" style="font-size:3rem; margin-bottom:1rem;"></i>
        <p>Aucun hôtel dans cette catégorie.</p>
      </div>
    `
    return
  }

  grid.innerHTML = ''

  liste.forEach(h => {
    grid.innerHTML += `
      <div class="card">
        <img src="images/${h.image}" alt="${h.nom}"
             onerror="this.src='images/placeholder.jpg'" />
        <div class="card-body">
          <span class="card-badge">
            <i class="fas fa-map-marker-alt"></i> ${h.ville}
          </span>
          <h3>${h.nom}</h3>
          <div class="card-info">
            <span style="color:#f59e0b">${'★'.repeat(h.etoiles)}${'☆'.repeat(5 - h.etoiles)}</span>
          </div>
          <div class="card-price">
            ${h.prix_par_nuit.toLocaleString()} FCFA
            <span>/ nuit</span>
          </div>
          <a href="reservation.html?type=hotel&id=${h.id}&nom=${encodeURIComponent(h.nom)}&prix=${h.prix_par_nuit}"
             class="btn btn-primary" style="width:100%; justify-content:center;">
            <i class="fas fa-calendar-check"></i> Réserver
          </a>
        </div>
      </div>
    `
  })
}

function filtrerHotels(valeur, bouton) {
  document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('active'))
  bouton.classList.add('active')

  if (valeur === 'tous') {
    afficherHotels(tousLesHotels)
  } else if (valeur === '4' || valeur === '5') {
    // Filtre par nombre d'étoiles
    const filtres = tousLesHotels.filter(h => h.etoiles === parseInt(valeur))
    afficherHotels(filtres)
  } else {
    // Filtre par ville
    const filtres = tousLesHotels.filter(h => h.ville === valeur)
    afficherHotels(filtres)
  }
}

chargerHotels()