/**
 * @jest-environment jsdom
 */

// Mock do Firebase Database
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js", () => {
    return {
        __esModule: true,
        getDatabase: jest.fn(() => ({})),
        ref: jest.fn(() => ({
            once: jest.fn(),
            child: jest.fn(() => ({
                once: jest.fn(),
                update: jest.fn(),
                remove: jest.fn()
            })),
            update: jest.fn(),
            push: jest.fn(() => ({
                set: jest.fn(),
                key: 'test-key'
            }))
        })),
        once: jest.fn(),
        update: jest.fn(),
        push: jest.fn(() => ({
            set: jest.fn(),
            key: 'test-key'
        }))
    };
}, { virtual: true });

import { UserManager } from '../../admin/modules/user-manager.js';

describe('UserManager', () => {
    let userManager;
    let mockDatabase;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configurar mock do Database
        mockDatabase = {};
        
        // Criar instância do UserManager
        userManager = new UserManager(mockDatabase);
    });

    describe('getAllUsers', () => {
        it('deve retornar lista de usuários paginada', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUsers = {
                'user1': { 
                    uid: 'user1', 
                    displayName: 'User One', 
                    email: 'user1@example.com',
                    createdAt: '2023-01-01T00:00:00Z'
                },
                'user2': { 
                    uid: 'user2', 
                    displayName: 'User Two', 
                    email: 'user2@example.com',
                    createdAt: '2023-01-02T00:00:00Z'
                }
            };
            
            // Mock da referência e do método once
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await userManager.getAllUsers(1, 1);
            
            // Verificar resultados
            expect(result.users).toHaveLength(1);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.pages).toBe(2);
            expect(result.users[0].uid).toBe('user2'); // Mais recente primeiro
        });

        it('deve retornar objeto vazio se não houver usuários', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => null
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await userManager.getAllUsers(1, 10);
            
            // Verificar resultados
            expect(result.users).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.page).toBe(1);
            expect(result.pages).toBe(0);
        });
    });

    describe('getUserById', () => {
        it('deve retornar dados do usuário quando encontrado', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUserData = { 
                displayName: 'User One', 
                email: 'user1@example.com'
            };
            
            const mockChildRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUserData
                })
            };
            
            const mockRef = {
                child: jest.fn(() => mockChildRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await userManager.getUserById('user1');
            
            // Verificar resultados
            expect(result).toEqual({
                uid: 'user1',
                ...mockUserData
            });
        });

        it('deve retornar null quando usuário não encontrado', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockChildRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => null
                })
            };
            
            const mockRef = {
                child: jest.fn(() => mockChildRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await userManager.getUserById('user1');
            
            // Verificar resultados
            expect(result).toBeNull();
        });
    });

    describe('updateUserPoints', () => {
        it('deve atualizar pontos do usuário', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockChildRef = {
                update: jest.fn().mockResolvedValue()
            };
            
            const mockRef = {
                child: jest.fn(() => mockChildRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            await userManager.updateUserPoints('user1', 100);
            
            // Verificar resultados
            expect(mockRef.child).toHaveBeenCalledWith('user1');
            expect(mockChildRef.update).toHaveBeenCalledWith({ points: 100 });
        });
    });

    describe('banUser', () => {
        it('deve banir usuário com motivo', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockChildRef = {
                update: jest.fn().mockResolvedValue()
            };
            
            const mockRef = {
                child: jest.fn(() => mockChildRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            await userManager.banUser('user1', 'Violação das regras');
            
            // Verificar resultados
            expect(mockRef.child).toHaveBeenCalledWith('user1');
            expect(mockChildRef.update).toHaveBeenCalledWith({
                status: 'banned',
                banReason: 'Violação das regras',
                bannedAt: expect.any(String)
            });
        });
    });

    describe('searchUsers', () => {
        it('deve buscar usuários pelo nome', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUsers = {
                'user1': { displayName: 'John Doe', email: 'john@example.com' },
                'user2': { displayName: 'Jane Smith', email: 'jane@example.com' },
                'user3': { displayName: 'John Smith', email: 'johnsmith@example.com' }
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await userManager.searchUsers('John', 'displayName');
            
            // Verificar resultados
            expect(result).toHaveLength(2);
            expect(result[0].uid).toBe('user1');
            expect(result[1].uid).toBe('user3');
        });
    });

    describe('exportUserData', () => {
        it('deve exportar dados dos usuários em JSON', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUsers = {
                'user1': { displayName: 'John Doe', email: 'john@example.com' }
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await userManager.exportUserData('json');
            
            // Verificar resultados
            expect(result).toBe(JSON.stringify(mockUsers, null, 2));
        });
    });
});