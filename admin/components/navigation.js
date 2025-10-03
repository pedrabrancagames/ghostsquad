/**
 * Componente de Navegação
 * 
 * Componente responsável por gerenciar a navegação principal
 * do painel administrativo.
 */

/**
 * Inicializa o sistema de navegação
 * @param {HTMLElement} navElement - Elemento da navegação
 * @param {Function} onNavigate - Função de callback para navegação
 */
export function initNavigation(navElement, onNavigate) {
    if (!navElement || typeof onNavigate !== 'function') {
        console.error('Elemento de navegação ou callback não fornecidos');
        return;
    }
    
    // Definir itens de navegação
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'Usuários', icon: '👥' },
        { id: 'stats', label: 'Estatísticas', icon: '📈' },
        { id: 'config', label: 'Configurações', icon: '⚙️' },
        { id: 'logs', label: 'Logs', icon: '📝' }
    ];
    
    // Renderizar navegação
    renderNavigation(navElement, navItems);
    
    // Adicionar eventos de clique
    addNavigationEvents(navElement, onNavigate);
}

/**
 * Renderiza a navegação
 * @param {HTMLElement} navElement - Elemento da navegação
 * @param {Array} items - Itens de navegação
 */
function renderNavigation(navElement, items) {
    navElement.innerHTML = `
        <nav class="main-nav">
            <ul class="nav-list">
                ${items.map(item => `
                    <li class="nav-item" data-page="${item.id}">
                        <a href="#" class="nav-link">
                            <span class="nav-icon">${item.icon}</span>
                            <span class="nav-label">${item.label}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </nav>
    `;
}

/**
 * Adiciona eventos de clique à navegação
 * @param {HTMLElement} navElement - Elemento da navegação
 * @param {Function} onNavigate - Função de callback para navegação
 */
function addNavigationEvents(navElement, onNavigate) {
    const navItems = navElement.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe ativa de todos os itens
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Adicionar classe ativa ao item clicado
            item.classList.add('active');
            
            // Chamar callback de navegação
            const pageId = item.getAttribute('data-page');
            onNavigate(pageId);
        });
    });
}

/**
 * Ativa um item de navegação
 * @param {HTMLElement} navElement - Elemento da navegação
 * @param {string} pageId - ID da página a ser ativada
 */
export function activateNavItem(navElement, pageId) {
    const navItems = navElement.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}