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
        this.systemLogsRef = database.ref('systemLogs');
        this.adminsRef = database.ref('admins');
    }
    
    /**
     * Registra uma ação administrativa com validação de autenticidade
     * @param {string} adminId - ID do administrador
     * @param {string} action - Ação realizada
     * @param {Object} details - Detalhes da ação
     * @param {Object} adminAuth - Instância do AdminAuthManager para validação
     * @returns {Promise<string>} - ID do log criado
     */
    async logAction(adminId, action, details = {}, adminAuth) {
        try {
            // Validar se o adminId é válido
            if (!adminId || typeof adminId !== 'string' || adminId.length === 0) {
                throw new Error('ID de administrador inválido');
            }
            
            // Validar se a ação é válida
            if (!action || typeof action !== 'string' || action.length === 0) {
                throw new Error('Ação inválida');
            }
            
            // Sanitizar detalhes da ação
            const sanitizedDetails = this.sanitizeLogDetails(details);
            
            // Verificar se o usuário é realmente um administrador antes de registrar a ação
            const isAdmin = await this.verifyAdminStatus(adminId);
            if (!isAdmin) {
                throw new Error('Tentativa de registrar ação de auditoria por usuário não autorizado');
            }
            
            // Verificar permissões se adminAuth for fornecido
            if (adminAuth) {
                // Validar que o adminId corresponde ao usuário atual, se possível
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin && currentAdmin.uid !== adminId) {
                    throw new Error('Tentativa de registrar ação como outro administrador');
                }
            }
            
            const logEntry = {
                adminId: adminId,
                action: action,
                timestamp: new Date().toISOString(),
                details: sanitizedDetails,
                userAgent: this.getUserAgentInfo(),
                ipAddress: 'unknown' // O IP será adicionado no servidor se possível
            };
            
            const newLogRef = this.logsRef.push();
            await newLogRef.set(logEntry);
            return newLogRef.key;
        } catch (error) {
            console.error('Erro ao registrar ação:', error);
            // Registra erro de sistema para rastreamento
            if (error.message.includes('não autorizado')) {
                await this.logSystemError('Tentativa de registro de auditoria fraudulento', error, { adminId, action });
            }
            throw error;
        }
    }
    
    /**
     * Verifica se um usuário é realmente um administrador
     * @param {string} adminId - ID do administrador a ser verificado
     * @returns {Promise<boolean>} - True se for um administrador válido
     */
    async verifyAdminStatus(adminId) {
        try {
            const adminRef = this.adminsRef.child(adminId);
            const snapshot = await adminRef.once('value');
            return snapshot.exists();
        } catch (error) {
            console.error('Erro ao verificar status de administrador:', error);
            return false;
        }
    }
    
    /**
     * Sanitiza os detalhes do log para evitar injeção de dados perigosos
     * @param {Object} details - Detalhes do log
     * @returns {Object} - Detalhes sanitizados
     */
    sanitizeLogDetails(details) {
        if (!details || typeof details !== 'object') {
            return {};
        }
        
        const sanitized = {};
        
        for (const [key, value] of Object.entries(details)) {
            if (typeof value === 'string') {
                // Sanitizar strings para evitar injeção
                sanitized[key] = value.replace(/[<>"'&]/g, function(match) {
                    return {
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#x27;',
                        '&': '&amp;'
                    }[match];
                });
            } else if (typeof value === 'object' && value !== null) {
                // Recursivamente sanitizar objetos aninhados
                sanitized[key] = this.sanitizeLogDetails(value);
            } else {
                // Manter outros tipos de dados como estão
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    /**
     * Obtém informações do agente de usuário (não confiável, apenas para referência)
     * @returns {string} - Informações do agente de usuário
     */
    getUserAgentInfo() {
        try {
            return navigator.userAgent;
        } catch (error) {
            return 'unknown';
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
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<Array>} - Lista de logs
     */
    async getAuditLogs(filters = {}, limit = 100, adminAuth) {
        // Verificar permissões antes de obter logs
        if (!adminAuth || !adminAuth.hasPermission('audit_view')) {
            throw new Error('Permissão negada: visualizar logs de auditoria');
        }
        
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
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<Array>} - Lista de logs de sistema
     */
    async getSystemLogs(limit = 50, adminAuth) {
        // Verificar permissões antes de obter logs de sistema
        if (!adminAuth || !adminAuth.hasPermission('system_logs_view')) {
            throw new Error('Permissão negada: visualizar logs de sistema');
        }
        
        try {
            const query = this.systemLogsRef.orderByChild('timestamp').limitToLast(limit);
            
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
            // Sanitizar mensagem e contexto
            const sanitizedMessage = this.sanitizeLogDetails({ message: message }).message;
            const sanitizedContext = this.sanitizeLogDetails(context);
            
            const errorLog = {
                type: 'error',
                message: sanitizedMessage,
                error: this.sanitizeLogDetails(errorObject),
                context: sanitizedContext,
                timestamp: new Date().toISOString(),
                userAgent: this.getUserAgentInfo()
            };
            
            const newLogRef = this.systemLogsRef.push();
            await newLogRef.set(errorLog);
        } catch (error) {
            console.error('Erro ao registrar erro do sistema:', error);
        }
    }
    
    /**
     * Obtém administradores ativos (logados recentemente)
     * @param {number} minutes - Minutos para considerar como "ativo"
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<Array>} - Lista de administradores ativos
     */
    async getActiveAdmins(minutes = 30, adminAuth) {
        // Verificar permissões antes de obter administradores ativos
        if (!adminAuth || !adminAuth.hasPermission('admin_list')) {
            throw new Error('Permissão negada: visualizar lista de administradores');
        }
        
        try {
            const snapshot = await this.adminsRef.once('value');
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
    
    /**
     * Detecta atividades suspeitas com base em padrões
     * @param {string} adminId - ID do administrador
     * @param {string} action - Ação realizada
     * @returns {boolean} - True se a atividade for considerada suspeita
     */
    async detectSuspiciousActivity(adminId, action) {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora atrás
            
            // Obter logs do admin nos últimos 15 minutos
            const recentLogs = await this.getAuditLogs({
                adminId: adminId,
                startDate: oneHourAgo
            }, 1000, null); // Passar null para adminAuth pois essa função é chamada internamente
            
            // Contar ações por tipo
            const actionCounts = {};
            recentLogs.forEach(log => {
                if (log.action && log.adminId === adminId) {
                    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
                }
            });
            
            // Verificar se é a primeira vez que esta ação está sendo feita ou se há padrões suspeitos
            if (action === 'delete_user' && actionCounts['delete_user'] && actionCounts['delete_user'] > 5) {
                return true; // Muitas exclusões em pouco tempo
            }
            
            if (action === 'update_game_config' && actionCounts['update_game_config'] && actionCounts['update_game_config'] > 10) {
                return true; // Muitas atualizações de configuração
            }
            
            // Verificar ações em sequência incomum
            if (action === 'ban_user' && actionCounts['ban_user'] && actionCounts['ban_user'] > 3) {
                return true; // Muitos banimentos em pouco tempo
            }
            
            return false; // Nenhuma atividade suspeita detectada
        } catch (error) {
            console.error('Erro ao detectar atividade suspeita:', error);
            return false;
        }
    }
}