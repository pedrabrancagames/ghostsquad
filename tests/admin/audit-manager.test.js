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
                remove: jest.fn(),
                set: jest.fn()
            })),
            update: jest.fn(),
            push: jest.fn(() => ({
                set: jest.fn(),
                key: 'test-key'
            })),
            orderByChild: jest.fn(() => ({
                limitToLast: jest.fn(() => ({
                    once: jest.fn()
                })),
                once: jest.fn()
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

import { AuditManager } from '../../admin/modules/audit-manager.js';

describe('AuditManager', () => {
    let auditManager;
    let mockDatabase;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configurar mock do Database
        mockDatabase = {};
        
        // Criar instância do AuditManager
        auditManager = new AuditManager(mockDatabase);
    });

    describe('logAction', () => {
        it('deve registrar uma ação administrativa', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockPushRef = {
                set: jest.fn().mockResolvedValue(),
                key: 'audit-log-123'
            };
            
            const mockRef = {
                push: jest.fn(() => mockPushRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await auditManager.logAction('admin123', 'ban_user', { 
                targetUserId: 'user456', 
                reason: 'Violação das regras' 
            });
            
            // Verificar resultados
            expect(result).toBe('audit-log-123');
            expect(mockRef.push).toHaveBeenCalled();
            expect(mockPushRef.set).toHaveBeenCalledWith({
                adminId: 'admin123',
                action: 'ban_user',
                timestamp: expect.any(String),
                details: { 
                    targetUserId: 'user456', 
                    reason: 'Violação das regras' 
                }
            });
        });
    });

    describe('getAuditLogs', () => {
        it('deve retornar logs de auditoria com filtros', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockLogs = {
                'log1': {
                    adminId: 'admin123',
                    action: 'ban_user',
                    timestamp: '2023-01-01T10:00:00Z',
                    details: { targetUserId: 'user456' }
                },
                'log2': {
                    adminId: 'admin123',
                    action: 'edit_user_points',
                    timestamp: '2023-01-01T11:00:00Z',
                    details: { targetUserId: 'user789' }
                },
                'log3': {
                    adminId: 'admin456',
                    action: 'login',
                    timestamp: '2023-01-01T12:00:00Z',
                    details: {}
                }
            };
            
            // Configurar retornos dos mocks
            const mockQuery = {
                once: jest.fn().mockResolvedValue({
                    forEach: (callback) => {
                        Object.entries(mockLogs).forEach(([key, value]) => {
                            callback({
                                key: key,
                                val: () => value
                            });
                        });
                    }
                })
            };
            
            const mockOrderedRef = {
                limitToLast: jest.fn(() => mockQuery)
            };
            
            const mockRef = {
                orderByChild: jest.fn(() => mockOrderedRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método com filtros
            const result = await auditManager.getAuditLogs({
                adminId: 'admin123',
                action: 'ban_user'
            }, 50);
            
            // Verificar resultados
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('log1');
            expect(result[0].adminId).toBe('admin123');
            expect(result[0].action).toBe('ban_user');
        });

        it('deve ordenar logs por timestamp decrescente', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockLogs = {
                'log1': {
                    adminId: 'admin123',
                    action: 'ban_user',
                    timestamp: '2023-01-01T10:00:00Z',
                    details: { targetUserId: 'user456' }
                },
                'log2': {
                    adminId: 'admin123',
                    action: 'edit_user_points',
                    timestamp: '2023-01-01T11:00:00Z',
                    details: { targetUserId: 'user789' }
                }
            };
            
            // Configurar retornos dos mocks
            const mockQuery = {
                once: jest.fn().mockResolvedValue({
                    forEach: (callback) => {
                        Object.entries(mockLogs).forEach(([key, value]) => {
                            callback({
                                key: key,
                                val: () => value
                            });
                        });
                    }
                })
            };
            
            const mockOrderedRef = {
                limitToLast: jest.fn(() => mockQuery)
            };
            
            const mockRef = {
                orderByChild: jest.fn(() => mockOrderedRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await auditManager.getAuditLogs({}, 50);
            
            // Verificar resultados (deve estar ordenado por timestamp decrescente)
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('log2'); // Mais recente primeiro
            expect(result[1].id).toBe('log1');
        });
    });

    describe('getSystemLogs', () => {
        it('deve retornar logs do sistema', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockLogs = {
                'syslog1': {
                    type: 'error',
                    message: 'Database connection failed',
                    timestamp: '2023-01-01T10:00:00Z',
                    context: { errorCode: 500 }
                },
                'syslog2': {
                    type: 'warning',
                    message: 'High memory usage',
                    timestamp: '2023-01-01T11:00:00Z',
                    context: { usage: '85%' }
                }
            };
            
            // Configurar retornos dos mocks
            const mockQuery = {
                once: jest.fn().mockResolvedValue({
                    forEach: (callback) => {
                        Object.entries(mockLogs).forEach(([key, value]) => {
                            callback({
                                key: key,
                                val: () => value
                            });
                        });
                    }
                })
            };
            
            const mockOrderedRef = {
                limitToLast: jest.fn(() => mockQuery)
            };
            
            const mockRef = {
                orderByChild: jest.fn(() => mockOrderedRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'systemLogs') {
                    return mockRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar método
            const result = await auditManager.getSystemLogs(50);
            
            // Verificar resultados
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('syslog2'); // Mais recente primeiro
            expect(result[1].id).toBe('syslog1');
        });
    });

    describe('getActiveAdmins', () => {
        it('deve retornar administradores ativos', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockAdmins = {
                'admin123': {
                    email: 'admin1@example.com',
                    name: 'Admin One',
                    lastLogin: new Date().toISOString() // Login recente
                },
                'admin456': {
                    email: 'admin2@example.com',
                    name: 'Admin Two',
                    lastLogin: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hora atrás
                },
                'admin789': {
                    email: 'admin3@example.com',
                    name: 'Admin Three',
                    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 horas atrás
                }
            };
            
            // Configurar retornos dos mocks
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockAdmins
                })
            };
            
            ref.mockImplementation((path) => {
                if (path === 'admins') {
                    return mockRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar método
            const result = await auditManager.getActiveAdmins(30); // Últimos 30 minutos
            
            // Verificar resultados
            expect(result).toHaveLength(3); // Todos estão ativos nos últimos 30 minutos
            expect(result[0].id).toBe('admin123');
            expect(result[1].id).toBe('admin456');
            expect(result[2].id).toBe('admin789');
        });
    });

    describe('logSystemError', () => {
        it('deve registrar um erro do sistema', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockRef = {
                push: jest.fn(() => mockPushRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'systemLogs') {
                    return mockRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar método
            await auditManager.logSystemError(
                'Database connection failed', 
                { code: 500, message: 'Connection timeout' }, 
                { component: 'DatabaseManager' }
            );
            
            // Verificar resultados
            expect(mockRef.push).toHaveBeenCalled();
            expect(mockPushRef.set).toHaveBeenCalledWith({
                type: 'error',
                message: 'Database connection failed',
                error: { code: 500, message: 'Connection timeout' },
                context: { component: 'DatabaseManager' },
                timestamp: expect.any(String)
            });
        });
    });
});