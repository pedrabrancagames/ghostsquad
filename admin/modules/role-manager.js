/**
 * Gerenciador de Funções e Permissões
 * 
 * Classe responsável por gerenciar as funções e permissões dos usuários administrativos.
 */
export class RoleManager {
    constructor(database) {
        this.database = database;
        this.adminsRef = database.ref('admins');
        
        // Definir papéis e permissões padrão
        this.rolePermissions = {
            superadmin: [
                'user_view', 'user_edit', 'user_delete', 'user_ban', 'user_export',
                'location_view', 'location_create', 'location_edit', 'location_delete',
                'config_view', 'config_edit', 'config_export', 'config_import',
                'ghost_create', 'ghost_edit', 'ghost_delete',
                'event_create', 'event_edit', 'event_delete',
                'audit_view', 'system_logs_view', 'admin_list',
                'ranking_update', 'all_permissions'
            ],
            admin: [
                'user_view', 'user_edit', 'user_ban',
                'location_view', 'location_create', 'location_edit', 'location_delete',
                'config_view', 'config_edit',
                'ghost_create', 'ghost_edit', 'ghost_delete',
                'event_create', 'event_edit', 'event_delete',
                'audit_view', 'ranking_update'
            ],
            moderator: [
                'user_view', 'user_edit',
                'location_view',
                'ghost_create', 'ghost_edit'
            ]
        };
    }

    /**
     * Obtém as permissões para um papel específico
     * @param {string} role - Nome do papel
     * @returns {Array} - Lista de permissões
     */
    getPermissionsForRole(role) {
        return this.rolePermissions[role] || [];
    }

    /**
     * Obtém todos os papéis disponíveis
     * @returns {Array} - Lista de papéis
     */
    getAllRoles() {
        return Object.keys(this.rolePermissions);
    }

    /**
     * Verifica se um usuário tem uma permissão específica
     * @param {string} adminId - ID do administrador
     * @param {string} permission - Permissão a ser verificada
     * @returns {Promise<boolean>} - True se o usuário tem a permissão
     */
    async hasPermission(adminId, permission) {
        try {
            // Obter dados do administrador
            const adminRef = this.adminsRef.child(adminId);
            const snapshot = await adminRef.once('value');
            const adminData = snapshot.val();

            if (!adminData) {
                return false;
            }

            // Se for superadmin, tem todas as permissões
            if (adminData.role === 'superadmin') {
                return true;
            }

            // Verificar se a permissão está na lista do papel do usuário
            const rolePermissions = this.getPermissionsForRole(adminData.role);
            return rolePermissions.includes(permission);
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return false;
        }
    }

    /**
     * Adiciona um administrador com um papel específico
     * @param {string} adminId - ID do administrador
     * @param {string} role - Papel a ser atribuído
     * @param {Object} adminData - Dados adicionais do administrador
     * @param {Object} currentAdminAuth - Instância do AdminAuthManager do administrador atual
     * @returns {Promise<void>}
     */
    async addAdmin(adminId, role, adminData, currentAdminAuth) {
        // Verificar se o administrador atual tem permissão para adicionar novos administradores
        if (!currentAdminAuth || !await this.hasPermission(currentAdminAuth.auth.currentUser.uid, 'admin_create')) {
            throw new Error('Permissão negada: criar administradores');
        }
        
        // Verificar se o papel é válido
        if (!this.rolePermissions[role]) {
            throw new Error('Papel inválido');
        }

        // Preparar dados do administrador
        const adminRecord = {
            ...adminData,
            role: role,
            permissions: this.getPermissionsForRole(role),
            createdAt: new Date().toISOString(),
            createdBy: currentAdminAuth.auth.currentUser.uid
        };

        // Salvar no Firebase
        const adminRef = this.adminsRef.child(adminId);
        await adminRef.set(adminRecord);
    }

    /**
     * Atualiza o papel de um administrador existente
     * @param {string} adminId - ID do administrador
     * @param {string} newRole - Novo papel
     * @param {Object} currentAdminAuth - Instância do AdminAuthManager do administrador atual
     * @returns {Promise<void>}
     */
    async updateAdminRole(adminId, newRole, currentAdminAuth) {
        // Verificar se o administrador atual tem permissão para atualizar administradores
        if (!currentAdminAuth || !await this.hasPermission(currentAdminAuth.auth.currentUser.uid, 'admin_edit')) {
            throw new Error('Permissão negada: editar administradores');
        }

        // Verificar se o papel é válido
        if (!this.rolePermissions[newRole]) {
            throw new Error('Papel inválido');
        }

        // Obter dados atuais do administrador
        const adminRef = this.adminsRef.child(adminId);
        const snapshot = await adminRef.once('value');
        const currentData = snapshot.val();

        if (!currentData) {
            throw new Error('Administrador não encontrado');
        }

        // Atualizar papel e permissões
        const updateData = {
            role: newRole,
            permissions: this.getPermissionsForRole(newRole),
            updatedAt: new Date().toISOString(),
            updatedBy: currentAdminAuth.auth.currentUser.uid
        };

        await adminRef.update(updateData);
    }

    /**
     * Remove um administrador
     * @param {string} adminId - ID do administrador
     * @param {Object} currentAdminAuth - Instância do AdminAuthManager do administrador atual
     * @returns {Promise<void>}
     */
    async removeAdmin(adminId, currentAdminAuth) {
        // Verificar se o administrador atual tem permissão para remover administradores
        if (!currentAdminAuth || !await this.hasPermission(currentAdminAuth.auth.currentUser.uid, 'admin_delete')) {
            throw new Error('Permissão negada: remover administradores');
        }

        // Não permitir que um administrador remova a si mesmo
        if (currentAdminAuth.auth.currentUser.uid === adminId) {
            throw new Error('Não é permitido remover a si mesmo');
        }

        // Remover do Firebase
        const adminRef = this.adminsRef.child(adminId);
        await adminRef.remove();
    }

    /**
     * Verifica se o papel pode ser modificado
     * @param {string} currentRole - Papel atual
     * @param {string} targetRole - Papel de destino
     * @param {string} action - Ação sendo realizada (update, delete)
     * @returns {boolean} - True se a modificação é permitida
     */
    canModifyRole(currentRole, targetRole, action = 'update') {
        // Superadmin pode modificar qualquer papel
        if (currentRole === 'superadmin') {
            return true;
        }

        // Admin pode modificar moderadores e admins, mas não superadmins
        if (currentRole === 'admin' && targetRole !== 'superadmin') {
            return true;
        }

        // Moderadores não podem modificar outros administradores
        return false;
    }

    /**
     * Obtém informações sobre todos os administradores
     * @param {Object} currentAdminAuth - Instância do AdminAuthManager do administrador atual
     * @returns {Promise<Array>} - Lista de administradores
     */
    async getAllAdmins(currentAdminAuth) {
        // Verificar se o administrador atual tem permissão para visualizar lista de administradores
        if (!currentAdminAuth || !await this.hasPermission(currentAdminAuth.auth.currentUser.uid, 'admin_list')) {
            throw new Error('Permissão negada: visualizar lista de administradores');
        }

        try {
            const snapshot = await this.adminsRef.once('value');
            const admins = snapshot.val() || {};
            const adminList = [];

            for (const [adminId, adminData] of Object.entries(admins)) {
                // Filtrar informações sensíveis
                adminList.push({
                    id: adminId,
                    name: adminData.name,
                    email: adminData.email,
                    role: adminData.role,
                    lastLogin: adminData.lastLogin,
                    createdAt: adminData.createdAt
                });
            }

            return adminList;
        } catch (error) {
            console.error('Erro ao obter administradores:', error);
            throw error;
        }
    }
}