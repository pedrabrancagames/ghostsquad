import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

export class AuthManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.auth = null;
        this.database = null;
        this.provider = null;
    }

    initializeApp(firebaseConfig) {
        console.log('Inicializando Firebase com configuração:', firebaseConfig);
        // Initialize Firebase app
        const app = initializeApp(firebaseConfig);
        
        // Get auth and database instances correctly
        this.auth = getAuth(app);
        this.database = getDatabase(app);
        
        console.log('Firebase Auth:', this.auth);
        console.log('Firebase Database:', this.database);
        
        // Set up auth state listener
        onAuthStateChanged(this.auth, (user) => this.onAuthStateChanged(user));
        
        // Atribuir o database ao gameManager principal
        this.gameManager.database = this.database;
        
        return { auth: this.auth, database: this.database };
    }

    async signInWithGoogle() {
        // Verificar se há tentativas excessivas de login recentes
        if (await this.isRateLimitedForUser()) {
            throw new Error('Número excessivo de tentativas de login. Tente novamente mais tarde.');
        }

        // Create provider instance
        this.provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, this.provider);
            
            // Limpar tentativas de login após login bem-sucedido
            await this.clearRateLimitForUser();
            
            return result;
        } catch (error) {
            // Registrar tentativa de login falha
            await this.recordFailedLoginAttempt();
            throw this.handleAuthError(error);
        }
    }

    async signInAsGuest() {
        // Verificar limitação de taxa também para login anônimo
        if (await this.isRateLimitedForUser()) {
            throw new Error('Número excessivo de tentativas de login. Tente novamente mais tarde.');
        }

        try {
            const result = await signInAnonymously(this.auth);
            
            // Limpar tentativas de login após login bem-sucedido
            await this.clearRateLimitForUser();
            
            return result;
        } catch (error) {
            // Registrar tentativa de login falha
            await this.recordFailedLoginAttempt();
            throw this.handleAuthError(error);
        }
    }

    /**
     * Verifica se o usuário está sob limitação de taxa
     * @returns {Promise<boolean>} - True se estiver limitado
     */
    async isRateLimitedForUser() {
        if (!window.sessionStorage) return false;

        const now = Date.now();
        const tenMinutesAgo = now - (10 * 60 * 1000); // 10 minutos em milissegundos
        
        // Recuperar tentativas de login do sessionStorage
        const attemptsStr = window.sessionStorage.getItem('login_attempts');
        if (!attemptsStr) return false;
        
        try {
            const attempts = JSON.parse(attemptsStr);
            // Filtrar tentativas nos últimos 10 minutos
            const recentAttempts = attempts.filter(timestamp => timestamp > tenMinutesAgo);
            
            // Se houver mais de 5 tentativas de login falhas nos últimos 10 minutos
            return recentAttempts.length > 5;
        } catch (error) {
            console.error('Erro ao verificar limitação de taxa:', error);
            return false;
        }
    }

    /**
     * Registra uma tentativa de login falha
     */
    async recordFailedLoginAttempt() {
        if (!window.sessionStorage) return;

        const now = Date.now();
        
        // Recuperar tentativas anteriores
        let attempts = [];
        const attemptsStr = window.sessionStorage.getItem('login_attempts');
        if (attemptsStr) {
            try {
                attempts = JSON.parse(attemptsStr);
            } catch (error) {
                attempts = [];
            }
        }
        
        // Adicionar nova tentativa
        attempts.push(now);
        
        // Manter apenas tentativas dos últimos 10 minutos
        const tenMinutesAgo = now - (10 * 60 * 1000);
        attempts = attempts.filter(timestamp => timestamp > tenMinutesAgo);
        
        // Salvar tentativas atualizadas
        window.sessionStorage.setItem('login_attempts', JSON.stringify(attempts));
    }

    /**
     * Limpa as tentativas de login
     */
    async clearRateLimitForUser() {
        if (window.sessionStorage) {
            window.sessionStorage.removeItem('login_attempts');
        }
    }



    handleAuthError(error) {
        console.error("Authentication Error:", error.code, error.message);
        let errorMessage = 'Ocorreu um erro. Tente novamente.';
        
        switch (error.code) {
        }
        
        // Para erros de login, apenas logamos e não lançamos exceção
        // para que o fluxo da aplicação continue
        console.error("Authentication error handled:", errorMessage);
        return { error: true, message: errorMessage };
    }

    saveUserToDatabase(user) {
        // Sanitizar dados do usuário antes de salvar
        const sanitizedDisplayName = this.sanitizeUserData(user.displayName || 'Caça-Fantasma');
        const sanitizedEmail = user.email ? this.sanitizeUserData(user.email) : null;
        
        const userRef = ref(this.database, 'users/' + user.uid);
        return get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                // Pegar dados existentes e garantir que estão seguros
                const userData = snapshot.val();
                this.gameManager.userStats = userData;
                // Atualizar o inventário do gameState com os dados do banco
                this.gameManager.gameState.inventory = userData.inventory || [];
            } else {
                let displayName = 'Caça-Fantasma';
                if (user.isAnonymous) {
                    displayName = 'Visitante';
                } else if (user.displayName) {
                    displayName = sanitizedDisplayName;
                } else if (user.email) {
                    displayName = sanitizedEmail ? sanitizedEmail.split('@')[0] : 'Caça-Fantasma';
                }

                const newUserStats = { 
                    displayName: displayName, 
                    email: sanitizedEmail, 
                    points: 0, 
                    captures: 0, 
                    level: 1, 
                    inventory: [], 
                    ecto1Unlocked: false 
                };
                return set(userRef, newUserStats).then(() => {
                    this.gameManager.userStats = newUserStats;
                    // Atualizar o inventário do gameState com os dados do banco
                    this.gameManager.gameState.inventory = [];
                });
            }
        }).catch(error => {
            console.error("Erro ao salvar/atualizar usuário no banco de dados:", error);
            throw error;
        });
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

    // Função para validar dados sensíveis antes de salvar
    validateUserData(userData, userId) {
        // Verificar se é um usuário válido
        if (!userId || typeof userId !== 'string' || userId.length === 0) {
            throw new Error('ID de usuário inválido');
        }

        // Validar estrutura dos dados do usuário
        if (!userData || typeof userData !== 'object') {
            throw new Error('Dados de usuário inválidos');
        }

        // Validar campos específicos
        if (userData.displayName && (typeof userData.displayName !== 'string' || userData.displayName.length > 50)) {
            throw new Error('Nome de exibição inválido');
        }

        if (userData.email && (typeof userData.email !== 'string' || !this.isValidEmail(userData.email))) {
            throw new Error('Email inválido');
        }

        if (userData.points !== undefined && (typeof userData.points !== 'number' || userData.points < 0)) {
            throw new Error('Pontos inválidos');
        }

        if (userData.captures !== undefined && (typeof userData.captures !== 'number' || userData.captures < 0)) {
            throw new Error('Número de capturas inválido');
        }

        // Validar inventário
        if (userData.inventory && !Array.isArray(userData.inventory)) {
            throw new Error('Inventário inválido');
        }

        return true;
    }

    // Função para validar formato de email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função para migrar dados de uma conta anônima para uma conta autenticada
    async migrateAnonymousData(user, anonymousUid) {
        try {
            // Obter dados da conta anônima
            const anonymousUserRef = ref(this.database, 'users/' + anonymousUid);
            const anonymousSnapshot = await get(anonymousUserRef);
            
            if (anonymousSnapshot.exists()) {
                const anonymousData = anonymousSnapshot.val();
                
                // Atualizar dados do usuário autenticado com os dados da conta anônima
                const userRef = ref(this.database, 'users/' + user.uid);
                await update(userRef, {
                    points: anonymousData.points || 0,
                    captures: anonymousData.captures || 0,
                    inventory: anonymousData.inventory || [],
                    ecto1Unlocked: anonymousData.ecto1Unlocked || false
                });
                
                // Atualizar dados locais
                this.gameManager.userStats = {
                    ...this.gameManager.userStats,
                    points: anonymousData.points || 0,
                    captures: anonymousData.captures || 0,
                    inventory: anonymousData.inventory || [],
                    ecto1Unlocked: anonymousData.ecto1Unlocked || false
                };
                
                // Atualizar inventário do gameState
                this.gameManager.gameState.inventory = anonymousData.inventory || [];
                this.gameManager.updateInventoryUI();
                
                console.log("Dados migrados com sucesso da conta anônima para a conta autenticada");
            }
        } catch (error) {
            console.error("Erro ao migrar dados da conta anônima:", error);
        }
    }

    onAuthStateChanged(user) {
        if (user) {
            console.log('Usuário autenticado:', user);
            this.gameManager.currentUser = user;
            
            // Armazenar informações da sessão
            this.storeSessionInfo(user);
            
            // Verificar se é uma conta recém-criada a partir de uma conta anônima
            if (!user.isAnonymous && user.metadata.creationTime === user.metadata.lastSignInTime) {
                // Esta é uma conta recém-criada, verificar se temos uma conta anônima para migrar
                const anonymousUid = localStorage.getItem('anonymousUid');
                if (anonymousUid && anonymousUid !== user.uid) {
                    this.migrateAnonymousData(user, anonymousUid).then(() => {
                        // Limpar o ID anônimo do localStorage após a migração
                        localStorage.removeItem('anonymousUid');
                    });
                }
            }
            
            this.saveUserToDatabase(user).then(async () => {
                await this.gameManager.gameState.loadGameConfig();
                this.gameManager.updateInventoryUI();
                
                // Verificar se os elementos existem antes de manipulá-los
                if (this.gameManager.uiManager && this.gameManager.uiManager.loginScreen) {
                    this.gameManager.uiManager.loginScreen.classList.add('hidden');
                }
                if (this.gameManager.uiManager && this.gameManager.uiManager.emailLoginScreen) {
                    this.gameManager.uiManager.emailLoginScreen.classList.add('hidden');
                }
                if (this.gameManager.uiManager && this.gameManager.uiManager.locationScreen) {
                    this.gameManager.uiManager.locationScreen.classList.remove('hidden');
                    // Carregar áreas de caça quando mostrar a tela de localização
                    console.log('Carregando áreas de caça...');
                    this.gameManager.uiManager.loadLocationButtons(this.gameManager);
                }
                
                // Configurar monitoramento de sessão
                this.setupSessionMonitoring();
            }).catch((error) => {
                console.error("Error saving user to database:", error);
            });
        } else {
            console.log('Usuário deslogado');
            this.gameManager.currentUser = null;
            
            // Limpar informações da sessão
            this.clearSessionInfo();
            
            // Verificar se os elementos existem antes de manipulá-los
            if (this.gameManager.uiManager && this.gameManager.uiManager.loginScreen) {
                this.gameManager.uiManager.loginScreen.classList.remove('hidden');
            }
            if (this.gameManager.uiManager && this.gameManager.uiManager.locationScreen) {
                this.gameManager.uiManager.locationScreen.classList.add('hidden');
            }
            if (this.gameManager.uiManager && this.gameManager.uiManager.gameUi) {
                this.gameManager.uiManager.gameUi.classList.add('hidden');
            }
            // Esconder o menu AR se estiver visível
            if (this.gameManager.uiManager && this.gameManager.uiManager.arMenu) {
                this.gameManager.uiManager.arMenu.classList.add('hidden');
            }
        }
    }

    /**
     * Armazena informações da sessão no localStorage
     * @param {Object} user - Objeto de usuário do Firebase
     */
    storeSessionInfo(user) {
        if (window.localStorage) {
            const sessionInfo = {
                userId: user.uid,
                loginTime: Date.now(),
                isAnonymous: user.isAnonymous,
                email: user.email
            };
            localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
        }
    }

    /**
     * Limpa informações da sessão
     */
    clearSessionInfo() {
        if (window.localStorage) {
            localStorage.removeItem('sessionInfo');
            localStorage.removeItem('sessionTimeout');
        }
    }

    /**
     * Configura o monitoramento de sessão
     */
    setupSessionMonitoring() {
        // Configurar verificação periódica de sessão
        this.startSessionCheckInterval();
        
        // Configurar eventos para atualizar atividade
        this.setupActivityMonitoring();
    }

    /**
     * Inicia intervalo de verificação de sessão
     */
    startSessionCheckInterval() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
        
        this.sessionCheckInterval = setInterval(() => {
            this.checkSessionStatus();
        }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    }

    /**
     * Configura monitoramento de atividade do usuário
     */
    setupActivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, true);
        });
        
        window.addEventListener('focus', () => {
            this.updateLastActivity();
        });
    }

    /**
     * Atualiza o tempo da última atividade
     */
    updateLastActivity() {
        if (window.localStorage) {
            localStorage.setItem('lastActivity', Date.now().toString());
        }
    }

    /**
     * Verifica o status da sessão
     */
    async checkSessionStatus() {
        if (!this.gameManager.currentUser) {
            return; // Usuário não está logado
        }

        try {
            // Verificar se o token ainda é válido
            const token = await this.gameManager.currentUser.getIdTokenResult();
            const expirationTime = new Date(token.expirationTime).getTime();
            const now = Date.now();
            
            // Se o token expira em menos de 10 minutos, renovar
            if (expirationTime - now < 10 * 60 * 1000) {
                await this.gameManager.currentUser.getIdToken(true);
                console.log('Token de autenticação renovado');
            }
            
            // Verificar tempo de inatividade (ex: 30 minutos)
            if (window.localStorage) {
                const lastActivity = localStorage.getItem('lastActivity');
                if (lastActivity) {
                    const inactiveTime = Date.now() - parseInt(lastActivity);
                    const maxInactiveTime = 30 * 60 * 1000; // 30 minutos
                    
                    if (inactiveTime > maxInactiveTime) {
                        console.log('Sessão expirada por inatividade');
                        // Opcional: exibir aviso antes de deslogar
                        if (confirm('Sua sessão expirou por inatividade. Deseja continuar logado?')) {
                            this.updateLastActivity();
                        } else {
                            this.auth.signOut();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status da sessão:', error);
        }
    }
}