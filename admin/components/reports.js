/**
 * Componente de Relatórios
 * 
 * Componente responsável por exibir relatórios personalizados
 * com filtros por período e outras métricas.
 */

/**
 * Inicializa o componente de relatórios
 * @param {HTMLElement} element - Elemento DOM onde os relatórios serão renderizados
 * @param {Object} statsManager - Instância do StatsManager
 */
export function initReports(element, statsManager) {
    if (!element || !statsManager) {
        console.error('Elemento ou StatsManager não fornecidos para o componente de relatórios');
        return;
    }
    
    // Estado do componente
    const state = {
        filters: {
            startDate: null,
            endDate: null,
            minLevel: null
        },
        reportData: null,
        loading: false
    };
    
    // Renderizar interface inicial
    renderReports(element, state);
    
    // Configurar eventos
    setupEventListeners(element, statsManager, state);
}

/**
 * Renderiza a interface de relatórios
 * @param {HTMLElement} element - Elemento DOM onde os relatórios serão renderizados
 * @param {Object} state - Estado atual do componente
 */
function renderReports(element, state) {
    element.innerHTML = `
        <div class="reports-container">
            <div class="reports-header">
                <h2>Relatórios e Estatísticas</h2>
                <p>Visualize dados detalhados sobre o desempenho do jogo e dos jogadores</p>
            </div>
            
            <div class="reports-filters">
                <h3>Filtros</h3>
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="start-date">Data Inicial:</label>
                        <input type="date" id="start-date" value="${state.filters.startDate || ''}">
                    </div>
                    <div class="filter-group">
                        <label for="end-date">Data Final:</label>
                        <input type="date" id="end-date" value="${state.filters.endDate || ''}">
                    </div>
                    <div class="filter-group">
                        <label for="min-level">Nível Mínimo:</label>
                        <input type="number" id="min-level" min="1" value="${state.filters.minLevel || ''}" placeholder="1">
                    </div>
                    <div class="filter-actions">
                        <button id="apply-filters" class="btn-primary">Aplicar Filtros</button>
                        <button id="clear-filters" class="btn-secondary">Limpar</button>
                    </div>
                </div>
            </div>
            
            ${state.loading ? `
                <div class="reports-loading">
                    <p>Gerando relatório...</p>
                </div>
            ` : state.reportData ? `
                <div class="reports-content">
                    ${renderReportSummary(state.reportData)}
                    ${renderTopPlayers(state.reportData.topPlayers)}
                    ${renderLocationStats(state.reportData.locationStats)}
                </div>
            ` : `
                <div class="reports-placeholder">
                    <p>Selecione os filtros desejados e clique em "Aplicar Filtros" para gerar um relatório.</p>
                    <button id="generate-default-report" class="btn-primary">Gerar Relatório Padrão</button>
                </div>
            `}
        </div>
    `;
}

/**
 * Renderiza o resumo do relatório
 * @param {Object} reportData - Dados do relatório
 * @returns {string} - HTML do resumo
 */
function renderReportSummary(reportData) {
    return `
        <div class="report-summary">
            <h3>Resumo do Período</h3>
            <div class="summary-cards">
                <div class="summary-card">
                    <h4>Total de Usuários</h4>
                    <p class="summary-value">${reportData.totalUsers}</p>
                </div>
                <div class="summary-card">
                    <h4>Usuários Ativos</h4>
                    <p class="summary-value">${reportData.activeUsers}</p>
                </div>
                <div class="summary-card">
                    <h4>Fantasmas Capturados</h4>
                    <p class="summary-value">${reportData.ghostsCaptured}</p>
                </div>
                <div class="summary-card">
                    <h4>ECTO-1s Desbloqueados</h4>
                    <p class="summary-value">${reportData.ecto1Unlocked}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a lista de top jogadores
 * @param {Array} topPlayers - Lista de top jogadores
 * @returns {string} - HTML da lista
 */
function renderTopPlayers(topPlayers) {
    if (!topPlayers || topPlayers.length === 0) {
        return '';
    }
    
    return `
        <div class="top-players">
            <h3>Top 10 Jogadores</h3>
            <table class="players-table">
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Nome</th>
                        <th>Pontos</th>
                        <th>Capturas</th>
                        <th>Nível</th>
                        <th>Total Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${topPlayers.slice(0, 10).map((player, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${player.displayName || 'N/A'}</td>
                            <td>${player.points || 0}</td>
                            <td>${player.captures || 0}</td>
                            <td>${player.level || 1}</td>
                            <td>${player.totalScore || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renderiza as estatísticas por localização
 * @param {Array} locationStats - Estatísticas por localização
 * @returns {string} - HTML das estatísticas
 */
function renderLocationStats(locationStats) {
    if (!locationStats || locationStats.length === 0) {
        return '';
    }
    
    return `
        <div class="location-stats">
            <h3>Estatísticas por Localização</h3>
            <table class="locations-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Capturas</th>
                        <th>Popularidade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${locationStats.map(location => `
                        <tr>
                            <td>${location.name}</td>
                            <td>${location.captures}</td>
                            <td>${location.popularity.toFixed(1)}%</td>
                            <td>
                                <span class="status-badge ${location.active ? 'active' : 'inactive'}">
                                    ${location.active ? 'Ativa' : 'Inativa'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde os relatórios são renderizados
 * @param {Object} statsManager - Instância do StatsManager
 * @param {Object} state - Estado atual do componente
 */
function setupEventListeners(element, statsManager, state) {
    // Aplicar filtros
    const applyButton = element.querySelector('#apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', async () => {
            // Atualizar estado com os filtros
            const startDateInput = element.querySelector('#start-date');
            const endDateInput = element.querySelector('#end-date');
            const minLevelInput = element.querySelector('#min-level');
            
            state.filters.startDate = startDateInput.value ? startDateInput.value : null;
            state.filters.endDate = endDateInput.value ? endDateInput.value : null;
            state.filters.minLevel = minLevelInput.value ? parseInt(minLevelInput.value) : null;
            
            // Gerar relatório
            await generateReport(element, statsManager, state);
        });
    }
    
    // Limpar filtros
    const clearButton = element.querySelector('#clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            // Limpar campos de filtro
            const startDateInput = element.querySelector('#start-date');
            const endDateInput = element.querySelector('#end-date');
            const minLevelInput = element.querySelector('#min-level');
            
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            if (minLevelInput) minLevelInput.value = '';
            
            // Resetar estado
            state.filters = {
                startDate: null,
                endDate: null,
                minLevel: null
            };
            state.reportData = null;
            
            // Re-renderizar
            renderReports(element, state);
        });
    }
    
    // Gerar relatório padrão
    const defaultReportButton = element.querySelector('#generate-default-report');
    if (defaultReportButton) {
        defaultReportButton.addEventListener('click', async () => {
            await generateReport(element, statsManager, state);
        });
    }
}

/**
 * Gera um relatório com base nos filtros atuais
 * @param {HTMLElement} element - Elemento DOM onde os relatórios são renderizados
 * @param {Object} statsManager - Instância do StatsManager
 * @param {Object} state - Estado atual do componente
 */
async function generateReport(element, statsManager, state) {
    try {
        // Mostrar estado de carregamento
        state.loading = true;
        renderReports(element, state);
        
        // Gerar relatório
        const reportData = await statsManager.generateReport(state.filters);
        state.reportData = reportData;
        state.loading = false;
        
        // Re-renderizar
        renderReports(element, state);
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        state.loading = false;
        state.reportData = null;
        
        // Mostrar mensagem de erro
        const content = element.querySelector('.reports-content') || element.querySelector('.reports-placeholder');
        if (content) {
            content.innerHTML = `
                <div class="error-message">
                    <p>Erro ao gerar relatório: ${error.message}</p>
                    <button id="retry-report" class="btn-primary">Tentar Novamente</button>
                </div>
            `;
            
            // Configurar retry
            const retryButton = element.querySelector('#retry-report');
            if (retryButton) {
                retryButton.addEventListener('click', async () => {
                    await generateReport(element, statsManager, state);
                });
            }
        }
    }
}