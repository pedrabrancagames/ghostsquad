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

// Mock do fetch para IP
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ ip: '192.168.1.1' })
    })
);

import { AdminAuthManager } from '../../admin/modules/admin-auth.js';
import { UserManager } from '../../admin/modules/user-manager.js';
import { StatsManager } from '../../admin/modules/stats-manager.js';
import { ConfigManager } from '../../admin/modules/config-manager.js';
import { AuditManager } from '../../admin/modules/audit-manager.js';

describe('Admin Integration Tests', () => {
    let adminAuthManager;
    let userManager;
    let statsManager;
    let configManager;
    let auditManager;
    let mockFirebase;
    let mockDatabase;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configurar mocks
        mockFirebase = {};
        mockDatabase = {};
        
        // Criar instâncias dos managers
        adminAuthManager = new AdminAuthManager(mockFirebase);
        userManager = new UserManager(mockDatabase);
        statsManager = new StatsManager(mockDatabase);
        configManager = new ConfigManager(mockDatabase);
        auditManager = new AuditManager(mockDatabase);
    });

    describe('Authentication Flow', () => {
        it('deve autenticar administrador e carregar seus dados', async () => {
            // Importar funções mockadas
            const { signInWithEmailAndPassword } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUser = { uid: 'admin123', email: 'admin@example.com' };
            signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            
            const mockAdmins = {
                'admin123': { 
                    email: 'admin@example.com', 
                    name: 'Admin Test', 
                    role: 'admin',
                    permissions: ['users.manage', 'stats.view']
                }
            };
            
            const mockAdminsRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockAdmins
                })
            };
            
            const mockAdminRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockAdmins['admin123']
                }),
                update: jest.fn().mockResolvedValue()
            };
            
            ref.mockImplementation((path) => {
                if (path === 'admins') {
                    return mockAdminsRef;
                }
                if (path === `admins/${mockUser.uid}`) {
                    return mockAdminRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar fluxo de autenticação
            const authenticatedUser = await adminAuthManager.authenticateAdmin('admin@example.com', 'password123');
            
            // Verificar resultados
            expect(authenticatedUser).toEqual(mockUser);
            expect(adminAuthManager.currentAdmin).toEqual(mockAdmins['admin123']);
            
            // Verificar que os dados do administrador foram atualizados
            expect(mockAdminRef.update).toHaveBeenCalledWith({
                lastLogin: expect.any(String)
            });
        });

        it('deve registrar ação de login no log de auditoria', async () => {
            // Importar funções mockadas
            const { signInWithEmailAndPassword } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockUser = { uid: 'admin123', email: 'admin@example.com' };
            signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
            
            const mockAdmins = {
                'admin123': { 
                    email: 'admin@example.com', 
                    name: 'Admin Test', 
                    role: 'admin'
                }
            };
            
            const mockAdminsRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockAdmins
                })
            };
            
            const mockAdminRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockAdmins['admin123']
                }),
                update: jest.fn().mockResolvedValue()
            };
            
            const mockAuditPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockAuditRef = {
                push: jest.fn(() => mockAuditPushRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'admins') {
                    return mockAdminsRef;
                }
                if (path === `admins/${mockUser.uid}`) {
                    return mockAdminRef;
                }
                if (path === 'auditLogs') {
                    return mockAuditRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar fluxo de autenticação
            await adminAuthManager.authenticateAdmin('admin@example.com', 'password123');
            
            // Verificar que a ação foi registrada no log de auditoria
            expect(mockAuditRef.push).toHaveBeenCalled();
            expect(mockAuditPushRef.set).toHaveBeenCalledWith({
                adminId: 'admin123',
                action: 'login',
                timestamp: expect.any(String),
                details: {
                    email: 'admin@example.com',
                    timestamp: expect.any(String)
                }
            });
        });
    });

    describe('User Management Flow', () => {
        it('deve banir usuário e registrar ação no log de auditoria', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar administrador atual
            adminAuthManager.currentAdmin = { uid: 'admin123', email: 'admin@example.com' };
            
            // Configurar retornos dos mocks
            const mockUserRef = {
                update: jest.fn().mockResolvedValue()
            };
            
            const mockAuditPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockAuditRef = {
                push: jest.fn(() => mockAuditPushRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'users/user456') {
                    return mockUserRef;
                }
                if (path === 'auditLogs') {
                    return mockAuditRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar ação de banir usuário
            await userManager.banUser('user456', 'Violação das regras');
            
            // Verificar que o usuário foi banido
            expect(mockUserRef.update).toHaveBeenCalledWith({
                status: 'banned',
                banReason: 'Violação das regras',
                bannedAt: expect.any(String)
            });
            
            // Verificar que a ação foi registrada no log de auditoria
            expect(mockAuditRef.push).toHaveBeenCalled();
            expect(mockAuditPushRef.set).toHaveBeenCalledWith({
                adminId: 'admin123',
                action: 'ban_user',
                timestamp: expect.any(String),
                details: {
                    targetUserId: 'user456',
                    reason: 'Violação das regras'
                }
            });
        });

        it('deve atualizar pontos do usuário e registrar ação no log de auditoria', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar administrador atual
            adminAuthManager.currentAdmin = { uid: 'admin123', email: 'admin@example.com' };
            
            // Configurar retornos dos mocks
            const mockUserRef = {
                update: jest.fn().mockResolvedValue()
            };
            
            const mockAuditPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockAuditRef = {
                push: jest.fn(() => mockAuditPushRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'users/user456') {
                    return mockUserRef;
                }
                if (path === 'auditLogs') {
                    return mockAuditRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar ação de atualizar pontos do usuário
            await userManager.updateUserPoints('user456', 500);
            
            // Verificar que os pontos do usuário foram atualizados
            expect(mockUserRef.update).toHaveBeenCalledWith({
                points: 500
            });
            
            // Verificar que a ação foi registrada no log de auditoria
            expect(mockAuditRef.push).toHaveBeenCalled();
            expect(mockAuditPushRef.set).toHaveBeenCalledWith({
                adminId: 'admin123',
                action: 'edit_user_points',
                timestamp: expect.any(String),
                details: {
                    targetUserId: 'user456',
                    oldPoints: 0,
                    newPoints: 500
                }
            });
        });
    });

    describe('Configuration Management Flow', () => {
        it('deve atualizar configurações do jogo e registrar ação no log de auditoria', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar administrador atual
            adminAuthManager.currentAdmin = { uid: 'admin123', email: 'admin@example.com' };
            
            // Configurar retornos dos mocks
            const mockConfigRef = {
                update: jest.fn().mockResolvedValue()
            };
            
            const mockAuditPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockAuditRef = {
                push: jest.fn(() => mockAuditPushRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'gameConfig') {
                    return mockConfigRef;
                }
                if (path === 'auditLogs') {
                    return mockAuditRef;
                }
                return { once: jest.fn() };
            });
            
            // Configurar novas configurações
            const newConfig = {
                ghostPoints: { common: 20, strong: 100 },
                inventoryLimit: 15
            };
            
            // Executar ação de atualizar configurações
            await configManager.updateGameConfig(newConfig);
            
            // Verificar que as configurações foram atualizadas
            expect(mockConfigRef.update).toHaveBeenCalledWith(newConfig);
            
            // Verificar que a ação foi registrada no log de auditoria
            expect(mockAuditRef.push).toHaveBeenCalled();
            expect(mockAuditPushRef.set).toHaveBeenCalledWith({
                adminId: 'admin123',
                action: 'update_game_config',
                timestamp: expect.any(String),
                details: {
                    config: newConfig
                }
            });
        });

        it('deve adicionar localização e registrar ação no log de auditoria', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar administrador atual
            adminAuthManager.currentAdmin = { uid: 'admin123', email: 'admin@example.com' };
            
            // Configurar retornos dos mocks
            const mockPushRef = {
                set: jest.fn().mockResolvedValue(),
                key: 'new-location-id'
            };
            
            const mockLocationsRef = {
                push: jest.fn(() => mockPushRef)
            };
            
            const mockAuditPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockAuditRef = {
                push: jest.fn(() => mockAuditPushRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'locations') {
                    return mockLocationsRef;
                }
                if (path === 'auditLogs') {
                    return mockAuditRef;
                }
                return { once: jest.fn() };
            });
            
            // Configurar nova localização
            const newLocation = {
                name: 'New Ghost Location',
                lat: -23.550520,
                lon: -46.633308,
                active: true
            };
            
            // Executar ação de adicionar localização
            const locationId = await configManager.addLocation(newLocation);
            
            // Verificar que a localização foi adicionada
            expect(locationId).toBe('new-location-id');
            expect(mockPushRef.set).toHaveBeenCalledWith(newLocation);
            
            // Verificar que a ação foi registrada no log de auditoria
            expect(mockAuditRef.push).toHaveBeenCalled();
            expect(mockAuditPushRef.set).toHaveBeenCalledWith({
                adminId: 'admin123',
                action: 'add_location',
                timestamp: expect.any(String),
                details: {
                    locationId: 'new-location-id',
                    locationName: 'New Ghost Location'
                }
            });
        });
    });

    describe('Statistics and Reporting Flow', () => {
        it('deve gerar relatório com dados de usuários e localizações', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockUsers = {
                'user1': { 
                    points: 100, 
                    captures: 5, 
                    ecto1Unlocked: true,
                    lastActive: new Date().toISOString()
                },
                'user2': { 
                    points: 200, 
                    captures: 10, 
                    ecto1Unlocked: false,
                    lastActive: new Date().toISOString()
                }
            };
            
            const mockLocations = {
                'loc1': { 
                    name: 'Location One', 
                    active: true,
                    lat: -23.550520,
                    lon: -46.633308
                },
                'loc2': { 
                    name: 'Location Two', 
                    active: false,
                    lat: -23.551520,
                    lon: -46.634308
                }
            };
            
            // Configurar retornos dos mocks
            const mockUsersRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            const mockLocationsRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockLocations
                })
            };
            
            ref.mockImplementation((path) => {
                if (path === 'users') {
                    return mockUsersRef;
                }
                if (path === 'locations') {
                    return mockLocationsRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar geração de relatório
            const report = await statsManager.generateReport({});
            
            // Verificar resultados
            expect(report.totalUsers).toBe(2);
            expect(report.activeUsers).toBe(2);
            expect(report.ghostsCaptured).toBe(15);
            expect(report.ecto1Unlocked).toBe(1);
            expect(report.topPlayers).toHaveLength(2);
            expect(report.locationStats).toHaveLength(2);
        });

        it('deve calcular estatísticas de localização corretamente', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockLocations = {
                'loc1': { name: 'Location One', active: true },
                'loc2': { name: 'Location Two', active: true }
            };
            
            const mockUsers = {
                'user1': {
                    captureHistory: [
                        { locationId: 'loc1', timestamp: '2023-01-01T10:00:00Z' },
                        { locationId: 'loc1', timestamp: '2023-01-01T11:00:00Z' },
                        { locationId: 'loc2', timestamp: '2023-01-01T12:00:00Z' }
                    ]
                },
                'user2': {
                    captureHistory: [
                        { locationId: 'loc1', timestamp: '2023-01-01T13:00:00Z' }
                    ]
                }
            };
            
            // Configurar retornos dos mocks
            const mockLocationsRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockLocations
                })
            };
            
            const mockUsersRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            ref.mockImplementation((path) => {
                if (path === 'locations') {
                    return mockLocationsRef;
                }
                if (path === 'users') {
                    return mockUsersRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar cálculo de estatísticas de localização
            const locationStats = await statsManager.getLocationStats();
            
            // Verificar resultados
            expect(locationStats).toHaveLength(2);
            
            // Verificar estatísticas da primeira localização
            const loc1Stats = locationStats.find(stat => stat.id === 'loc1');
            expect(loc1Stats.captures).toBe(3);
            expect(loc1Stats.popularity).toBe(75); // 3 de 4 capturas totais
            
            // Verificar estatísticas da segunda localização
            const loc2Stats = locationStats.find(stat => stat.id === 'loc2');
            expect(loc2Stats.captures).toBe(1);
            expect(loc2Stats.popularity).toBe(25); // 1 de 4 capturas totais
        });
    });

    describe('Audit and Logging Flow', () => {
        it('deve registrar erro do sistema e recuperar logs', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockPushRef = {
                set: jest.fn().mockResolvedValue()
            };
            
            const mockSystemLogsRef = {
                push: jest.fn(() => mockPushRef)
            };
            
            const mockErrorLog = {
                'error1': {
                    type: 'error',
                    message: 'Database connection failed',
                    timestamp: '2023-01-01T10:00:00Z',
                    context: { component: 'DatabaseManager' }
                }
            };
            
            const mockQuery = {
                once: jest.fn().mockResolvedValue({
                    forEach: (callback) => {
                        Object.entries(mockErrorLog).forEach(([key, value]) => {
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
            
            const mockSystemLogsQueryRef = {
                orderByChild: jest.fn(() => mockOrderedRef)
            };
            
            ref.mockImplementation((path) => {
                if (path === 'systemLogs') {
                    return mockSystemLogsRef;
                }
                if (path === 'systemLogs') {
                    return mockSystemLogsQueryRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar registro de erro do sistema
            await auditManager.logSystemError(
                'Database connection failed',
                { code: 500, message: 'Connection timeout' },
                { component: 'DatabaseManager' }
            );
            
            // Verificar que o erro foi registrado
            expect(mockSystemLogsRef.push).toHaveBeenCalled();
            expect(mockPushRef.set).toHaveBeenCalledWith({
                type: 'error',
                message: 'Database connection failed',
                error: { code: 500, message: 'Connection timeout' },
                context: { component: 'DatabaseManager' },
                timestamp: expect.any(String)
            });
            
            // Executar recuperação de logs do sistema
            const systemLogs = await auditManager.getSystemLogs(50);
            
            // Verificar que os logs foram recuperados
            expect(systemLogs).toHaveLength(1);
            expect(systemLogs[0].message).toBe('Database connection failed');
        });

        it('deve recuperar administradores ativos corretamente', async () => {
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
            const mockAdminsRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockAdmins
                })
            };
            
            ref.mockImplementation((path) => {
                if (path === 'admins') {
                    return mockAdminsRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar recuperação de administradores ativos
            const activeAdmins = await auditManager.getActiveAdmins(30); // Últimos 30 minutos
            
            // Verificar resultados
            expect(activeAdmins).toHaveLength(3); // Todos estão ativos nos últimos 30 minutos
            expect(activeAdmins[0].id).toBe('admin123');
            expect(activeAdmins[1].id).toBe('admin456');
            expect(activeAdmins[2].id).toBe('admin789');
        });
    });
});