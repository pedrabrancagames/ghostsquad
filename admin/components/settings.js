/**
 * Componente de Configurações
 * 
 * Componente responsável por exibir e gerenciar as configurações globais do jogo.
 */

/**
 * Inicializa o componente de configurações
 * @param {HTMLElement} element - Elemento DOM onde as configurações serão renderizadas
 * @param {Object} configManager - Instância do ConfigManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
export async function initSettings(element, configManager, adminAuth) {
    if (!element || !configManager || !adminAuth) {
        console.error('Elemento, ConfigManager ou AdminAuthManager não fornecidos para o componente de configurações');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="settings-container">
                <div class="loading">Carregando configurações...</div>
            </div>
        `;
        
        // Carregar configurações do jogo
        const gameConfig = await configManager.getGameConfig();
        
        // Renderizar interface
        renderSettings(element, gameConfig);
        
        // Configurar eventos
        setupEventListeners(element, configManager, adminAuth);
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        element.innerHTML = `
            <div class="settings-container">
                <div class="error">Erro ao carregar configurações: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de configurações
 * @param {HTMLElement} element - Elemento DOM onde as configurações serão renderizadas
 * @param {Object} gameConfig - Configurações do jogo
 */
function renderSettings(element, gameConfig) {
    element.innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <h2>Configurações do Jogo</h2>
                <p>Gerencie as configurações globais do Ghost Squad</p>
            </div>
            
            <div class="settings-content">
                <form id="game-config-form">
                    <div class="settings-section">
                        <h3>Pontuação de Fantasmas</h3>
                        <div class="form-group">
                            <label for="common-ghost-points">Pontos por Fantasma Comum:</label>
                            <input type="number" id="common-ghost-points" name="common-ghost-points" 
                                   value="${gameConfig.ghostPoints.common}" min="0">
                        </div>
                        <div class="form-group">
                            <label for="strong-ghost-points">Pontos por Fantasma Forte:</label>
                            <input type="number" id="strong-ghost-points" name="strong-ghost-points" 
                                   value="${gameConfig.ghostPoints.strong}" min="0">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Inventário</h3>
                        <div class="form-group">
                            <label for="inventory-limit">Limite de Itens no Inventário:</label>
                            <input type="number" id="inventory-limit" name="inventory-limit" 
                                   value="${gameConfig.inventoryLimit}" min="1">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Captura de Fantasmas</h3>
                        <div class="form-group">
                            <label for="capture-radius">Raio de Captura (metros):</label>
                            <input type="number" id="capture-radius" name="capture-radius" 
                                   value="${gameConfig.captureRadius}" min="1">
                        </div>
                        <div class="form-group">
                            <label for="common-capture-duration">Duração da Captura (Fantasma Comum - segundos):</label>
                            <input type="number" id="common-capture-duration" name="common-capture-duration" 
                                   value="${gameConfig.captureDuration.common / 1000}" min="1">
                        </div>
                        <div class="form-group">
                            <label for="strong-capture-duration">Duração da Captura (Fantasma Forte - segundos):</label>
                            <input type="number" id="strong-capture-duration" name="strong-capture-duration" 
                                   value="${gameConfig.captureDuration.strong / 1000}" min="1">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Desbloqueio do ECTO-1</h3>
                        <div class="form-group">
                            <label for="ecto1-unlock-count">Número de Capturas para Desbloquear ECTO-1:</label>
                            <input type="number" id="ecto1-unlock-count" name="ecto1-unlock-count" 
                                   value="${gameConfig.ecto1UnlockCount}" min="1">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Manutenção</h3>
                        <div class="form-group">
                            <button type="button" id="update-rankings" class="btn-secondary">Atualizar Rankings</button>
                            <p class="help-text">Atualiza os rankings com base nos dados atuais dos usuários</p>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button type="submit" class="btn-primary">Salvar Configurações</button>
                        <button type="button" id="reset-config" class="btn-secondary">Redefinir para Padrão</button>
                        <button type="button" id="export-config" class="btn-secondary">Exportar Configurações</button>
                        <button type="button" id="import-config" class="btn-secondary">Importar Configurações</button>
                    </div>
                </form>
                
                <div class="settings-info">
                    <h3>Informações Importantes</h3>
                    <ul>
                        <li>As alterações nas configurações entram em vigor imediatamente para todos os jogadores.</li>
                        <li>Tenha cuidado ao ajustar os parâmetros do jogo para manter o equilíbrio.</li>
                        <li>É recomendável testar as configurações em um ambiente de desenvolvimento antes de aplicar em produção.</li>
                        <li>Utilize a função "Atualizar Rankings" regularmente para manter os rankings sincronizados.</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde as configurações são renderizadas
 * @param {Object} configManager - Instância do ConfigManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
function setupEventListeners(element, configManager, adminAuth) {
    // Salvar configurações
    const form = element.querySelector('#game-config-form');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            try {
                // Coletar dados do formulário
                const config = {
                    ghostPoints: {
                        common: parseInt(form['common-ghost-points'].value),
                        strong: parseInt(form['strong-ghost-points'].value)
                    },
                    inventoryLimit: parseInt(form['inventory-limit'].value),
                    captureRadius: parseInt(form['capture-radius'].value),
                    captureDuration: {
                        common: parseInt(form['common-capture-duration'].value) * 1000,
                        strong: parseInt(form['strong-capture-duration'].value) * 1000
                    },
                    ecto1UnlockCount: parseInt(form['ecto1-unlock-count'].value)
                };
                
                // Atualizar configurações
                await configManager.updateGameConfig(config);
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'update_game_config', 
                        { config }
                    );
                }
                
                // Mostrar mensagem de sucesso
                showNotification('Configurações salvas com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao salvar configurações:', error);
                showNotification('Erro ao salvar configurações: ' + error.message, 'error');
            }
        });
    }
    
    // Redefinir para padrão
    const resetButton = element.querySelector('#reset-config');
    if (resetButton) {
        resetButton.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja redefinir todas as configurações para os valores padrão?')) {
                try {
                    const defaultConfig = configManager.getDefaultConfig();
                    await configManager.updateGameConfig(defaultConfig);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'reset_game_config', 
                            { config: defaultConfig }
                        );
                    }
                    
                    // Atualizar interface
                    const gameConfig = await configManager.getGameConfig();
                    renderSettings(element, gameConfig);
                    
                    showNotification('Configurações redefinidas para padrão!', 'success');
                } catch (error) {
                    console.error('Erro ao redefinir configurações:', error);
                    showNotification('Erro ao redefinir configurações: ' + error.message, 'error');
                }
            }
        });
    }
    
    // Exportar configurações
    const exportButton = element.querySelector('#export-config');
    if (exportButton) {
        exportButton.addEventListener('click', async () => {
            try {
                const configData = await configManager.exportConfig('json');
                downloadFile(configData, 'configuracoes-ghost-squad.json', 'application/json');
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'export_game_config', 
                        {}
                    );
                }
                
                showNotification('Configurações exportadas com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao exportar configurações:', error);
                showNotification('Erro ao exportar configurações: ' + error.message, 'error');
            }
        });
    }
    
    // Importar configurações
    const importButton = element.querySelector('#import-config');
    if (importButton) {
        importButton.addEventListener('click', () => {
            // Criar input file oculto
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            
            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                try {
                    // Ler conteúdo do arquivo
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const configData = e.target.result;
                        
                        // Confirmar importação
                        if (confirm('Tem certeza que deseja importar estas configurações? Isso substituirá as configurações atuais.')) {
                            await configManager.importConfig(configData, 'json');
                            
                            // Registrar ação no log de auditoria
                            const currentAdmin = adminAuth.getCurrentAdmin();
                            if (currentAdmin) {
                                await adminAuth.logAdminAction(
                                    currentAdmin.uid, 
                                    'import_game_config', 
                                    { fileName: file.name }
                                );
                            }
                            
                            // Atualizar interface
                            const gameConfig = await configManager.getGameConfig();
                            renderSettings(element, gameConfig);
                            
                            showNotification('Configurações importadas com sucesso!', 'success');
                        }
                    };
                    reader.readAsText(file);
                } catch (error) {
                    console.error('Erro ao importar configurações:', error);
                    showNotification('Erro ao importar configurações: ' + error.message, 'error');
                }
            });
            
            fileInput.click();
        });
    }
    
    // Atualizar rankings
    const updateRankingsButton = element.querySelector('#update-rankings');
    if (updateRankingsButton) {
        updateRankingsButton.addEventListener('click', async () => {
            try {
                // Mostrar indicador de carregamento
                updateRankingsButton.disabled = true;
                updateRankingsButton.textContent = 'Atualizando...';
                
                // Atualizar rankings
                await configManager.updateRankings();
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'update_rankings', 
                        {}
                    );
                }
                
                // Mostrar mensagem de sucesso
                showNotification('Rankings atualizados com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao atualizar rankings:', error);
                showNotification('Erro ao atualizar rankings: ' + error.message, 'error');
            } finally {
                // Restaurar botão
                updateRankingsButton.disabled = false;
                updateRankingsButton.textContent = 'Atualizar Rankings';
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

/**
 * Faz download de um arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} contentType - Tipo de conteúdo
 */
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Limpar
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}