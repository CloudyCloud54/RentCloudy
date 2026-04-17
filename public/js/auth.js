// ─── HELPERS AUTH CLIENT ─────────────────────────────
function getClientToken() { return localStorage.getItem('clientToken') }
function getClientNom()   { return localStorage.getItem('clientNom') }
function getClientEmail() { return localStorage.getItem('clientEmail') }
function isConnecte()     { return !!getClientToken() }

function seDeconnecterClient() {
  localStorage.removeItem('clientToken')
  localStorage.removeItem('clientNom')
  localStorage.removeItem('clientEmail')
  window.location.href = 'index.html'
}

// ─── NAVBAR DYNAMIQUE ────────────────────────────────
function mettreAJourNavbar() {
  const zone = document.getElementById('nav-auth')
  if (!zone) return

  if (isConnecte()) {
    const initiale = (getClientNom() || '?')[0].toUpperCase()
    zone.innerHTML = `
      <li style="display:flex;align-items:center;gap:0.75rem;">
        <a href="profil.html" style="display:flex;align-items:center;gap:0.6rem;text-decoration:none;color:#1e293b;">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);
               display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.9rem;">
            ${initiale}
          </div>
          <span style="font-weight:600;color:#1e293b;">${getClientNom()}</span>
        </a>
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

function exigerConnexion() {
  if (!isConnecte()) {
    window.location.href = `connexion.html?redirect=${encodeURIComponent(window.location.href)}`
    return false
  }
  return true
}

document.addEventListener('DOMContentLoaded', mettreAJourNavbar)
