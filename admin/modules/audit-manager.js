/**
 * Gerenciador de Auditoria
 * 
 * Classe responsável por gerenciar logs de auditoria e segurança
 * para todas as ações administrativas.
 */
export class AuditManager {
    /**
     * Construtor do AuditManager
     * @param {Object} database - Instância do Firebase Database
     */
    constructor(database) {
        this.database = database;
        this.logsRef = database.ref('auditLogs');
    }
    
    /**
     * Registra uma ação administrativa
     * @param {string} adminId - ID do administrador
     * @param {string} action - Ação realizada
     * @param {Object} details - Detalhes da ação
     * @returns {Promise<string>} - ID do log criado
     */
    async logAction(adminId, action, details = {}) {
        try {
            const logEntry = {
                adminId: adminId,
                action: action,
                timestamp: new Date().toISOString(),
                details: details
            };
            
            const newLogRef = this.logsRef.push();
            await newLogRef.set(logEntry);
            return newLogRef.key;
        } catch (error) {
            console.error('Erro ao registrar ação:', error);
            throw error;
        }
    }
    
    /**
     * Obtém logs de auditoria com filtros
     * @param {Object} filters - Filtros para a consulta
     * @param {string} filters.adminId - Filtrar por ID do administrador
     * @param {string} filters.action - Filtrar por tipo de ação
     * @param {Date} filters.startDate - Data inicial
     * @param {Date} filters.endDate - Data final
     * @param {number} limit - Limite de registros
     * @returns {Promise<Array>} - Lista de logs
     */
    async getAuditLogs(filters = {}, limit = 100) {
        try {
            let query = this.logsRef.orderByChild('timestamp');
            
            // Aplicar limite
            query = query.limitToLast(limit);
            
            const snapshot = await query.once('value');
            let logs = [];
            
            snapshot.forEach(childSnapshot => {
                const log = childSnapshot.val();
                log.id = childSnapshot.key;
                
                // Aplicar filtros
                let includeLog = true;
                
                if (filters.adminId && log.adminId !== filters.adminId) {
                    includeLog = false;
                }
                
                if (filters.action && log.action !== filters.action) {
                    includeLog = false;
                }
                
                if (filters.startDate && new Date(log.timestamp) < filters.startDate) {
                    includeLog = false;
                }
                
                if (filters.endDate && new Date(log.timestamp) > filters.endDate) {
                    includeLog = false;
                }
                
                if (includeLog) {
                    logs.push(log);
                }
            });
            
            // Ordenar por timestamp decrescente
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return logs;
        } catch (error) {
            console.error('Erro ao obter logs de auditoria:', error);
            throw error;
        }
    }
    
    /**
     * Obtém logs de sistema (erros, falhas, etc.)
     * @param {number} limit - Limite de registros
     * @returns {Promise<Array>} - Lista de logs de sistema
     */
    async getSystemLogs(limit = 50) {
        try {
            const systemLogsRef = this.database.ref('systemLogs');
            const query = systemLogsRef.orderByChild('timestamp').limitToLast(limit);
            
            const snapshot = await query.once('value');
            const logs = [];
            
            snapshot.forEach(childSnapshot => {
                const log = childSnapshot.val();
                log.id = childSnapshot.key;
                logs.push(log);
            });
            
            // Ordenar por timestamp decrescente
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return logs;
        } catch (error) {
            console.error('Erro ao obter logs de sistema:', error);
            throw error;
        }
    }
    
    /**
     * Registra um erro no sistema
     * @param {string} message - Mensagem de erro
     * @param {Object} errorObject - Objeto de erro
     * @param {Object} context - Contexto adicional
     */
    async logSystemError(message, errorObject = {}, context = {}) {
        try {
            const errorLog = {
                type: 'error',
                message: message,
                error: errorObject,
                context: context,
                timestamp: new Date().toISOString()
            };
            
            const systemLogsRef = this.database.ref('systemLogs');
            const newLogRef = systemLogsRef.push();
            await newLogRef.set(errorLog);
        } catch (error) {
            console.error('Erro ao registrar erro do sistema:', error);
        }
    }
    
    /**
     * Obtém administradores ativos (logados recentemente)
     * @param {number} minutes - Minutos para considerar como "ativo"
     * @returns {Promise<Array>} - Lista de administradores ativos
     */
    async getActiveAdmins(minutes = 30) {
        try {
            const adminsRef = this.database.ref('admins');
            const snapshot = await adminsRef.once('value');
            const admins = snapshot.val();
            const activeAdmins = [];
            
            const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
            
            for (const [adminId, adminData] of Object.entries(admins)) {
                if (adminData.lastLogin && new Date(adminData.lastLogin) > cutoffTime) {
                    activeAdmins.push({
                        id: adminId,
                        ...adminData
                    });
                }
            }
            
            return activeAdmins;
        } catch (error) {
            console.error('Erro ao obter administradores ativos:', error);
            throw error;
        }
    }
}