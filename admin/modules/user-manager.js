/**
 * Gerenciador de Usuários
 * 
 * Classe responsável por gerenciar operações CRUD e funcionalidades
 * relacionadas aos usuários do jogo.
 */
export class UserManager {
    /**
     * Construtor do UserManager
     * @param {Object} database - Instância do Firebase Database
     */
    constructor(database) {
        this.database = database;
        this.usersRef = database.ref('users');
    }
    
    /**
     * Obtém todos os usuários com paginação
     * @param {number} page - Número da página (começa em 1)
     * @param {number} limit - Limite de usuários por página
     * @returns {Promise<Object>} - Objeto com usuários e informações de paginação
     */
    async getAllUsers(page = 1, limit = 20) {
        try {
            // Calcular offset
            const offset = (page - 1) * limit;
            
            // Obter todos os usuários
            const snapshot = await this.usersRef.once('value');
            const allUsers = snapshot.val() || {};
            
            // Converter para array e ordenar por data de criação (mais recente primeiro)
            const usersArray = Object.entries(allUsers)
                .map(([uid, userData]) => ({ uid, ...userData }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Aplicar paginação
            const paginatedUsers = usersArray.slice(offset, offset + limit);
            
            return {
                users: paginatedUsers,
                total: usersArray.length,
                page: page,
                pages: Math.ceil(usersArray.length / limit)
            };
        } catch (error) {
            console.error('Erro ao obter usuários:', error);
            throw error;
        }
    }
    
    /**
     * Obtém um usuário específico pelo ID
     * @param {string} uid - ID do usuário
     * @returns {Promise<Object|null>} - Dados do usuário ou null se não encontrado
     */
    async getUserById(uid) {
        try {
            const userRef = this.usersRef.child(uid);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            
            if (userData) {
                return { uid, ...userData };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza os pontos de um usuário
     * @param {string} uid - ID do usuário
     * @param {number} points - Novos pontos
     * @returns {Promise<void>}
     */
    async updateUserPoints(uid, points) {
        try {
            const userRef = this.usersRef.child(uid);
            await userRef.update({ points: points });
        } catch (error) {
            console.error('Erro ao atualizar pontos do usuário:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza as estatísticas de captura de um usuário
     * @param {string} uid - ID do usuário
     * @param {number} captures - Novo número de capturas
     * @returns {Promise<void>}
     */
    async updateUserCaptures(uid, captures) {
        try {
            const userRef = this.usersRef.child(uid);
            await userRef.update({ captures: captures });
        } catch (error) {
            console.error('Erro ao atualizar capturas do usuário:', error);
            throw error;
        }
    }
    
    /**
     * Bane um usuário
     * @param {string} uid - ID do usuário
     * @param {string} reason - Motivo do banimento
     * @returns {Promise<void>}
     */
    async banUser(uid, reason = '') {
        try {
            const userRef = this.usersRef.child(uid);
            await userRef.update({ 
                status: 'banned',
                banReason: reason,
                bannedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao banir usuário:', error);
            throw error;
        }
    }
    
    /**
     * Desbane um usuário
     * @param {string} uid - ID do usuário
     * @returns {Promise<void>}
     */
    async unbanUser(uid) {
        try {
            const userRef = this.usersRef.child(uid);
            await userRef.update({ 
                status: 'active',
                banReason: null,
                bannedAt: null
            });
        } catch (error) {
            console.error('Erro ao desbanir usuário:', error);
            throw error;
        }
    }
    
    /**
     * Busca usuários por critérios
     * @param {string} query - Termo de busca
     * @param {string} field - Campo para buscar (displayName, email)
     * @returns {Promise<Array>} - Lista de usuários que correspondem à busca
     */
    async searchUsers(query, field = 'displayName') {
        try {
            const snapshot = await this.usersRef.once('value');
            const allUsers = snapshot.val() || {};
            
            const results = Object.entries(allUsers)
                .map(([uid, userData]) => ({ uid, ...userData }))
                .filter(user => {
                    if (field === 'displayName') {
                        return user.displayName && user.displayName.toLowerCase().includes(query.toLowerCase());
                    } else if (field === 'email') {
                        return user.email && user.email.toLowerCase().includes(query.toLowerCase());
                    } else if (field === 'uid') {
                        return user.uid.toLowerCase().includes(query.toLowerCase());
                    }
                    return false;
                });
            
            return results;
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }
    
    /**
     * Exporta dados dos usuários
     * @param {string} format - Formato de exportação (csv, json)
     * @returns {Promise<string>} - Dados exportados como string
     */
    async exportUserData(format = 'json') {
        try {
            const snapshot = await this.usersRef.once('value');
            const users = snapshot.val() || {};
            
            if (format === 'json') {
                return JSON.stringify(users, null, 2);
            } else if (format === 'csv') {
                // Converter para CSV
                const usersArray = Object.entries(users).map(([uid, userData]) => ({
                    uid,
                    ...userData
                }));
                
                if (usersArray.length === 0) return '';
                
                // Cabeçalhos
                const headers = Object.keys(usersArray[0]).join(',');
                
                // Linhas
                const rows = usersArray.map(user => {
                    return Object.values(user).map(value => {
                        if (typeof value === 'string') {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',');
                }).join('\n');
                
                return `${headers}\n${rows}`;
            }
        } catch (error) {
            console.error('Erro ao exportar dados dos usuários:', error);
            throw error;
        }
    }
    
    /**
     * Exclui um usuário permanentemente
     * @param {string} uid - ID do usuário
     * @returns {Promise<void>}
     */
    async deleteUser(uid) {
        try {
            const userRef = this.usersRef.child(uid);
            await userRef.remove();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            throw error;
        }
    }
    
    /**
     * Obtém estatísticas de um usuário
     * @param {string} uid - ID do usuário
     * @returns {Promise<Object>} - Estatísticas do usuário
     */
    async getUserStats(uid) {
        try {
            const user = await this.getUserById(uid);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }
            
            // Calcular estatísticas adicionais
            const stats = {
                totalCaptures: user.captures || 0,
                totalPoints: user.points || 0,
                level: user.level || 1,
                ecto1Unlocked: user.ecto1Unlocked || false,
                accountAge: this.calculateAccountAge(user.createdAt),
                daysActive: this.calculateDaysActive(user),
                favoriteLocations: this.getFavoriteLocations(user)
            };
            
            return stats;
        } catch (error) {
            console.error('Erro ao obter estatísticas do usuário:', error);
            throw error;
        }
    }
    
    /**
     * Calcula a idade da conta em dias
     * @param {string} createdAt - Data de criação da conta
     * @returns {number} - Idade da conta em dias
     */
    calculateAccountAge(createdAt) {
        if (!createdAt) return 0;
        
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Calcula dias ativos do usuário
     * @param {Object} user - Dados do usuário
     * @returns {number} - Número de dias ativos
     */
    calculateDaysActive(user) {
        // Esta é uma implementação simplificada
        // Em uma implementação real, você teria um histórico de atividades
        if (user.lastActive) {
            const lastActive = new Date(user.lastActive);
            const created = new Date(user.createdAt);
            const diffTime = Math.abs(lastActive - created);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    }
    
    /**
     * Obtém localizações favoritas do usuário
     * @param {Object} user - Dados do usuário
     * @returns {Array} - Lista de localizações favoritas
     */
    getFavoriteLocations(user) {
        // Esta é uma implementação simplificada
        // Em uma implementação real, você teria dados de capturas por localização
        return [];
    }
}