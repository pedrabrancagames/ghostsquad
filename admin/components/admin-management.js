/**
 * Componente de Gerenciamento de Administradores
 * 
 * Componente responsável por gerenciar os administradores e seus papéis/permissões.
 */

/**
 * Inicializa o componente de gerenciamento de administradores
 * @param {HTMLElement} element - Elemento DOM onde o componente será renderizado
 * @param {Object} roleManager - Instância do RoleManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
export async function initAdminManagement(element, roleManager, adminAuth) {
    if (!element || !roleManager || !adminAuth) {
        console.error('Elemento, RoleManager ou AdminAuth não fornecidos para o componente de gerenciamento de administradores');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="admin-management-container">
                <div class="loading">Carregando administradores...</div>
            </div>
        `;
        
        // Verificar permissões
        if (!await adminAuth.hasPermission('admin_list')) {
            throw new Error('Permissão negada: visualizar lista de administradores');
        }
        
        // Carregar administradores
        const admins = await roleManager.getAllAdmins(adminAuth);
        
        // Obter papéis disponíveis
        const availableRoles = await roleManager.getAllRoles();
        
        // Renderizar interface
        renderAdminManagement(element, admins, availableRoles);
        
        // Configurar eventos
        setupAdminManagementEventListeners(element, roleManager, adminAuth);
    } catch (error) {
        console.error('Erro ao carregar gerenciamento de administradores:', error);
        element.innerHTML = `
            <div class="admin-management-container">
                <div class="error">Erro ao carregar: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de gerenciamento de administradores
 * @param {HTMLElement} element - Elemento DOM onde o componente será renderizado
 * @param {Array} admins - Lista de administradores
 * @param {Array} availableRoles - Lista de papéis disponíveis
 */
function renderAdminManagement(element, admins, availableRoles) {
    element.innerHTML = `
        <div class="admin-management-container">
            <div class="admin-management-header">
                <h2>Gerenciar Administradores</h2>
                <p>Adicione, edite e remova administradores e seus papéis</p>
            </div>
            
            <div class="admin-management-content">
                <div class="admin-management-section">
                    <h3>Adicionar Novo Administrador</h3>
                    <form id="add-admin-form">
                        <div class="form-group">
                            <label for="admin-email">Email do Administrador:</label>
                            <input type="email" id="admin-email" required>
                        </div>
                        <div class="form-group">
                            <label for="admin-role">Papel:</label>
                            <select id="admin-role" required>
                                ${availableRoles.map(role => `<option value="${role}">${role}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="admin-name">Nome:</label>
                            <input type="text" id="admin-name" required>
                        </div>
                        <button type="submit" class="btn-primary">Adicionar Administrador</button>
                    </form>
                </div>
                
                <div class="admin-management-section">
                    <h3>Administradores Ativos</h3>
                    <div class="admins-table-container">
                        <table class="admins-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Papel</th>
                                    <th>Último Login</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderAdminsTable(admins)}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="admin-management-section">
                    <h3>Definições de Papéis</h3>
                    <div class="roles-definition">
                        ${renderRolesDefinition(availableRoles)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a tabela de administradores
 * @param {Array} admins - Lista de administradores
 * @returns {string} - HTML da tabela
 */
function renderAdminsTable(admins) {
    if (!admins || admins.length === 0) {
        return `<tr><td colspan="5" class="no-data">Nenhum administrador encontrado</td></tr>`;
    }
    
    return admins.map(admin => `
        <tr>
            <td>${admin.name || 'N/A'}</td>
            <td>${admin.email || 'N/A'}</td>
            <td>${admin.role || 'N/A'}</td>
            <td>${formatDateTime(admin.lastLogin) || 'N/A'}</td>
            <td>
                <button class="btn-secondary change-role-btn" data-admin-id="${admin.id}" data-current-role="${admin.role}">Alterar Papel</button>
                <button class="btn-danger remove-admin-btn" data-admin-id="${admin.id}">Remover</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Renderiza as definições de papéis
 * @param {Array} roles - Lista de papéis
 * @returns {string} - HTML das definições
 */
function renderRolesDefinition(roles) {
    const rolePermissions = {
        superadmin: [
            'Acesso completo (todos os privilégios)',
            'Gerenciar usuários',
            'Gerenciar configurações',
            'Gerenciar localizações',
            'Gerenciar fantasmas',
            'Gerenciar eventos',
            'Visualizar logs',
            'Gerenciar administradores'
        ],
        admin: [
            'Gerenciar usuários (exceto banir)',
            'Gerenciar configurações',
            'Gerenciar localizações',
            'Gerenciar fantasmas',
            'Gerenciar eventos',
            'Visualizar logs'
        ],
        moderator: [
            'Visualizar usuários',
            'Editar informações de usuários',
            'Visualizar localizações',
            'Criar e editar fantasmas'
        ]
    };
    
    return roles.map(role => `
        <div class="role-definition">
            <h4>${role}</h4>
            <ul>
                ${(rolePermissions[role] || []).map(permission => `<li>${permission}</li>`).join('')}
            </ul>
        </div>
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
 * Configura os event listeners para o gerenciamento de administradores
 * @param {HTMLElement} element - Elemento DOM onde o componente é renderizado
 * @param {Object} roleManager - Instância do RoleManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
function setupAdminManagementEventListeners(element, roleManager, adminAuth) {
    // Adicionar novo administrador
    const addAdminForm = element.querySelector('#add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = element.querySelector('#admin-email').value;
            const role = element.querySelector('#admin-role').value;
            const name = element.querySelector('#admin-name').value;
            
            try {
                // Simular criação de ID do administrador (isso seria diferente em uma implementação real)
                // Neste caso, o ID do administrador seria o mesmo do usuário Firebase
                
                // Mostrar mensagem de que esta funcionalidade requer implementação adicional
                alert('Funcionalidade de adicionar administrador requer integração com sistema de autenticação completo.');
                console.log('Para implementar esta funcionalidade, você precisa:', 
                    '1. Criar um usuário no Firebase Auth',
                    '2. Obter o UID desse usuário',
                    '3. Chamar roleManager.addAdmin(uid, role, {email, name}, adminAuth)');
            } catch (error) {
                console.error('Erro ao adicionar administrador:', error);
                showNotification('Erro ao adicionar administrador: ' + error.message, 'error');
            }
        });
    }
    
    // Alterar papel de administrador
    element.addEventListener('click', async (event) => {
        if (event.target.classList.contains('change-role-btn')) {
            const adminId = event.target.getAttribute('data-admin-id');
            const currentRole = event.target.getAttribute('data-current-role');
            const availableRoles = await roleManager.getAllRoles();
            
            // Mostrar prompt para selecionar novo papel
            const newRole = prompt(`Alterar papel do administrador. Papel atual: ${currentRole}\nSelecione um novo papel (${availableRoles.join(', ')}):`);
            
            if (newRole && availableRoles.includes(newRole)) {
                try {
                    await roleManager.updateAdminRole(adminId, newRole, adminAuth);
                    showNotification('Papel do administrador atualizado com sucesso!', 'success');
                    
                    // Recarregar a lista de administradores
                    const admins = await roleManager.getAllAdmins(adminAuth);
                    const tableBody = element.querySelector('.admins-table tbody');
                    if (tableBody) {
                        tableBody.innerHTML = renderAdminsTable(admins);
                    }
                } catch (error) {
                    console.error('Erro ao alterar papel do administrador:', error);
                    showNotification('Erro ao alterar papel: ' + error.message, 'error');
                }
            } else if (newRole !== null) {
                showNotification('Papel inválido selecionado.', 'error');
            }
        }
        
        if (event.target.classList.contains('remove-admin-btn')) {
            const adminId = event.target.getAttribute('data-admin-id');
            
            if (confirm('Tem certeza que deseja remover este administrador? Esta ação não pode ser desfeita.')) {
                try {
                    await roleManager.removeAdmin(adminId, adminAuth);
                    showNotification('Administrador removido com sucesso!', 'success');
                    
                    // Recarregar a lista de administradores
                    const admins = await roleManager.getAllAdmins(adminAuth);
                    const tableBody = element.querySelector('.admins-table tbody');
                    if (tableBody) {
                        tableBody.innerHTML = renderAdminsTable(admins);
                    }
                } catch (error) {
                    console.error('Erro ao remover administrador:', error);
                    showNotification('Erro ao remover administrador: ' + error.message, 'error');
                }
            }
        }
    });
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