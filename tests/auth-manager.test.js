/**
 * @jest-environment jsdom
 */

// Mock completo do módulo firebase-auth.js
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js", () => {
    return {
        __esModule: true,
        getAuth: jest.fn(() => ({})),
        GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
        signInWithPopup: jest.fn(),
        onAuthStateChanged: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        createUserWithEmailAndPassword: jest.fn()
    };
}, { virtual: true });

// Mock completo do módulo firebase-database.js
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js", () => {
    return {
        __esModule: true,
        getDatabase: jest.fn(() => ({})),
        ref: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
    };
}, { virtual: true });

import { AuthManager } from '../auth-manager.js';

describe('AuthManager', () => {
    let authManager;
    let mockGameManager;

    beforeEach(() => {
        // Criar um mock do gameManager
        mockGameManager = {
            userStats: {},
            inventory: [],
            updateInventoryUI: jest.fn(),
            loginScreen: { classList: { add: jest.fn(), remove: jest.fn() } },
            emailLoginScreen: { classList: { add: jest.fn(), remove: jest.fn() } },
            locationScreen: { classList: { add: jest.fn(), remove: jest.fn() } },
            gameUi: { classList: { add: jest.fn() } }
        };

        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
    });

    describe('initializeApp', () => {
        it('deve inicializar o auth e database', () => {
            const firebaseConfig = {};
            
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const result = authManager.initializeApp(firebaseConfig);
            
            expect(result.auth).toBeDefined();
            expect(result.database).toBeDefined();
            expect(result.provider).toBeDefined();
        });
    });

    describe('signInWithGoogle', () => {
        it('deve chamar signInWithPopup com o provider correto', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockAuth = {};
            authManager.auth = mockAuth;
            authManager.provider = {}; // Instanciar o provider
            
            // Importar a função mockada
            const { signInWithPopup } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            signInWithPopup.mockResolvedValue({});
            
            await authManager.signInWithGoogle();
            
            expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, authManager.provider);
        });
    });

    describe('signInAsGuest', () => {
        it('deve chamar signInAnonymously', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockAuth = {};
            authManager.auth = mockAuth;
            
            // Importar a função mockada
            const { signInAnonymously } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            signInAnonymously.mockResolvedValue({});
            
            await authManager.signInAsGuest();
            
            expect(signInAnonymously).toHaveBeenCalledWith(mockAuth);
        });
    });

    describe('signInWithEmail', () => {
        it('deve lançar um erro se email ou senha estiverem vazios', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            expect(() => authManager.signInWithEmail('', 'password'))
                .toThrow('Por favor, preencha todos os campos.');
                
            expect(() => authManager.signInWithEmail('email@example.com', ''))
                .toThrow('Por favor, preencha todos os campos.');
        });

        it('deve chamar signInWithEmailAndPassword com email e senha corretos', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockAuth = {};
            authManager.auth = mockAuth;
            const email = 'email@example.com';
            const password = 'password123';
            
            // Importar a função mockada
            const { signInWithEmailAndPassword } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            signInWithEmailAndPassword.mockResolvedValue({});
            
            await authManager.signInWithEmail(email, password);
            
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, email, password);
        });
    });

    describe('signUpWithEmail', () => {
        it('deve lançar um erro se email ou senha estiverem vazios', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            expect(() => authManager.signUpWithEmail('', 'password'))
                .toThrow('Por favor, preencha todos os campos.');
                
            expect(() => authManager.signUpWithEmail('email@example.com', ''))
                .toThrow('Por favor, preencha todos os campos.');
        });

        it('deve chamar createUserWithEmailAndPassword com email e senha corretos', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockAuth = {};
            authManager.auth = mockAuth;
            const email = 'email@example.com';
            const password = 'password123';
            
            // Importar a função mockada
            const { createUserWithEmailAndPassword } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            createUserWithEmailAndPassword.mockResolvedValue({});
            
            await authManager.signUpWithEmail(email, password);
            
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, email, password);
        });
    });

    describe('handleAuthError', () => {
        it('deve retornar mensagem de erro correta para auth/user-not-found', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const error = { code: 'auth/user-not-found', message: 'Usuário não encontrado' };
            
            expect(() => authManager.handleAuthError(error))
                .toThrow('Email ou senha inválidos.');
        });

        it('deve retornar mensagem de erro correta para auth/wrong-password', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const error = { code: 'auth/wrong-password', message: 'Senha incorreta' };
            
            expect(() => authManager.handleAuthError(error))
                .toThrow('Email ou senha inválidos.');
        });

        it('deve retornar mensagem de erro correta para auth/invalid-email', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const error = { code: 'auth/invalid-email', message: 'Email inválido' };
            
            expect(() => authManager.handleAuthError(error))
                .toThrow('O formato do email é inválido.');
        });

        it('deve retornar mensagem de erro correta para auth/email-already-in-use', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const error = { code: 'auth/email-already-in-use', message: 'Email em uso' };
            
            expect(() => authManager.handleAuthError(error))
                .toThrow('Este email já está em uso.');
        });

        it('deve retornar mensagem de erro correta para auth/weak-password', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const error = { code: 'auth/weak-password', message: 'Senha fraca' };
            
            expect(() => authManager.handleAuthError(error))
                .toThrow('A senha deve ter pelo menos 6 caracteres.');
        });

        it('deve retornar mensagem de erro padrão para códigos desconhecidos', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const error = { code: 'auth/unknown-error', message: 'Erro desconhecido' };
            
            expect(() => authManager.handleAuthError(error))
                .toThrow('Ocorreu um erro. Tente novamente.');
        });
    });

    describe('saveUserToDatabase', () => {
        it('deve carregar dados do usuário existente', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockUser = { uid: '123' };
            const mockSnapshot = {
                exists: () => true,
                val: () => ({ points: 100, captures: 5, inventory: [] })
            };
            
            // Importar as funções mockadas
            const { ref, get } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            ref.mockReturnValue({});
            get.mockResolvedValue(mockSnapshot);
            
            await authManager.saveUserToDatabase(mockUser);
            
            expect(mockGameManager.userStats.points).toBe(100);
            expect(mockGameManager.userStats.captures).toBe(5);
            expect(mockGameManager.inventory).toEqual([]);
        });

        it('deve criar novo usuário com dados padrão', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockUser = { 
                uid: '123', 
                isAnonymous: false, 
                displayName: 'Test User',
                email: 'test@example.com'
            };
            const mockSnapshot = {
                exists: () => false
            };
            
            // Importar as funções mockadas
            const { ref, get, set } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            ref.mockReturnValue({});
            get.mockResolvedValue(mockSnapshot);
            set.mockResolvedValue();
            
            await authManager.saveUserToDatabase(mockUser);
            
            expect(mockGameManager.userStats.displayName).toBe('Test User');
            expect(mockGameManager.userStats.email).toBe('test@example.com');
            expect(mockGameManager.userStats.points).toBe(0);
            expect(mockGameManager.userStats.captures).toBe(0);
            expect(mockGameManager.userStats.level).toBe(1);
            expect(mockGameManager.inventory).toEqual([]);
        });
    });

    describe('onAuthStateChanged', () => {
        it('deve atualizar o estado do jogo quando usuário está logado', async () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            const mockUser = { uid: '123' };
            const mockSnapshot = {
                exists: () => true,
                val: () => ({ points: 100, captures: 5, inventory: [] })
            };
            
            // Importar as funções mockadas
            const { ref, get } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            ref.mockReturnValue({});
            get.mockResolvedValue(mockSnapshot);
            
            await authManager.onAuthStateChanged(mockUser);
            
            // Esperar que o processo assíncrono tenha terminado
            await Promise.resolve();
            
            expect(mockGameManager.currentUser).toBe(mockUser);
            expect(mockGameManager.loginScreen.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockGameManager.locationScreen.classList.remove).toHaveBeenCalledWith('hidden');
        });

        it('deve resetar o estado do jogo quando usuário está deslogado', () => {
            // Criar uma instância do AuthManager dentro do teste
            authManager = new AuthManager(mockGameManager);
            
            authManager.onAuthStateChanged(null);
            
            expect(mockGameManager.currentUser).toBeNull();
            expect(mockGameManager.loginScreen.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockGameManager.locationScreen.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockGameManager.gameUi.classList.add).toHaveBeenCalledWith('hidden');
        });
    });
});