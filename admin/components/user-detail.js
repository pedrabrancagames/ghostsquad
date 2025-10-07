/**
 * Componente de Detalhes do Usuário
 * 
 * Componente responsável por exibir informações detalhadas de um usuário
 * e permitir a edição de seus dados.
 */

/**
 * Inicializa o componente de detalhes do usuário
 * @param {HTMLElement} element - Elemento DOM onde os detalhes serão renderizados
 * @param {Object} userManager - Instância do UserManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 * @param {string} userId - ID do usuário a ser exibido
 */
export async function initUserDetail(element, userManager, adminAuth, userId) {
    if (!element || !userManager || !adminAuth || !userId) {
        console.error('Elemento, UserManager, AdminAuthManager ou userId não fornecidos para o componente de detalhes do usuário');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="user-detail-container">
                <div class="loading">Carregando detalhes do usuário...</div>
            </div>
        `;
        
        // Carregar dados do usuário
        const user = await userManager.getUserById(userId);
        if (!user) {
            element.innerHTML = `
                <div class="user-detail-container">
                    <div class="error">Usuário não encontrado</div>
                </div>
            `;
            return;
        }
        
        // Carregar estatísticas do usuário
        const stats = await userManager.getUserStats(userId);
        
        // Renderizar interface
        renderUserDetail(element, user, stats, adminAuth);
        
        // Configurar eventos
        setupEventListeners(element, userManager, adminAuth, user);
    } catch (error) {
        console.error('Erro ao carregar detalhes do usuário:', error);
        element.innerHTML = `
            <div class="user-detail-container">
                <div class="error">Erro ao carregar detalhes do usuário: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de detalhes do usuário
 * @param {HTMLElement} element - Elemento DOM onde os detalhes serão renderizados
 * @param {Object} user - Dados do usuário
 * @param {Object} stats - Estatísticas do usuário
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
function renderUserDetail(element, user, stats, adminAuth) {
    element.innerHTML = `
        <div class="user-detail-container">
            <div class="user-detail-header">
                <h2>Detalhes do Usuário</h2>
                <div class="user-detail-actions">
                    <button id="back-to-users" class="btn-secondary">Voltar para Lista</button>
                    ${user.status === 'banned' ? 
                        `<button id="unban-user" class="btn-primary">Desbanir Usuário</button>` : 
                        `<button id="ban-user" class="btn-warning">Banir Usuário</button>`}
                    <button id="delete-user" class="btn-danger">Excluir Usuário</button>
                </div>
            </div>
            
            <div class="user-detail-content">
                <div class="user-info-card">
                    <h3>Informações Básicas</h3>
                    <div class="user-info-grid">
                        <div class="info-item">
                            <label>ID:</label>
                            <span>${user.uid}</span>
                        </div>
                        <div class="info-item">
                            <label>Nome:</label>
                            <span>${user.displayName || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${user.email || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge ${user.status || 'active'}">
                                ${user.status === 'banned' ? 'Banido' : 'Ativo'}
                                ${user.status === 'banned' && user.banReason ? ` - ${user.banReason}` : ''}
                            </span>
                        </div>
                        <div class="info-item">
                            <label>Data de Registro:</label>
                            <span>${formatDate(user.createdAt)}</span>
                        </div>
                        <div class="info-item">
                            <label>Última Atividade:</label>
                            <span>${formatDate(user.lastActive) || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="user-stats-card">
                    <h3>Estatísticas do Jogador</h3>
                    <div class="user-stats-grid">
                        <div class="stat-item">
                            <label>Pontos:</label>
                            <span class="stat-value">${user.points || 0}</span>
                        </div>
                        <div class="stat-item">
                            <label>Capturas:</label>
                            <span class="stat-value">${user.captures || 0}</span>
                        </div>
                        <div class="stat-item">
                            <label>Nível:</label>
                            <span class="stat-value">${user.level || 1}</span>
                        </div>
                        <div class="stat-item">
                            <label>ECTO-1 Desbloqueado:</label>
                            <span class="stat-value">${user.ecto1Unlocked ? 'Sim' : 'Não'}</span>
                        </div>
                        <div class="stat-item">
                            <label>Idade da Conta:</label>
                            <span class="stat-value">${stats.accountAge || 0} dias</span>
                        </div>
                        <div class="stat-item">
                            <label>Dias Ativo:</label>
                            <span class="stat-value">${stats.daysActive || 0} dias</span>
                        </div>
                    </div>
                    
                    <div class="user-stats-actions">
                        <button id="edit-points" class="btn-secondary">Editar Pontos</button>
                        <button id="edit-captures" class="btn-secondary">Editar Capturas</button>
                    </div>
                </div>
                
                <div class="user-inventory-card">
                    <h3>Inventário</h3>
                    <div class="inventory-content">
                        ${renderInventory(user.inventory)}
                    </div>
                </div>
                
                <div class="user-activity-card">
                    <h3>Atividade Recente</h3>
                    <div class="activity-content">
                        ${renderActivityFeed(user)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Formata uma data para exibição
 * @param {string} dateString - String da data
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Renderiza o inventário do usuário
 * @param {Array} inventory - Itens do inventário
 * @returns {string} - HTML do inventário
 */
function renderInventory(inventory) {
    if (!inventory || inventory.length === 0) {
        return '<p class="no-inventory">Inventário vazio</p>';
    }
    
    return `
        <ul class="inventory-list">
            ${inventory.map(item => `
                <li class="inventory-item">
                    <span class="item-name">${item.name || item.type || 'Item desconhecido'}</span>
                    <span class="item-quantity">Quantidade: ${item.quantity || 1}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Renderiza o feed de atividade do usuário
 * @param {Object} user - Dados do usuário
 * @returns {string} - HTML do feed de atividade
 */
function renderActivityFeed(user) {
    // Esta é uma implementação simplificada
    // Em uma implementação real, você teria dados de atividades reais
    
    const activities = [
        { action: 'capturou um fantasma', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        { action: 'atingiu o nível 3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        { action: 'desbloqueou o ECTO-1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        { action: 'capturou 5 fantasmas em um dia', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) }
    ];
    
    return `
        <ul class="activity-list">
            ${activities.map(activity => `
                <li class="activity-item">
                    <span class="activity-action">${activity.action}</span>
                    <span class="activity-time">${formatRelativeTime(activity.timestamp)}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Formata o tempo relativo
 * @param {Date} date - Data
 * @returns {string} - Tempo relativo formatado
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins} minutos atrás`;
    if (diffHours < 24) return `${diffHours} horas atrás`;
    return `${diffDays} dias atrás`;
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde os detalhes são renderizados
 * @param {Object} userManager - Instância do UserManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 * @param {Object} user - Dados do usuário
 */
function setupEventListeners(element, userManager, adminAuth, user) {
    // Voltar para lista de usuários
    const backButton = element.querySelector('#back-to-users');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.hash = '#users';
        });
    }
    
    // Banir usuário
    const banButton = element.querySelector('#ban-user');
    if (banButton) {
        banButton.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja banir este usuário?')) {
                try {
                    const reason = prompt('Motivo do banimento (opcional):') || '';
                    await userManager.banUser(user.uid, reason);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'ban_user', 
                            { 
                                targetUserId: user.uid, 
                                reason: reason 
                            }
                        );
                    }
                    
                    // Atualizar interface
                    alert('Usuário banido com sucesso!');
                    window.location.hash = '#users';
                } catch (error) {
                    console.error('Erro ao banir usuário:', error);
                    alert('Erro ao banir usuário: ' + error.message);
                }
            }
        });
    }
    
    // Desbanir usuário
    const unbanButton = element.querySelector('#unban-user');
    if (unbanButton) {
        unbanButton.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja desbanir este usuário?')) {
                try {
                    await userManager.unbanUser(user.uid);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'unban_user', 
                            { targetUserId: user.uid }
                        );
                    }
                    
                    // Atualizar interface
                    alert('Usuário desbanido com sucesso!');
                    window.location.hash = '#users';
                } catch (error) {
                    console.error('Erro ao desbanir usuário:', error);
                    alert('Erro ao desbanir usuário: ' + error.message);
                }
            }
        });
    }
    
    // Excluir usuário
    const deleteButton = element.querySelector('#delete-user');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este usuário? Esta ação não pode ser desfeita!')) {
                try {
                    await userManager.deleteUser(user.uid);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'delete_user', 
                            { targetUserId: user.uid }
                        );
                    }
                    
                    // Atualizar interface
                    alert('Usuário excluído com sucesso!');
                    window.location.hash = '#users';
                } catch (error) {
                    console.error('Erro ao excluir usuário:', error);
                    alert('Erro ao excluir usuário: ' + error.message);
                }
            }
        });
    }
    
    // Editar pontos
    const editPointsButton = element.querySelector('#edit-points');
    if (editPointsButton) {
        editPointsButton.addEventListener('click', async () => {
            const newPoints = prompt('Novos pontos:', user.points || 0);
            if (newPoints === null) return; // Cancelado
            
            const pointsNum = parseInt(newPoints);
            if (isNaN(pointsNum)) {
                alert('Valor inválido');
                return;
            }
            
            try {
                await userManager.updateUserPoints(user.uid, pointsNum);
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'edit_user_points', 
                        { 
                            targetUserId: user.uid, 
                            oldPoints: user.points || 0,
                            newPoints: pointsNum
                        }
                    );
                }
                
                // Atualizar interface
                const pointsElement = element.querySelector('.stat-item:nth-child(1) .stat-value');
                if (pointsElement) {
                    pointsElement.textContent = pointsNum;
                }
                
                alert('Pontos atualizados com sucesso!');
            } catch (error) {
                console.error('Erro ao atualizar pontos:', error);
                alert('Erro ao atualizar pontos: ' + error.message);
            }
        });
    }
    
    // Editar capturas
    const editCapturesButton = element.querySelector('#edit-captures');
    if (editCapturesButton) {
        editCapturesButton.addEventListener('click', async () => {
            const newCaptures = prompt('Novas capturas:', user.captures || 0);
            if (newCaptures === null) return; // Cancelado
            
            const capturesNum = parseInt(newCaptures);
            if (isNaN(capturesNum)) {
                alert('Valor inválido');
                return;
            }
            
            try {
                await userManager.updateUserCaptures(user.uid, capturesNum);
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'edit_user_captures', 
                        { 
                            targetUserId: user.uid, 
                            oldCaptures: user.captures || 0,
                            newCaptures: capturesNum
                        }
                    );
                }
                
                // Atualizar interface
                const capturesElement = element.querySelector('.stat-item:nth-child(2) .stat-value');
                if (capturesElement) {
                    capturesElement.textContent = capturesNum;
                }
                
                alert('Capturas atualizadas com sucesso!');
            } catch (error) {
                console.error('Erro ao atualizar capturas:', error);
                alert('Erro ao atualizar capturas: ' + error.message);
            }
        });
    }
}