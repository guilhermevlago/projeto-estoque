document.addEventListener('DOMContentLoaded', () => {
  fetch('./navbar.html')
    .then(response => {
      if (!response.ok) throw new Error('Navbar não encontrada (404)');
      return response.text();
    })
    .then(html => {
      const placeholder = document.getElementById('navbar-placeholder');
      if (!placeholder) {
        console.warn('Elemento #navbar-placeholder não encontrado no DOM');
        return;
      }
      placeholder.innerHTML = html;
      filterMenuByProfile(); // Filtra menu por perfil
      setupSidebar();
      setupLogoutButton();
      highlightActiveNavItem();
    })
    .catch(err => console.error('Erro ao carregar navbar:', err));
});

function filterMenuByProfile() {
  const perfil = localStorage.getItem('perfil');
  if (!perfil) return;
  
  const menuItems = document.querySelectorAll('#sidebar .nav-item[data-perfil]');
  
  menuItems.forEach(item => {
    const allowedProfiles = item.getAttribute('data-perfil').split(',');
    
    if (allowedProfiles.includes(perfil)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

function setupSidebar() {
  const toggleButton = document.getElementById('toggle-sidebar');
  const sidebar = document.getElementById('sidebar');
  const pageContent = document.getElementById('page-content');

  if (!toggleButton || !sidebar || !pageContent) {
    console.warn('Elementos da sidebar não encontrados');
    return;
  }

  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  sidebar.classList.toggle('collapsed', isCollapsed);
  pageContent.classList.toggle('sidebar-collapsed', isCollapsed);

  toggleButton.addEventListener('click', () => {
    const nowCollapsed = !sidebar.classList.contains('collapsed');
    sidebar.classList.toggle('collapsed');
    pageContent.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', nowCollapsed);
    
    document.dispatchEvent(new CustomEvent('sidebarToggled', { 
      detail: { collapsed: nowCollapsed }
    }));
  });
}

function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');
  if (!logoutButton) return;
  logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (confirm('Tem certeza que deseja sair do sistema?')) {
      logout(); // Usa função do utils.js
    }
  });
}

function highlightActiveNavItem() {
  const currentPage = document.body.getAttribute('data-page');
  if (!currentPage) return;

  const navLinks = document.querySelectorAll('#sidebar .nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href').replace('.html', '');
    if (href === currentPage) {
      link.classList.add('active');
      
      setTimeout(() => {
        link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    } else {
      link.classList.remove('active');
    }
  });
}