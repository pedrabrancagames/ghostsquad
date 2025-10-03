export class AdminAuthManager {
    constructor(firebase) {
        this.firebase = firebase;
        this.auth = firebase.auth();
        this.database = firebase.database();
        this.currentAdmin = null;
        this.setupAutoLogout();
    }

    async signInWithGoogle() {
        // Verificar se há tentativas excessivas de login recentes
        if (await this.isRateLimited()) {
            throw new Error('Número excessivo de tentativas de login. Tente novamente mais tarde.');
        }

        try {
            const provider = new this.firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            const isAdmin = await this.checkAdminPrivileges(user);
            
            if (!isAdmin) {
                // Registrar tentativa de login não autorizada
                await this.logAdminAction('unknown', 'failed_login_not_admin', {
                    email: user.email,
                    timestamp: new Date().toISOString(),
                    attemptedBy: user.uid
                });
                
                await this.logout();
                throw new Error('USER_NOT_ADMIN');
            }
            
            // Limpar tentativas de login após login bem-sucedido
            await this.clearRateLimit(user.uid);
            
            await this.loadAdminData(user.uid);
            await this.logAdminAction(user.uid, 'login', {
                email: user.email,
                timestamp: new Date().toISOString()
            });
            return user;
        } catch (error) {
            // Registrar tentativa de login falha
            await this.recordFailedLoginAttempt();
            
            console.error('Erro na autenticação com Google:', error);
            if (error.message === 'USER_NOT_ADMIN') {
                throw new Error('Acesso negado. Você não tem privilégios administrativos.');
            }
            throw new Error('Falha na autenticação com Google.');
        }
    }

    /**
     * Verifica se o IP ou usuário está sob limitação de taxa
     * @returns {Promise<boolean>} - True se estiver limitado
     */
    async isRateLimited() {
        const now = Date.now();
        const tenMinutesAgo = now - (10 * 60 * 1000); // 10 minutos em milissegundos
        
        // Obter tentativas de login recentes
        try {
            const logsRef = this.database.ref('auditLogs');
            const recentLogsSnapshot = await logsRef
                .orderByChild('timestamp')
                .startAt(new Date(tenMinutesAgo).toISOString())
                .once('value');
            
            const recentLogs = recentLogsSnapshot.val() || {};
            const failedLoginAttempts = Object.values(recentLogs).filter(log => 
                log.action === 'failed_login' || log.action === 'failed_login_not_admin'
            );
            
            // Se houver mais de 5 tentativas de login falhas nos últimos 10 minutos
            return failedLoginAttempts.length > 5;
        } catch (error) {
            console.error('Erro ao verificar limitação de taxa:', error);
            // Em caso de erro, não impor limitação para não afetar usuários legítimos
            return false;
        }
    }

    /**
     * Registra uma tentativa de login falha
     */
    async recordFailedLoginAttempt() {
        try {
            // Obter IP do cliente se possível
            let ipAddress = 'unknown';
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                ipAddress = ipData.ip;
            } catch (error) {
                console.warn('Não foi possível obter o endereço IP do cliente:', error);
            }

            const logEntry = {
                action: 'failed_login',
                timestamp: new Date().toISOString(),
                ipAddress: ipAddress,
                userAgent: navigator.userAgent
            };

            const logsRef = this.database.ref('auditLogs');
            const newLogRef = logsRef.push();
            await newLogRef.set(logEntry);
        } catch (error) {
            console.error('Erro ao registrar tentativa de login falha:', error);
        }
    }

    /**
     * Limpa as tentativas de login para um usuário
     * @param {string} userId - ID do usuário
     */
    async clearRateLimit(userId) {
        // Esta função limparia entradas de tentativas de login para o usuário
        // Mas como estamos rastreando por IP/tempo, vamos registrar o login bem-sucedido
        try {
            // Registrar sucesso no login para ajudar a calcular taxas
            const logEntry = {
                action: 'successful_login',
                userId: userId,
                timestamp: new Date().toISOString()
            };

            const logsRef = this.database.ref('auditLogs');
            const newLogRef = logsRef.push();
            await newLogRef.set(logEntry);
        } catch (error) {
            console.error('Erro ao limpar limitação de taxa:', error);
        }
    }

    async checkAdminPrivileges(user) {
        try {
            if (!user || !user.uid) {
                return false;
            }

            // Obter informações do usuário para verificação adicional
            const adminRef = this.database.ref(`admins/${user.uid}`);
            const snapshot = await adminRef.once('value');
            
            if (!snapshot.exists()) {
                return false;
            }

            // Obter dados do admin para verificar status ativo
            const adminData = snapshot.val();
            if (!adminData) {
                return false;
            }

            // Verificar se o admin está ativo (opcional: adicionar campo 'isActive' no futuro)
            // if (adminData.isActive === false) {
            //     return false;
            // }

            return true;
        } catch (error) {
            console.error('Erro ao verificar privilégios:', error);
            return false;
        }
    }
    
    async loadAdminData(adminId) {
        try {
            const adminRef = this.database.ref(`admins/${adminId}`);
            const snapshot = await adminRef.once('value');
            this.currentAdmin = snapshot.val();
            
            if (this.currentAdmin) {
                await adminRef.update({
                    lastLogin: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados do administrador:', error);
        }
    }

    hasPermission(permission) {
        if (!this.currentAdmin || !this.currentAdmin.permissions) {
            return false;
        }
        if (this.currentAdmin.role === 'superadmin') {
            return true;
        }
        return this.currentAdmin.permissions.includes(permission);
    }
    
    async getRolePermissions(role) {
        if (!role) {
            return [];
        }
        
        // Definir mapeamento de permissões por papel
        const rolePermissions = {
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
        
        return rolePermissions[role] || [];
    }

    async protectRoute(requiredPermissions = []) {
        return new Promise((resolve, reject) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (!user) {
                    resolve(false);
                    return;
                }
                try {
                    const isAdmin = await this.checkAdminPrivileges(user);
                    if (!isAdmin) {
                        resolve(false);
                        return;
                    }
                    if (!this.currentAdmin) {
                        await this.loadAdminData(user.uid);
                    }
                    if (requiredPermissions.length > 0) {
                        const hasAllPermissions = requiredPermissions.every(permission => 
                            this.hasPermission(permission)
                        );
                        resolve(hasAllPermissions);
                        return;
                    }
                    resolve(true);
                } catch (error) {
                    console.error('Erro ao proteger rota:', error);
                    resolve(false);
                }
            });
        });
    }

    async logout() {
        try {
            if (this.auth.currentUser) {
                await this.logAdminAction(this.auth.currentUser.uid, 'logout', {
                    timestamp: new Date().toISOString()
                });
            }
            await this.auth.signOut();
            this.currentAdmin = null;
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    setupAutoLogout() {
        let timeoutId;
        const sessionTimeout = 30 * 60 * 1000; // 30 minutos
        const warningTime = 5 * 60 * 1000; // 5 minutos antes do logout
        
        const resetTimer = () => {
            clearTimeout(timeoutId);
            
            // Verificar se o usuário ainda está autenticado
            if (this.auth.currentUser) {
                timeoutId = setTimeout(async () => {
                    // Avisar usuário 5 minutos antes da expiração
                    const warningTimeout = setTimeout(async () => {
                        if (confirm('Sua sessão está prestes a expirar por inatividade. Deseja continuar logado?')) {
                            resetTimer(); // Renova o tempo se o usuário confirmar
                        } else {
                            // Logout por inatividade
                            if (this.auth.currentUser) {
                                await this.logAdminAction(this.auth.currentUser.uid, 'auto_logout', {
                                    reason: 'inactivity',
                                    timestamp: new Date().toISOString()
                                });
                            }
                            this.logout();
                            alert('Sessão encerrada por inatividade.');
                            if (window.location.hash !== '#login') {
                                window.location.hash = '#login';
                            }
                        }
                    }, warningTime);
                    
                    // Logout após tempo total
                    timeoutId = setTimeout(async () => {
                        clearTimeout(warningTimeout); // Cancelar aviso se o tempo total expirar
                        if (this.auth.currentUser) {
                            await this.logAdminAction(this.auth.currentUser.uid, 'auto_logout', {
                                reason: 'inactivity',
                                timestamp: new Date().toISOString()
                            });
                        }
                        this.logout();
                        alert('Sessão encerrada por inatividade.');
                        if (window.location.hash !== '#login') {
                            window.location.hash = '#login';
                        }
                    }, sessionTimeout);
                }, sessionTimeout - warningTime);
            }
        };
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        // Monitorar mudanças de foco da janela
        window.addEventListener('focus', resetTimer);
        window.addEventListener('blur', () => {
            // Opcional: adicionar lógica quando a janela perde foco
        });
        
        resetTimer();
    }

    /**
     * Atualiza o tempo da sessão do usuário
     */
    async updateSessionTime() {
        if (this.auth.currentUser && this.currentAdmin) {
            try {
                const adminRef = this.database.ref(`admins/${this.auth.currentUser.uid}`);
                await adminRef.update({
                    lastActivity: new Date().toISOString()
                });
            } catch (error) {
                console.error('Erro ao atualizar tempo de sessão:', error);
            }
        }
    }

    /**
     * Verifica se a sessão do usuário ainda é válida
     * @returns {Promise<boolean>} - True se a sessão ainda é válida
     */
    async isSessionValid() {
        if (!this.auth.currentUser || !this.currentAdmin) {
            return false;
        }

        try {
            // Verificar o status do usuário no Firebase
            const token = await this.auth.currentUser.getIdTokenResult();
            if (token.expirationTime) {
                const expirationDate = new Date(token.expirationTime);
                const now = new Date();
                
                // Se o token expira em menos de 5 minutos, consideramos a sessão quase expirada
                return expirationDate.getTime() - now.getTime() > 5 * 60 * 1000;
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao verificar validade da sessão:', error);
            return false;
        }
    }

    /**
     * Renova o token de autenticação se estiver prestes a expirar
     */
    async refreshTokenIfExpiring() {
        if (this.auth.currentUser) {
            try {
                // Forçar a renovação do token
                await this.auth.currentUser.getIdToken(true);
            } catch (error) {
                console.error('Erro ao renovar token:', error);
            }
        }
    }

    async logAdminAction(adminId, action, details = {}) {
        try {
            if (!adminId) {
                console.warn('adminId não definido, pulando registro de log');
                return;
            }
            
            // Validar e sanitizar os detalhes da ação
            const sanitizedDetails = this.sanitizeLogDetails(details);
            
            const logEntry = {
                adminId: adminId,
                action: action,
                timestamp: new Date().toISOString(),
                details: sanitizedDetails
            };
            
            // Incluir informações do admin de forma segura
            if (this.currentAdmin) {
                logEntry.adminEmail = this.sanitizeUserData(this.currentAdmin.email);
                logEntry.adminName = this.sanitizeUserData(this.currentAdmin.name);
            }
            
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                logEntry.ipAddress = ipData.ip;
            } catch (error) {
                console.warn('Não foi possível obter o endereço IP do cliente:', error);
                logEntry.ipAddress = 'unknown';
            }
            
            // Verificar novamente se o usuário ainda é admin antes de logar
            const user = this.auth.currentUser;
            if (user && await this.checkAdminPrivileges(user)) {
                const logsRef = this.database.ref('auditLogs');
                const newLogRef = logsRef.push();
                await newLogRef.set(logEntry);
            } else {
                console.warn('Tentativa de registrar ação de admin por usuário não autorizado');
            }
        } catch (error) {
            console.error('Erro ao registrar ação administrativa:', error);
        }
    }

    // Função para sanitizar dados do usuário
    sanitizeUserData(input) {
        if (!input) return input;
        
        // Remover scripts e HTML potencialmente perigosos
        if (typeof input === 'string') {
            // Remover tags HTML
            input = input.replace(/<[^>]*>/g, '');
            // Remover scripts
            input = input.replace(/javascript:/gi, '');
            // Remover caracteres especiais potencialmente perigosos
            input = input.replace(/[<>"'&]/g, function(match) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            });
        }
        
        return input;
    }

    // Função para sanitizar detalhes do log
    sanitizeLogDetails(details) {
        if (!details || typeof details !== 'object') {
            return {};
        }
        
        const sanitizedDetails = {};
        for (const [key, value] of Object.entries(details)) {
            if (typeof value === 'string') {
                sanitizedDetails[key] = this.sanitizeUserData(value);
            } else {
                // Para outros tipos de dados, manter o valor original
                sanitizedDetails[key] = value;
            }
        }
        
        return sanitizedDetails;
    }

    getCurrentAdmin() {
        return this.currentAdmin;
    }
}