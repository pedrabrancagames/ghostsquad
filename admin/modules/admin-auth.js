export class AdminAuthManager {
    constructor(firebase) {
        this.firebase = firebase;
        this.auth = firebase.auth();
        this.database = firebase.database();
        this.currentAdmin = null;
        this.setupAutoLogout();
    }

    async signInWithGoogle() {
        try {
            const provider = new this.firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            const isAdmin = await this.checkAdminPrivileges(user);
            if (!isAdmin) {
                await this.logout();
                throw new Error('USER_NOT_ADMIN');
            }
            await this.loadAdminData(user.uid);
            await this.logAdminAction(user.uid, 'login', {
                email: user.email,
                timestamp: new Date().toISOString()
            });
            return user;
        } catch (error) {
            console.error('Erro na autenticação com Google:', error);
            if (error.message === 'USER_NOT_ADMIN') {
                throw new Error('Acesso negado. Você não tem privilégios administrativos.');
            }
            throw new Error('Falha na autenticação com Google.');
        }
    }

    async checkAdminPrivileges(user) {
        try {
            // To check by email instead of UID, you can change this to:
            // const adminsRef = this.database.ref('admins');
            // const snapshot = await adminsRef.orderByChild('email').equalTo(user.email).once('value');
            // const admins = snapshot.val();
            // return admins !== null;

            const adminRef = this.database.ref(`admins/${user.uid}`);
            const snapshot = await adminRef.once('value');
            return snapshot.exists();
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
        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
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
            }, 30 * 60 * 1000); // 30 minutos
        };
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        resetTimer();
    }

    async logAdminAction(adminId, action, details = {}) {
        try {
            if (!adminId) {
                console.warn('adminId não definido, pulando registro de log');
                return;
            }
            const logEntry = {
                adminId: adminId,
                action: action,
                timestamp: new Date().toISOString(),
                details: details
            };
            if (this.currentAdmin) {
                logEntry.adminEmail = this.currentAdmin.email;
                logEntry.adminName = this.currentAdmin.name;
            }
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                logEntry.ipAddress = ipData.ip;
            } catch (error) {
                console.warn('Não foi possível obter o endereço IP do cliente:', error);
            }
            const logsRef = this.database.ref('auditLogs');
            const newLogRef = logsRef.push();
            await newLogRef.set(logEntry);
        } catch (error) {
            console.error('Erro ao registrar ação administrativa:', error);
        }
    }

    getCurrentAdmin() {
        return this.currentAdmin;
    }
}