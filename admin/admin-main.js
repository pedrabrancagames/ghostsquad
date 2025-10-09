// Importando módulos
import { AdminAuthManager } from './modules/admin-auth.js';
import { UserManager } from './modules/user-manager.js';
import { StatsManager } from './modules/stats-manager.js';
import { ConfigManager } from './modules/config-manager.js';
import { AuditManager } from './modules/audit-manager.js';
import { initDashboard } from './components/dashboard.js';
import { initUserList } from './components/user-list.js';
import { initUserDetail } from './components/user-detail.js';
import { initReports } from './components/reports.js';
import { initSettings } from './components/settings.js';
import { initLocations } from './components/locations.js';
import { initLogs } from './components/logs.js';
import { initSystemLogs } from './components/system-logs.js';
import { notificationSystem } from './components/notification-system.js';
import { GhostManager } from './modules/ghost-manager.js';
import { EventManager } from './modules/event-manager.js';
import { initGhosts } from './components/ghosts.js';
import { initEvents } from './components/events.js';

// O Firebase foi inicializado no firebase-config.js
// Pegando a instância do Firebase já inicializada

// Referências aos elementos do DOM
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const usersSection = document.getElementById('users-section');
const userDetailSection = document.getElementById('user-detail-section');
const reportsSection = document.getElementById('reports-section');
const settingsSection = document.getElementById('settings-section');
const locationsSection = document.getElementById('locations-section');
const logsSection = document.getElementById('logs-section');
const systemLogsSection = document.getElementById('system-logs-section');
const ghostsSection = document.getElementById('ghosts-section');
const eventsSection = document.getElementById('events-section');
const mainNav = document.getElementById('main-nav');
const loginError = document.getElementById('login-error');
const googleLoginBtn = document.getElementById('google-login-btn');

// Instanciando os gerenciadores
const adminAuth = new AdminAuthManager(firebase);
const userManager = new UserManager(firebase.database());
const statsManager = new StatsManager(firebase.database());
const configManager = new ConfigManager(firebase.database());
const auditManager = new AuditManager(firebase.database());
const ghostManager = new GhostManager(firebase.database(), firebase.storage());
const eventManager = new EventManager(firebase.database(), firebase.storage());

let dashboardManager = null;

// Verificando se o usuário já está autenticado
adminAuth.onAuthStateChanged((user) => {
    if (user) {
        // Verificar privilégios administrativos
        adminAuth.checkAdminPrivileges(user).then(isAdmin => {
            if (isAdmin) {
                showDashboard();
            } else {
                // Usuário autenticado, mas não é admin
                adminAuth.logout();
                showLogin();
                showError('Acesso negado. Você não tem privilégios administrativos.');
            }
        }).catch(error => {
            console.error('Erro ao verificar privilégios:', error);
            adminAuth.logout();
            showLogin();
            showError('Erro ao verificar privilégios. Por favor, faça login novamente.');
        });
    } else {
        showLogin();
    }
});

// Função para mostrar a seção de login
function showLogin() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de login
    loginSection.style.display = 'block';
    mainNav.style.display = 'none';
    
    // Limpar erros
    loginError.style.display = 'none';
}

// Função para mostrar o dashboard
function showDashboard() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar dashboard e navegação
    dashboardSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo do dashboard
    loadDashboard();
}

// Função para mostrar a seção de usuários
function showUsers() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de usuários e navegação
    usersSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de usuários
    loadUsers();
}

// Função para mostrar a seção de detalhes do usuário
function showUserDetail(userId) {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de detalhes do usuário e navegação
    userDetailSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de detalhes do usuário
    loadUserDetail(userId);
}

// Função para mostrar a seção de relatórios
function showReports() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de relatórios e navegação
    reportsSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de relatórios
    loadReports();
}

// Função para mostrar a seção de configurações
function showSettings() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de configurações e navegação
    settingsSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de configurações
    loadSettings();
}

// Função para mostrar a seção de localizações
function showLocations() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de localizações e navegação
    locationsSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de localizações
    loadLocations();
}

// Função para mostrar a seção de logs
function showLogs() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de logs e navegação
    logsSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de logs
    loadLogs();
}

// Função para mostrar a seção de logs do sistema
function showSystemLogs() {
    // Esconder todas as seções
    hideAllSections();
    
    // Mostrar seção de logs do sistema e navegação
    systemLogsSection.style.display = 'block';
    mainNav.style.display = 'block';
    
    // Carregar conteúdo de logs do sistema
    loadSystemLogs();
}

// Função para esconder todas as seções
function hideAllSections() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'none';
    usersSection.style.display = 'none';
    userDetailSection.style.display = 'none';
    ghostsSection.style.display = 'none';
    eventsSection.style.display = 'none';
    reportsSection.style.display = 'none';
    settingsSection.style.display = 'none';
    locationsSection.style.display = 'none';
    logsSection.style.display = 'none';
    systemLogsSection.style.display = 'none';
}

// Função para carregar o conteúdo do dashboard
function loadDashboard() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;
    
    dashboardContent.innerHTML = `
        <div class="main-content">
            <div id="dashboard-container">
                <!-- O dashboard será carregado aqui -->
            </div>
        </div>
    `;
    
    // Inicializar o dashboard
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        initDashboard(dashboardContainer, firebase.database());
    }
    
    // Adicionar evento de logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        adminAuth.logout();
    });
    
    // Ativar item de navegação
    activateNavItem('dashboard');
}

// Função para carregar o conteúdo de usuários
function loadUsers() {
    const usersContent = document.getElementById('users-content');
    if (!usersContent) return;
    
    // Inicializar a lista de usuários
    initUserList(usersContent, userManager, adminAuth);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-users').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('users');
}

// Função para carregar o conteúdo de detalhes do usuário
function loadUserDetail(userId) {
    const userDetailContent = document.getElementById('user-detail-content');
    if (!userDetailContent) return;
    
    // Inicializar os detalhes do usuário
    initUserDetail(userDetailContent, userManager, adminAuth, userId);
    
    // Ativar item de navegação
    activateNavItem('users');
}

// Função para mostrar a seção de fantasmas
function showGhosts() {
    hideAllSections();
    ghostsSection.style.display = 'block';
    mainNav.style.display = 'block';
    loadGhosts();
}

// Função para mostrar a seção de eventos
function showEvents() {
    hideAllSections();
    eventsSection.style.display = 'block';
    mainNav.style.display = 'block';
    loadEvents();
}

// Função para carregar o conteúdo de fantasmas
function loadGhosts() {
    const ghostsContent = document.getElementById('ghosts-content');
    if (!ghostsContent) return;
    
    // Inicializar a lista de fantasmas
    initGhosts(ghostsContent, ghostManager, eventManager);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-ghosts').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('ghosts');
}

// Função para carregar o conteúdo de eventos
function loadEvents() {
    const eventsContent = document.getElementById('events-content');
    if (!eventsContent) return;
    
    // Inicializar a lista de eventos
    initEvents(eventsContent, eventManager);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-events').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('events');
}

// Função para carregar o conteúdo de relatórios
function loadReports() {
    const reportsContent = document.getElementById('reports-content');
    if (!reportsContent) return;
    
    // Inicializar os relatórios
    initReports(reportsContent, statsManager);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-reports').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('reports');
}

// Função para carregar o conteúdo de configurações
function loadSettings() {
    const settingsContent = document.getElementById('settings-content');
    if (!settingsContent) return;
    
    // Inicializar as configurações
    initSettings(settingsContent, configManager, adminAuth);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-settings').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('settings');
}

// Função para carregar o conteúdo de localizações
function loadLocations() {
    const locationsContent = document.getElementById('locations-content');
    if (!locationsContent) return;
    
    // Inicializar as localizações
    initLocations(locationsContent, configManager, adminAuth);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-locations').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('locations');
}

// Função para carregar o conteúdo de logs
function loadLogs() {
    const logsContent = document.getElementById('logs-content');
    if (!logsContent) return;
    
    // Inicializar os logs
    initLogs(logsContent, auditManager);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-logs').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('logs');
}

// Função para carregar o conteúdo de logs do sistema
function loadSystemLogs() {
    const systemLogsContent = document.getElementById('system-logs-content');
    if (!systemLogsContent) return;
    
    // Inicializar os logs do sistema
    initSystemLogs(systemLogsContent, auditManager);
    
    // Adicionar evento de voltar ao dashboard
    document.getElementById('back-to-dashboard-system-logs').addEventListener('click', () => {
        showDashboard();
    });
    
    // Ativar item de navegação
    activateNavItem('system-logs');
}

// Função para ativar um item de navegação
function activateNavItem(sectionId) {
    // Remover classe active de todos os itens
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar classe active ao item correspondente
    const activeItem = document.querySelector(`.nav-item a[href="#${sectionId}"]`);
    if (activeItem) {
        activeItem.closest('.nav-item').classList.add('active');
    }
}

// Função para lidar com a navegação por hash
function handleHashNavigation() {
    const hash = window.location.hash;
    
    switch (hash) {
        case '#dashboard':
            showDashboard();
            break;
        case '#users':
            showUsers();
            break;
        case '#ghosts':
            showGhosts();
            break;
        case '#events':
            showEvents();
            break;
        case '#reports':
            showReports();
            break;
        case '#settings':
            showSettings();
            break;
        case '#locations':
            showLocations();
            break;
        case '#logs':
            showLogs();
            break;
        case '#system-logs':
            showSystemLogs();
            break;
        case '':
            showDashboard();
            break;
        default:
            // Verificar se é uma rota de detalhes de usuário
            if (hash.startsWith('#user-detail/')) {
                const userId = hash.split('/')[1];
                showUserDetail(userId);
            } else {
                showDashboard();
            }
    }
}

// Adicionar evento de mudança de hash
window.addEventListener('hashchange', handleHashNavigation);

// Função para lidar com cliques na navegação
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            window.location.hash = href;
        });
    });
    
    // Adicionar eventos para botões de voltar
    document.getElementById('back-to-users').addEventListener('click', () => {
        window.location.hash = '#users';
    });
}

googleLoginBtn.addEventListener('click', async () => {
    loginError.style.display = 'none';
    googleLoginBtn.disabled = true;
    googleLoginBtn.innerHTML = '<span class="loading"></span> Autenticando...';
    
    try {
        await adminAuth.signInWithGoogle();
    } catch (error) {
        console.error('Erro de autenticação:', error);
        showError(error.message);
    } finally {
        googleLoginBtn.disabled = false;
        googleLoginBtn.textContent = 'Login com Google';
    }
});

// Função para mostrar erros
function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Inicializar navegação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    handleHashNavigation();
});

console.log('Painel Administrativo inicializado');