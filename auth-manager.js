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

    signInWithGoogle() {
        // Create provider instance
        this.provider = new GoogleAuthProvider();
        return signInWithPopup(this.auth, this.provider)
            .catch((error) => this.handleAuthError(error));
    }

    signInAsGuest() {
        return signInAnonymously(this.auth)
            .catch((error) => this.handleAuthError(error));
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
        const userRef = ref(this.database, 'users/' + user.uid);
        return get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                this.gameManager.userStats = snapshot.val();
                // Atualizar o inventário do gameState com os dados do banco
                this.gameManager.gameState.inventory = this.gameManager.userStats.inventory || [];
            } else {
                let displayName = 'Caça-Fantasma';
                if (user.isAnonymous) {
                    displayName = 'Visitante';
                } else if (user.displayName) {
                    displayName = user.displayName;
                } else if (user.email) {
                    displayName = user.email.split('@')[0];
                }

                const newUserStats = { 
                    displayName: displayName, 
                    email: user.email, 
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
                    
                    // Adicionar o novo usuário ao ranking imediatamente
                    if (this.gameManager.database) {
                        const rankRef = ref(this.gameManager.database, 'rankings/' + user.uid);
                        set(rankRef, {
                            displayName: displayName,
                            points: 0,
                            captures: 0
                        }).then(() => {
                            console.log('Novo usuário adicionado ao ranking:', user.uid);
                        }).catch((error) => {
                            console.error('Erro ao adicionar novo usuário ao ranking:', error);
                        });
                    }
                });
            }
        });
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
            }).catch((error) => {
                console.error("Error saving user to database:", error);
            });
        } else {
            console.log('Usuário deslogado');
            this.gameManager.currentUser = null;
            
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
}