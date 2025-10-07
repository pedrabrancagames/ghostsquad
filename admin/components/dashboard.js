/**
 * Componente do Dashboard
 * 
 * Componente responsável por renderizar o dashboard principal
 * com métricas e informações em tempo real.
 */

// Importar o gerenciador do dashboard
import { DashboardManager } from '../modules/dashboard-manager.js';

/**
 * Inicializa o componente do dashboard
 * @param {HTMLElement} element - Elemento DOM onde o dashboard será renderizado
 * @param {Object} database - Instância do Firebase Database
 */
export function initDashboard(element, database) {
    if (!element || !database) {
        console.error('Elemento ou database não fornecidos para o dashboard');
        return;
    }
    
    // Criar instância do gerenciador do dashboard
    const dashboardManager = new DashboardManager(database);
    
    // Inicializar o dashboard
    dashboardManager.init(element);
    
    return dashboardManager;
}

/**
 * Atualiza os dados do dashboard
 * @param {DashboardManager} dashboardManager - Instância do gerenciador do dashboard
 */
export function updateDashboard(dashboardManager) {
    if (dashboardManager) {
        dashboardManager.loadDashboardData();
    }
}