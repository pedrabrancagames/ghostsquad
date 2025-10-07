/**
 * @jest-environment jsdom
 */

// Mock do Firebase Auth
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js", () => {
    return {
        __esModule: true,
        getAuth: jest.fn(() => ({})),
        signInWithEmailAndPassword: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChanged: jest.fn()
    };
}, { virtual: true });

// Mock do Firebase Database
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js", () => {
    return {
        __esModule: true,
        getDatabase: jest.fn(() => ({})),
        ref: jest.fn(),
        once: jest.fn(),
        update: jest.fn(),
        push: jest.fn(() => ({
            set: jest.fn(),
            key: 'test-log-key'
        }))
    };
}, { virtual: true });

// Mock do fetch para IP
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ ip: '192.168.1.1' })
    })
);

import { AdminAuthManager } from '../../admin/modules/admin-auth.js';

describe('AdminAuthManager', () => {
    let adminAuthManager;
    let mockFirebase;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configurar mock do Firebase
        mockFirebase = {
            auth: jest.fn(() => ({})),
            database: jest.fn(() => ({}))
        };
        
        // Criar instância do AdminAuthManager
        adminAuthManager = new AdminAuthManager(mockFirebase);
    });

    describe('authenticateAdmin', () => {
        it('deve autenticar um administrador com credenciais válidas', async () => {
            // Importar funções mockadas
            const { signInWithEmailAndPassword } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            const { ref, once } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUser = { uid: 'admin123', email: 'admin@example.com' };
            signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            
            const mockAdminData = { email: 'admin@example.com', name: 'Admin Test', role: 'admin' };
            once.mockResolvedValue({
                val: () => ({ 'admin123': mockAdminData }),
                exists: () => true
            });
            
            ref.mockReturnValue({});
            
            // Executar método
            const result = await adminAuthManager.authenticateAdmin('admin@example.com', 'password123');
            
            // Verificar resultados
            expect(result).toEqual(mockUser);
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
                adminAuthManager.auth,
                'admin@example.com',
                'password123'
            );
            expect(adminAuthManager.currentAdmin).toEqual(mockAdminData);
        });

        it('deve lançar erro para usuário não administrador', async () => {
            // Importar funções mockadas
            const { signInWithEmailAndPassword } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            const { ref, once } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUser = { uid: 'user123', email: 'user@example.com' };
            signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            
            once.mockResolvedValue({
                val: () => ({}), // Nenhum administrador encontrado
                exists: () => true
            });
            
            ref.mockReturnValue({});
            
            // Executar método e verificar erro
            await expect(adminAuthManager.authenticateAdmin('user@example.com', 'password123'))
                .rejects.toThrow('Acesso negado. Você não tem privilégios administrativos.');
        });
    });

    describe('checkAdminPrivileges', () => {
        it('deve retornar true para usuário na lista de administradores', async () => {
            // Importar funções mockadas
            const { ref, once } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUser = { uid: 'admin123' };
            once.mockResolvedValue({
                val: () => ({ 'admin123': { role: 'admin' } }),
                exists: () => true
            });
            
            ref.mockReturnValue({});
            
            // Executar método
            const result = await adminAuthManager.checkAdminPrivileges(mockUser);
            
            // Verificar resultado
            expect(result).toBe(true);
        });

        it('deve retornar false para usuário não administrador', async () => {
            // Importar funções mockadas
            const { ref, once } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUser = { uid: 'user123' };
            once.mockResolvedValue({
                val: () => ({ 'admin123': { role: 'admin' } }), // Administrador diferente
                exists: () => true
            });
            
            ref.mockReturnValue({});
            
            // Executar método
            const result = await adminAuthManager.checkAdminPrivileges(mockUser);
            
            // Verificar resultado
            expect(result).toBe(false);
        });
    });

    describe('hasPermission', () => {
        it('deve retornar true para administrador superadmin', () => {
            // Configurar administrador superadmin
            adminAuthManager.currentAdmin = { role: 'superadmin', permissions: [] };
            
            // Executar método
            const result = adminAuthManager.hasPermission('users.manage');
            
            // Verificar resultado
            expect(result).toBe(true);
        });

        it('deve retornar true se administrador tem a permissão', () => {
            // Configurar administrador com permissões
            adminAuthManager.currentAdmin = { 
                role: 'admin', 
                permissions: ['users.manage', 'stats.view'] 
            };
            
            // Executar método
            const result = adminAuthManager.hasPermission('users.manage');
            
            // Verificar resultado
            expect(result).toBe(true);
        });

        it('deve retornar false se administrador não tem a permissão', () => {
            // Configurar administrador com permissões
            adminAuthManager.currentAdmin = { 
                role: 'admin', 
                permissions: ['stats.view'] 
            };
            
            // Executar método
            const result = adminAuthManager.hasPermission('users.manage');
            
            // Verificar resultado
            expect(result).toBe(false);
        });
    });

    describe('logout', () => {
        it('deve fazer logout do administrador', async () => {
            // Importar funções mockadas
            const { signOut } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            
            // Configurar retornos dos mocks
            signOut.mockResolvedValue();
            
            // Configurar administrador logado
            adminAuthManager.currentAdmin = { uid: 'admin123' };
            
            // Executar método
            await adminAuthManager.logout();
            
            // Verificar resultados
            expect(signOut).toHaveBeenCalledWith(adminAuthManager.auth);
            expect(adminAuthManager.currentAdmin).toBeNull();
        });
    });
});