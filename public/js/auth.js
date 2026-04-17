// ─── HELPERS AUTH CLIENT ─────────────────────────────
function getClientToken() { return localStorage.getItem('clientToken') }
function getClientNom()   { return localStorage.getItem('clientNom') }
function isConnecte()     { return !!getClientToken() }

function seDeconnecterClient() {
  localStorage.removeItem('clientToken')
  localStorage.removeItem('clientNom')
  localStorage.removeItem('clientEmail')
  window.location.href = 'index.html'
}

// ─── NAVBAR DYNAMIQUE ────────────────────────────────
// Injecte les bons liens selon l'état de connexion
function mettreAJourNavbar() {
  const zone = document.getElementById('nav-auth')
  if (!zone) return

  if (isConnecte()) {
    zone.innerHTML = `
      <li>
        <a href="dashboard.html" style="display:flex;align-items:center;gap:0.4rem;">
          <i class="fas fa-user-circle" style="color:#3b82f6;"></i>
          <strong>${getClientNom()}</strong>
        </a>
      </li>
      <li>
        <button class="btn btn-secondary" style="padding:0.4rem 1rem;"
                onclick="seDeconnecterClient()">
          <i class="fas fa-sign-out-alt"></i> Déconnexion
        </button>
      </li>
    `
  } else {
    zone.innerHTML = `
      <li><a href="connexion.html"><i class="fas fa-sign-in-alt"></i> Connexion</a></li>
      <li>
        <a href="inscription.html" class="btn btn-primary" style="padding:0.4rem 1rem;">
          <i class="fas fa-user-plus"></i> S'inscrire
        </a>
      </li>
    `
  }
}

// ─── GARDE DE ROUTE : redirige si non connecté ───────
function exigerConnexion() {
  if (!isConnecte()) {
    window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.href)}`
    return false
  }
  return true
}

// Lance la navbar dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', mettreAJourNavbar)
