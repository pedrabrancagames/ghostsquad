/**
 * Componente de Lista de Usuários
 * 
 * Componente responsável por exibir a lista paginada de usuários
 * com funcionalidades de busca e filtros.
 */

/**
 * Inicializa o componente de lista de usuários
 * @param {HTMLElement} element - Elemento DOM onde a lista será renderizada
 * @param {Object} userManager - Instância do UserManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
export function initUserList(element, userManager, adminAuth) {
    if (!element || !userManager || !adminAuth) {
        console.error('Elemento, UserManager ou AdminAuthManager não fornecidos para o componente de lista de usuários');
        return;
    }
    
    // Estado do componente
    const state = {
        currentPage: 1,
        usersPerPage: 20,
        searchTerm: '',
        searchField: 'displayName',
        users: [],
        totalUsers: 0,
        totalPages: 0
    };
    
    // Renderizar interface inicial
    renderUserList(element, state);
    
    // Carregar dados iniciais
    loadUsers(element, userManager, state);
    
    // Configurar eventos
    setupEventListeners(element, userManager, adminAuth, state);
}

/**
 * Renderiza a interface da lista de usuários
 * @param {HTMLElement} element - Elemento DOM onde a lista será renderizada
 * @param {Object} state - Estado atual do componente
 */
function renderUserList(element, state) {
    element.innerHTML = `
        <div class="users-header">
            <h2>Gerenciamento de Usuários</h2>
            <div class="users-controls">
                <div class="search-container">
                    <input type="text" id="user-search" placeholder="Buscar usuários..." value="${state.searchTerm}">
                    <select id="search-field">
                        <option value="displayName" ${state.searchField === 'displayName' ? 'selected' : ''}>Nome</option>
                        <option value="email" ${state.searchField === 'email' ? 'selected' : ''}>Email</option>
                        <option value="uid" ${state.searchField === 'uid' ? 'selected' : ''}>ID do Usuário</option>
                    </select>
                    <button id="search-button" class="btn-primary">Buscar</button>
                    <button id="clear-search" class="btn-secondary">Limpar</button>
                </div>
                <div class="pagination-controls">
                    <button id="prev-page" class="btn-secondary" ${state.currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
                    <span>Página ${state.currentPage} de ${state.totalPages || 1}</span>
                    <button id="next-page" class="btn-secondary" ${state.currentPage >= state.totalPages ? 'disabled' : ''}>Próxima</button>
                </div>
            </div>
        </div>
        
        <div class="users-table-container">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Pontos</th>
                        <th>Capturas</th>
                        <th>Nível</th>
                        <th>Status</th>
                        <th>Data de Registro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    ${renderUsersTable(state.users)}
                </tbody>
            </table>
        </div>
        
        <div class="users-footer">
            <div class="users-summary">
                Total de usuários: ${state.totalUsers}
            </div>
            <div class="export-controls">
                <button id="export-json" class="btn-secondary">Exportar JSON</button>
                <button id="export-csv" class="btn-secondary">Exportar CSV</button>
            </div>
        </div>
    `;
}

/**
 * Renderiza a tabela de usuários
 * @param {Array} users - Lista de usuários
 * @returns {string} - HTML da tabela
 */
function renderUsersTable(users) {
    if (!users || users.length === 0) {
        return `
            <tr>
                <td colspan="8" class="no-users">Nenhum usuário encontrado</td>
            </tr>
        `;
    }
    
    return users.map(user => `
        <tr data-user-id="${user.uid}">
            <td>${user.displayName || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.points || 0}</td>
            <td>${user.captures || 0}</td>
            <td>${user.level || 1}</td>
            <td>
                <span class="status-badge ${user.status || 'active'}">
                    ${user.status === 'banned' ? 'Banido' : 'Ativo'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn-icon view-user" title="Visualizar">
                    👁️
                </button>
                <button class="btn-icon edit-user" title="Editar">
                    ✏️
                </button>
                ${user.status === 'banned' ? 
                    `<button class="btn-icon unban-user" title="Desbanir">✅</button>` : 
                    `<button class="btn-icon ban-user" title="Banir">🚫</button>`}
                <button class="btn-icon delete-user" title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Formata uma data para exibição
 * @param {string} dateString - String da data
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Carrega os usuários
 * @param {HTMLElement} element - Elemento DOM onde a lista será renderizada
 * @param {Object} userManager - Instância do UserManager
 * @param {Object} state - Estado atual do componente
 */
async function loadUsers(element, userManager, state) {
    try {
        // Mostrar indicador de carregamento
        const tableBody = element.querySelector('#users-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">Carregando usuários...</td>
                </tr>
            `;
        }
        
        // Verificar se é uma busca
        let result;
        if (state.searchTerm) {
            const users = await userManager.searchUsers(state.searchTerm, state.searchField);
            result = {
                users: users.slice((state.currentPage - 1) * state.usersPerPage, state.currentPage * state.usersPerPage),
                total: users.length,
                page: state.currentPage,
                pages: Math.ceil(users.length / state.usersPerPage)
            };
        } else {
            result = await userManager.getAllUsers(state.currentPage, state.usersPerPage);
        }
        
        // Atualizar estado
        state.users = result.users;
        state.totalUsers = result.total;
        state.totalPages = result.pages;
        
        // Re-renderizar
        renderUserList(element, state);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        
        // Mostrar mensagem de erro
        const tableBody = element.querySelector('#users-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="error">Erro ao carregar usuários: ${error.message}</td>
                </tr>
            `;
        }
    }
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde a lista será renderizada
 * @param {Object} userManager - Instância do UserManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 * @param {Object} state - Estado atual do componente
 */
function setupEventListeners(element, userManager, adminAuth, state) {
    // Busca
    const searchInput = element.querySelector('#user-search');
    const searchField = element.querySelector('#search-field');
    const searchButton = element.querySelector('#search-button');
    const clearSearchButton = element.querySelector('#clear-search');
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            state.searchTerm = searchInput.value.trim();
            state.searchField = searchField.value;
            state.currentPage = 1;
            loadUsers(element, userManager, state);
        });
    }
    
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            state.searchTerm = '';
            state.searchField = 'displayName';
            state.currentPage = 1;
            loadUsers(element, userManager, state);
        });
    }
    
    // Paginação
    const prevButton = element.querySelector('#prev-page');
    const nextButton = element.querySelector('#next-page');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                loadUsers(element, userManager, state);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (state.currentPage < state.totalPages) {
                state.currentPage++;
                loadUsers(element, userManager, state);
            }
        });
    }
    
    // Exportação
    const exportJsonButton = element.querySelector('#export-json');
    const exportCsvButton = element.querySelector('#export-csv');
    
    if (exportJsonButton) {
        exportJsonButton.addEventListener('click', async () => {
            try {
                const data = await userManager.exportUserData('json');
                downloadFile(data, 'usuarios.json', 'application/json');
            } catch (error) {
                console.error('Erro ao exportar JSON:', error);
                alert('Erro ao exportar dados: ' + error.message);
            }
        });
    }
    
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', async () => {
            try {
                const data = await userManager.exportUserData('csv');
                downloadFile(data, 'usuarios.csv', 'text/csv');
            } catch (error) {
                console.error('Erro ao exportar CSV:', error);
                alert('Erro ao exportar dados: ' + error.message);
            }
        });
    }
    
    // Ações em usuários (delegadas)
    element.addEventListener('click', async (event) => {
        const row = event.target.closest('tr[data-user-id]');
        if (!row) return;
        
        const userId = row.dataset.userId;
        
        // Visualizar usuário
        if (event.target.closest('.view-user')) {
            // Implementar navegação para detalhes do usuário
            window.location.hash = `#user-detail/${userId}`;
        }
        
        // Editar usuário
        if (event.target.closest('.edit-user')) {
            // Implementar edição de usuário
            editUser(userManager, userId, row);
        }
        
        // Banir usuário
        if (event.target.closest('.ban-user')) {
            // Confirmar e banir usuário
            if (confirm('Tem certeza que deseja banir este usuário?')) {
                try {
                    const reason = prompt('Motivo do banimento (opcional):') || '';
                    await userManager.banUser(userId, reason);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'ban_user', 
                            { 
                                targetUserId: userId, 
                                reason: reason 
                            }
                        );
                    }
                    
                    // Atualizar interface
                    loadUsers(element, userManager, state);
                } catch (error) {
                    console.error('Erro ao banir usuário:', error);
                    alert('Erro ao banir usuário: ' + error.message);
                }
            }
        }
        
        // Desbanir usuário
        if (event.target.closest('.unban-user')) {
            if (confirm('Tem certeza que deseja desbanir este usuário?')) {
                try {
                    await userManager.unbanUser(userId);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'unban_user', 
                            { targetUserId: userId }
                        );
                    }
                    
                    // Atualizar interface
                    loadUsers(element, userManager, state);
                } catch (error) {
                    console.error('Erro ao desbanir usuário:', error);
                    alert('Erro ao desbanir usuário: ' + error.message);
                }
            }
        }
        
        // Excluir usuário
        if (event.target.closest('.delete-user')) {
            if (confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este usuário? Esta ação não pode ser desfeita!')) {
                try {
                    await userManager.deleteUser(userId);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'delete_user', 
                            { targetUserId: userId }
                        );
                    }
                    
                    // Atualizar interface
                    loadUsers(element, userManager, state);
                    alert('Usuário excluído com sucesso!');
                } catch (error) {
                    console.error('Erro ao excluir usuário:', error);
                    alert('Erro ao excluir usuário: ' + error.message);
                }
            }
        }
    });
}

/**
 * Edita um usuário
 * @param {Object} userManager - Instância do UserManager
 * @param {string} userId - ID do usuário
 * @param {HTMLElement} row - Elemento da linha do usuário
 */
async function editUser(userManager, userId, row) {
    try {
        const user = await userManager.getUserById(userId);
        if (!user) {
            alert('Usuário não encontrado');
            return;
        }
        
        // Criar modal de edição
        const points = prompt('Novos pontos:', user.points || 0);
        if (points === null) return; // Cancelado
        
        const captures = prompt('Novas capturas:', user.captures || 0);
        if (captures === null) return; // Cancelado
        
        // Validar entradas
        const pointsNum = parseInt(points);
        const capturesNum = parseInt(captures);
        
        if (isNaN(pointsNum) || isNaN(capturesNum)) {
            alert('Valores inválidos');
            return;
        }
        
        // Atualizar usuário
        await userManager.updateUserPoints(userId, pointsNum);
        await userManager.updateUserCaptures(userId, capturesNum);
        
        // Atualizar linha na tabela
        const pointsCell = row.querySelector('td:nth-child(3)');
        const capturesCell = row.querySelector('td:nth-child(4)');
        
        if (pointsCell) pointsCell.textContent = pointsNum;
        if (capturesCell) capturesCell.textContent = capturesNum;
        
        alert('Usuário atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao editar usuário:', error);
        alert('Erro ao editar usuário: ' + error.message);
    }
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