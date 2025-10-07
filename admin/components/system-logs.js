/**
 * Componente de Logs do Sistema
 * 
 * Componente responsável por exibir os logs de erro e sistema.
 */

/**
 * Inicializa o componente de logs do sistema
 * @param {HTMLElement} element - Elemento DOM onde os logs do sistema serão renderizados
 * @param {Object} auditManager - Instância do AuditManager
 */
export async function initSystemLogs(element, auditManager) {
    if (!element || !auditManager) {
        console.error('Elemento ou AuditManager não fornecidos para o componente de logs do sistema');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="system-logs-container">
                <div class="loading">Carregando logs do sistema...</div>
            </div>
        `;
        
        // Carregar logs do sistema
        const systemLogs = await auditManager.getSystemLogs(50);
        
        // Renderizar interface
        renderSystemLogs(element, systemLogs);
        
        // Configurar eventos
        setupEventListeners(element, auditManager, systemLogs);
    } catch (error) {
        console.error('Erro ao carregar logs do sistema:', error);
        element.innerHTML = `
            <div class="system-logs-container">
                <div class="error">Erro ao carregar logs do sistema: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de logs do sistema
 * @param {HTMLElement} element - Elemento DOM onde os logs do sistema serão renderizados
 * @param {Array} systemLogs - Lista de logs do sistema
 */
function renderSystemLogs(element, systemLogs) {
    element.innerHTML = `
        <div class="system-logs-container">
            <div class="system-logs-header">
                <h2>Logs do Sistema</h2>
                <p>Visualize erros e problemas técnicos reportados pelo sistema</p>
            </div>
            
            <div class="system-logs-content">
                <div class="system-logs-section">
                    <h3>Filtros</h3>
                    <div class="system-logs-filters">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="log-type-filter">Tipo:</label>
                                <select id="log-type-filter">
                                    <option value="">Todos</option>
                                    <option value="error">Erros</option>
                                    <option value="warning">Avisos</option>
                                    <option value="info">Informações</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="date-range-filter">Período:</label>
                                <select id="date-range-filter">
                                    <option value="all">Todo o período</option>
                                    <option value="today">Hoje</option>
                                    <option value="week">Últimos 7 dias</option>
                                    <option value="month">Últimos 30 dias</option>
                                </select>
                            </div>
                            <div class="filter-actions">
                                <button id="apply-system-filters" class="btn-primary">Aplicar Filtros</button>
                                <button id="clear-system-filters" class="btn-secondary">Limpar</button>
                                <button id="refresh-system-logs" class="btn-secondary">Atualizar</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="system-logs-section">
                    <h3>Logs Recentes</h3>
                    <div class="system-logs-table-container">
                        <table class="system-logs-table">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Tipo</th>
                                    <th>Mensagem</th>
                                    <th>Contexto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderSystemLogsTable(systemLogs)}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="system-logs-section">
                    <h3>Monitoramento em Tempo Real</h3>
                    <div class="real-time-monitoring">
                        <label>
                            <input type="checkbox" id="real-time-toggle"> 
                            Ativar monitoramento em tempo real
                        </label>
                        <p class="monitoring-info">
                            Quando ativado, novos logs serão exibidos automaticamente conforme forem gerados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a tabela de logs do sistema
 * @param {Array} systemLogs - Lista de logs do sistema
 * @returns {string} - HTML da tabela
 */
function renderSystemLogsTable(systemLogs) {
    if (!systemLogs || systemLogs.length === 0) {
        return `
            <tr>
                <td colspan="4" class="no-data">Nenhum log do sistema encontrado</td>
            </tr>
        `;
    }
    
    return systemLogs.map(log => `
        <tr class="log-${log.type || 'info'}">
            <td>${formatDateTime(log.timestamp)}</td>
            <td>
                <span class="log-type ${log.type || 'info'}">
                    ${formatLogType(log.type)}
                </span>
            </td>
            <td>${log.message || 'N/A'}</td>
            <td>${formatContext(log.context)}</td>
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
 * Formata o tipo de log para exibição
 * @param {string} type - Tipo de log
 * @returns {string} - Tipo formatado
 */
function formatLogType(type) {
    const typeMap = {
        'error': 'Erro',
        'warning': 'Aviso',
        'info': 'Informação'
    };
    
    return typeMap[type] || type || 'Informação';
}

/**
 * Formata o contexto para exibição
 * @param {Object} context - Contexto
 * @returns {string} - Contexto formatado
 */
function formatContext(context) {
    if (!context) return 'N/A';
    
    // Se for um objeto, mostrar como JSON
    if (typeof context === 'object') {
        return JSON.stringify(context, null, 2);
    }
    
    return context;
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde os logs do sistema são renderizados
 * @param {Object} auditManager - Instância do AuditManager
 * @param {Array} systemLogs - Lista de logs do sistema
 */
function setupEventListeners(element, auditManager, systemLogs) {
    // Aplicar filtros
    const applyButton = element.querySelector('#apply-system-filters');
    if (applyButton) {
        applyButton.addEventListener('click', async () => {
            try {
                // Coletar filtros
                const typeFilter = element.querySelector('#log-type-filter').value;
                const dateRangeFilter = element.querySelector('#date-range-filter').value;
                
                // Mostrar indicador de carregamento
                const tableBody = element.querySelector('.system-logs-table tbody');
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="loading">Carregando logs filtrados...</td>
                        </tr>
                    `;
                }
                
                // Carregar logs filtrados (simulação - em uma implementação real, isso viria do backend)
                let filteredLogs = systemLogs;
                
                // Aplicar filtro de tipo
                if (typeFilter) {
                    filteredLogs = filteredLogs.filter(log => log.type === typeFilter);
                }
                
                // Aplicar filtro de período
                if (dateRangeFilter !== 'all') {
                    const now = new Date();
                    let cutoffDate;
                    
                    if (dateRangeFilter === 'today') {
                        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    } else if (dateRangeFilter === 'week') {
                        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    } else if (dateRangeFilter === 'month') {
                        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    }
                    
                    if (cutoffDate) {
                        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= cutoffDate);
                    }
                }
                
                // Atualizar tabela
                if (tableBody) {
                    tableBody.innerHTML = renderSystemLogsTable(filteredLogs);
                }
            } catch (error) {
                console.error('Erro ao aplicar filtros:', error);
                showNotification('Erro ao aplicar filtros: ' + error.message, 'error');
            }
        });
    }
    
    // Limpar filtros
    const clearButton = element.querySelector('#clear-system-filters');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            // Resetar filtros
            element.querySelector('#log-type-filter').value = '';
            element.querySelector('#date-range-filter').value = 'all';
            
            // Re-renderizar tabela com todos os logs
            const tableBody = element.querySelector('.system-logs-table tbody');
            if (tableBody) {
                tableBody.innerHTML = renderSystemLogsTable(systemLogs);
            }
        });
    }
    
    // Atualizar logs
    const refreshButton = element.querySelector('#refresh-system-logs');
    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            try {
                // Mostrar indicador de carregamento
                const tableBody = element.querySelector('.system-logs-table tbody');
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="loading">Atualizando logs...</td>
                        </tr>
                    `;
                }
                
                // Carregar logs atualizados
                const updatedLogs = await auditManager.getSystemLogs(50);
                
                // Atualizar tabela
                if (tableBody) {
                    tableBody.innerHTML = renderSystemLogsTable(updatedLogs);
                }
                
                showNotification('Logs atualizados com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao atualizar logs:', error);
                showNotification('Erro ao atualizar logs: ' + error.message, 'error');
            }
        });
    }
    
    // Toggle de monitoramento em tempo real
    const realTimeToggle = element.querySelector('#real-time-toggle');
    if (realTimeToggle) {
        realTimeToggle.addEventListener('change', (event) => {
            if (event.target.checked) {
                showNotification('Monitoramento em tempo real ativado', 'info');
                // Em uma implementação real, aqui você configuraria um listener para novos logs
            } else {
                showNotification('Monitoramento em tempo real desativado', 'info');
                // Em uma implementação real, aqui você removeria o listener
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