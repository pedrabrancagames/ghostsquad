/**
 * @jest-environment jsdom
 */

// Mock do Firebase Database
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js", () => {
    return {
        __esModule: true,
        getDatabase: jest.fn(() => ({})),
        ref: jest.fn(() => ({
            once: jest.fn()
        })),
        once: jest.fn()
    };
}, { virtual: true });

import { StatsManager } from '../../admin/modules/stats-manager.js';

describe('StatsManager', () => {
    let statsManager;
    let mockDatabase;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configurar mock do Database
        mockDatabase = {};
        
        // Criar instância do StatsManager
        statsManager = new StatsManager(mockDatabase);
    });

    describe('getDashboardMetrics', () => {
        it('deve calcular métricas do dashboard corretamente', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
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
                },
                'user3': { 
                    points: 150, 
                    captures: 7, 
                    ecto1Unlocked: true,
                    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dias atrás
                }
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await statsManager.getDashboardMetrics();
            
            // Verificar resultados
            expect(result.totalUsers).toBe(3);
            expect(result.activeUsers).toBe(2); // user1 e user2 estão ativos (menos de 1 dia)
            expect(result.ghostsCaptured).toBe(22); // 5 + 10 + 7
            expect(result.ecto1Unlocked).toBe(2); // user1 e user3
        });
    });

    describe('calculateActiveUsers', () => {
        it('deve contar usuários ativos nas últimas 24 horas', () => {
            // Configurar dados de teste
            const users = {
                'user1': { lastActive: new Date().toISOString() }, // Ativo
                'user2': { lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }, // Ativo (2 horas atrás)
                'user3': { lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() } // Inativo (2 dias atrás)
            };
            
            // Executar método
            const result = statsManager.calculateActiveUsers(users);
            
            // Verificar resultado
            expect(result).toBe(2);
        });
    });

    describe('calculateGhostsCaptured', () => {
        it('deve calcular total de fantasmas capturados', () => {
            // Configurar dados de teste
            const users = {
                'user1': { captures: 5 },
                'user2': { captures: 10 },
                'user3': { captures: 7 }
            };
            
            // Executar método
            const result = statsManager.calculateGhostsCaptured(users);
            
            // Verificar resultado
            expect(result).toBe(22);
        });
    });

    describe('calculateEcto1Unlocked', () => {
        it('deve contar usuários com ECTO-1 desbloqueado', () => {
            // Configurar dados de teste
            const users = {
                'user1': { ecto1Unlocked: true },
                'user2': { ecto1Unlocked: false },
                'user3': { ecto1Unlocked: true }
            };
            
            // Executar método
            const result = statsManager.calculateEcto1Unlocked(users);
            
            // Verificar resultado
            expect(result).toBe(2);
        });
    });

    describe('getTopPlayers', () => {
        it('deve retornar lista de top jogadores ordenada por pontuação', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockUsers = {
                'user1': { points: 100, captures: 5, displayName: 'Player One' },
                'user2': { points: 300, captures: 10, displayName: 'Player Two' },
                'user3': { points: 200, captures: 7, displayName: 'Player Three' }
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await statsManager.getTopPlayers(10);
            
            // Verificar resultados
            expect(result).toHaveLength(3);
            expect(result[0].uid).toBe('user2'); // Maior pontuação
            expect(result[0].totalScore).toBe(400); // 300 + 10*10
            expect(result[1].uid).toBe('user3'); // Segunda maior pontuação
            expect(result[1].totalScore).toBe(270); // 200 + 7*10
            expect(result[2].uid).toBe('user1'); // Terceira maior pontuação
            expect(result[2].totalScore).toBe(150); // 100 + 5*10
        });
    });

    describe('generateReport', () => {
        it('deve gerar relatório com filtros', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar dados de teste
            const mockUsers = {
                'user1': { 
                    points: 100, 
                    captures: 5, 
                    ecto1Unlocked: true,
                    lastActive: new Date().toISOString()
                }
            };
            
            const mockLocations = {
                'loc1': { name: 'Location One', active: true }
            };
            
            // Mock para usuários
            const mockUsersRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockUsers
                })
            };
            
            // Mock para localizações
            const mockLocationsRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockLocations
                })
            };
            
            ref.mockImplementation((path) => {
                if (path === 'users') {
                    return mockUsersRef;
                } else if (path === 'locations') {
                    return mockLocationsRef;
                }
                return { once: jest.fn() };
            });
            
            // Executar método
            const result = await statsManager.generateReport({
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            });
            
            // Verificar resultados
            expect(result.totalUsers).toBe(1);
            expect(result.activeUsers).toBe(1);
            expect(result.ghostsCaptured).toBe(5);
            expect(result.ecto1Unlocked).toBe(1);
            expect(result.topPlayers).toHaveLength(1);
            expect(result.locationStats).toHaveLength(1);
        });
    });
});