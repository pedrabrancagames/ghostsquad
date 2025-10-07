/**
 * Componente de Logs
 * 
 * Componente responsável por exibir os logs de auditoria e sistema.
 */

/**
 * Inicializa o componente de logs
 * @param {HTMLElement} element - Elemento DOM onde os logs serão renderizados
 * @param {Object} auditManager - Instância do AuditManager
 */
export async function initLogs(element, auditManager) {
    if (!element || !auditManager) {
        console.error('Elemento ou AuditManager não fornecidos para o componente de logs');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="logs-container">
                <div class="loading">Carregando logs...</div>
            </div>
        `;
        
        // Carregar logs de auditoria
        const auditLogs = await auditManager.getAuditLogs({}, 100);
        
        // Carregar administradores ativos
        const activeAdmins = await auditManager.getActiveAdmins();
        
        // Renderizar interface
        renderLogs(element, auditLogs, activeAdmins);
        
        // Configurar eventos
        setupEventListeners(element, auditManager, auditLogs, activeAdmins);
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        element.innerHTML = `
            <div class="logs-container">
                <div class="error">Erro ao carregar logs: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de logs
 * @param {HTMLElement} element - Elemento DOM onde os logs serão renderizados
 * @param {Array} auditLogs - Lista de logs de auditoria
 * @param {Array} activeAdmins - Lista de administradores ativos
 */
function renderLogs(element, auditLogs, activeAdmins) {
    element.innerHTML = `
        <div class="logs-container">
            <div class="logs-header">
                <h2>Logs e Auditoria</h2>
                <p>Visualize as atividades administrativas e logs do sistema</p>
            </div>
            
            <div class="logs-content">
                <div class="logs-section">
                    <h3>Administradores Ativos</h3>
                    <div class="active-admins">
                        ${renderActiveAdmins(activeAdmins)}
                    </div>
                </div>
                
                <div class="logs-section">
                    <h3>Filtros de Logs</h3>
                    <div class="logs-filters">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="admin-filter">Administrador:</label>
                                <select id="admin-filter">
                                    <option value="">Todos</option>
                                    ${renderAdminOptions(activeAdmins)}
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="action-filter">Ação:</label>
                                <select id="action-filter">
                                    <option value="">Todas</option>
                                    <option value="login">Login</option>
                                    <option value="logout">Logout</option>
                                    <option value="ban_user">Banir Usuário</option>
                                    <option value="unban_user">Desbanir Usuário</option>
                                    <option value="edit_user_points">Editar Pontos</option>
                                    <option value="edit_user_captures">Editar Capturas</option>
                                    <option value="add_location">Adicionar Localização</option>
                                    <option value="update_location">Atualizar Localização</option>
                                    <option value="remove_location">Remover Localização</option>
                                    <option value="activate_location">Ativar Localização</option>
                                    <option value="deactivate_location">Desativar Localização</option>
                                    <option value="update_game_config">Atualizar Configurações</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="date-filter">Período:</label>
                                <select id="date-filter">
                                    <option value="all">Todo o período</option>
                                    <option value="today">Hoje</option>
                                    <option value="week">Últimos 7 dias</option>
                                    <option value="month">Últimos 30 dias</option>
                                </select>
                            </div>
                            <div class="filter-actions">
                                <button id="apply-filters" class="btn-primary">Aplicar Filtros</button>
                                <button id="clear-filters" class="btn-secondary">Limpar</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="logs-section">
                    <h3>Logs de Auditoria</h3>
                    <div class="logs-table-container">
                        <table class="logs-table">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Administrador</th>
                                    <th>Ação</th>
                                    <th>Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderAuditLogs(auditLogs)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a lista de administradores ativos
 * @param {Array} activeAdmins - Lista de administradores ativos
 * @returns {string} - HTML dos administradores ativos
 */
function renderActiveAdmins(activeAdmins) {
    if (!activeAdmins || activeAdmins.length === 0) {
        return '<p class="no-active-admins">Nenhum administrador ativo no momento</p>';
    }
    
    return `
        <ul class="admins-list">
            ${activeAdmins.map(admin => `
                <li class="admin-item">
                    <span class="admin-name">${admin.name || admin.email}</span>
                    <span class="admin-email">${admin.email}</span>
                    <span class="admin-role">${admin.role || 'admin'}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Renderiza as opções de administradores para o filtro
 * @param {Array} activeAdmins - Lista de administradores ativos
 * @returns {string} - HTML das opções
 */
function renderAdminOptions(activeAdmins) {
    if (!activeAdmins || activeAdmins.length === 0) {
        return '';
    }
    
    return activeAdmins.map(admin => `
        <option value="${admin.id}">${admin.name || admin.email}</option>
    `).join('');
}

/**
 * Renderiza a tabela de logs de auditoria
 * @param {Array} auditLogs - Lista de logs de auditoria
 * @returns {string} - HTML da tabela
 */
function renderAuditLogs(auditLogs) {
    if (!auditLogs || auditLogs.length === 0) {
        return `
            <tr>
                <td colspan="4" class="no-data">Nenhum log encontrado</td>
            </tr>
        `;
    }
    
    return auditLogs.map(log => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.adminName || log.adminEmail || log.adminId}</td>
            <td>${formatAction(log.action)}</td>
            <td>${formatDetails(log.details)}</td>
        </tr>
    `).join('');
}

/**
 * Formata a data e hora para exibição
 * @param {string} timestamp - Timestamp ISO
 * @returns {string} - Data e hora formatada
 */
function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata a ação para exibição
 * @param {string} action - Ação
 * @returns {string} - Ação formatada
 */
function formatAction(action) {
    const actionMap = {
        'login': 'Login',
        'logout': 'Logout',
        'auto_logout': 'Logout Automático',
        'ban_user': 'Banir Usuário',
        'unban_user': 'Desbanir Usuário',
        'edit_user_points': 'Editar Pontos do Usuário',
        'edit_user_captures': 'Editar Capturas do Usuário',
        'add_location': 'Adicionar Localização',
        'update_location': 'Atualizar Localização',
        'remove_location': 'Remover Localização',
        'activate_location': 'Ativar Localização',
        'deactivate_location': 'Desativar Localização',
        'update_game_config': 'Atualizar Configurações do Jogo',
        'reset_game_config': 'Redefinir Configurações do Jogo',
        'export_game_config': 'Exportar Configurações do Jogo',
        'import_game_config': 'Importar Configurações do Jogo'
    };
    
    return actionMap[action] || action;
}

/**
 * Formata os detalhes para exibição
 * @param {Object} details - Detalhes
 * @returns {string} - Detalhes formatados
 */
function formatDetails(details) {
    if (!details) return 'N/A';
    
    // Se for um objeto com targetUserId, mostrar informação resumida
    if (details.targetUserId) {
        if (details.reason) {
            return `Usuário: ${details.targetUserId} - Motivo: ${details.reason}`;
        }
        return `Usuário: ${details.targetUserId}`;
    }
    
    // Se for um objeto com locationId, mostrar informação resumida
    if (details.locationId) {
        if (details.locationName) {
            return `Localização: ${details.locationName} (${details.locationId})`;
        }
        return `Localização: ${details.locationId}`;
    }
    
    // Se for um objeto com config, mostrar que as configurações foram alteradas
    if (details.config) {
        return 'Configurações do jogo atualizadas';
    }
    
    // Para outros casos, mostrar como JSON
    return JSON.stringify(details);
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde os logs são renderizados
 * @param {Object} auditManager - Instância do AuditManager
 * @param {Array} auditLogs - Lista de logs de auditoria
 * @param {Array} activeAdmins - Lista de administradores ativos
 */
function setupEventListeners(element, auditManager, auditLogs, activeAdmins) {
    // Aplicar filtros
    const applyButton = element.querySelector('#apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', async () => {
            try {
                // Coletar filtros
                const adminFilter = element.querySelector('#admin-filter').value;
                const actionFilter = element.querySelector('#action-filter').value;
                const dateFilter = element.querySelector('#date-filter').value;
                
                // Construir objeto de filtros
                const filters = {};
                
                if (adminFilter) {
                    filters.adminId = adminFilter;
                }
                
                if (actionFilter) {
                    filters.action = actionFilter;
                }
                
                // Definir datas baseado no filtro de período
                if (dateFilter !== 'all') {
                    const now = new Date();
                    let startDate;
                    
                    if (dateFilter === 'today') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    } else if (dateFilter === 'week') {
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    } else if (dateFilter === 'month') {
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    }
                    
                    if (startDate) {
                        filters.startDate = startDate;
                    }
                }
                
                // Mostrar indicador de carregamento
                const tableBody = element.querySelector('.logs-table tbody');
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="loading">Carregando logs filtrados...</td>
                        </tr>
                    `;
                }
                
                // Carregar logs filtrados
                const filteredLogs = await auditManager.getAuditLogs(filters, 100);
                
                // Atualizar tabela
                if (tableBody) {
                    tableBody.innerHTML = renderAuditLogs(filteredLogs);
                }
            } catch (error) {
                console.error('Erro ao aplicar filtros:', error);
                showNotification('Erro ao aplicar filtros: ' + error.message, 'error');
            }
        });
    }
    
    // Limpar filtros
    const clearButton = element.querySelector('#clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            // Resetar filtros
            element.querySelector('#admin-filter').value = '';
            element.querySelector('#action-filter').value = '';
            element.querySelector('#date-filter').value = 'all';
            
            // Re-renderizar tabela com todos os logs
            const tableBody = element.querySelector('.logs-table tbody');
            if (tableBody) {
                tableBody.innerHTML = renderAuditLogs(auditLogs);
            }
        });
    }
}

/**
 * Mostra uma notificação
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo da notificação (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adicionar ao documento
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}