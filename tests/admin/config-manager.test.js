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

import { ConfigManager } from '../../admin/modules/config-manager.js';

describe('ConfigManager', () => {
    let configManager;
    let mockDatabase;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configurar mock do Database
        mockDatabase = {};
        
        // Criar instância do ConfigManager
        configManager = new ConfigManager(mockDatabase);
    });

    describe('getGameConfig', () => {
        it('deve retornar configurações do jogo', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockConfig = {
                ghostPoints: { common: 10, strong: 50 },
                inventoryLimit: 10,
                captureRadius: 50
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockConfig
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await configManager.getGameConfig();
            
            // Verificar resultados
            expect(result).toEqual(mockConfig);
        });

        it('deve retornar configurações padrão se não houver configurações', async () => {
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
            const result = await configManager.getGameConfig();
            
            // Verificar resultados
            expect(result).toEqual(configManager.getDefaultConfig());
        });
    });

    describe('validateConfig', () => {
        it('deve validar configurações corretas', () => {
            // Configurar dados de teste
            const config = {
                ghostPoints: { common: 10, strong: 50 },
                inventoryLimit: 10,
                captureRadius: 50,
                captureDuration: { common: 30, strong: 60 },
                ecto1UnlockCount: 5
            };
            
            // Executar método (não deve lançar exceção)
            expect(() => configManager.validateConfig(config)).not.toThrow();
        });

        it('deve lançar erro para pontos negativos', () => {
            // Configurar dados de teste
            const config = {
                ghostPoints: { common: -10, strong: 50 }
            };
            
            // Executar método e verificar erro
            expect(() => configManager.validateConfig(config))
                .toThrow('Pontos para fantasmas comuns não podem ser negativos');
        });

        it('deve lançar erro para limite de inventário inválido', () => {
            // Configurar dados de teste
            const config = {
                inventoryLimit: 0
            };
            
            // Executar método e verificar erro
            expect(() => configManager.validateConfig(config))
                .toThrow('Limite de inventário deve ser maior que 0');
        });
    });

    describe('getLocations', () => {
        it('deve retornar lista de localizações', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockLocations = {
                'loc1': { name: 'Location One', lat: -23.550520, lon: -46.633308 },
                'loc2': { name: 'Location Two', lat: -23.551520, lon: -46.634308 }
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockLocations
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await configManager.getLocations();
            
            // Verificar resultados
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('loc1');
            expect(result[0].name).toBe('Location One');
            expect(result[1].id).toBe('loc2');
            expect(result[1].name).toBe('Location Two');
        });
    });

    describe('addLocation', () => {
        it('deve adicionar nova localização', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockLocation = {
                name: 'New Location',
                lat: -23.550520,
                lon: -46.633308
            };
            
            const mockPushRef = {
                set: jest.fn().mockResolvedValue(),
                key: 'new-location-id'
            };
            
            const mockRef = {
                push: jest.fn(() => mockPushRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await configManager.addLocation(mockLocation);
            
            // Verificar resultados
            expect(result).toBe('new-location-id');
            expect(mockPushRef.set).toHaveBeenCalledWith(mockLocation);
        });

        it('deve validar dados da localização', async () => {
            // Configurar dados de teste inválidos
            const invalidLocation = {
                name: '', // Nome vazio
                lat: -23.550520,
                lon: -46.633308
            };
            
            // Executar método e verificar erro
            await expect(configManager.addLocation(invalidLocation))
                .rejects.toThrow('Nome da localização é obrigatório');
        });
    });

    describe('updateLocation', () => {
        it('deve atualizar localização existente', async () => {
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
            await configManager.updateLocation('loc1', { name: 'Updated Location' });
            
            // Verificar resultados
            expect(mockRef.child).toHaveBeenCalledWith('loc1');
            expect(mockChildRef.update).toHaveBeenCalledWith({ name: 'Updated Location' });
        });
    });

    describe('removeLocation', () => {
        it('deve remover localização existente', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockLocationData = { name: 'Location to Remove' };
            
            const mockChildRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockLocationData
                }),
                remove: jest.fn().mockResolvedValue()
            };
            
            const mockRef = {
                child: jest.fn(() => mockChildRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            await configManager.removeLocation('loc1');
            
            // Verificar resultados
            expect(mockRef.child).toHaveBeenCalledWith('loc1');
            expect(mockChildRef.remove).toHaveBeenCalled();
        });

        it('deve lançar erro se localização não existir', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockChildRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => null // Localização não encontrada
                })
            };
            
            const mockRef = {
                child: jest.fn(() => mockChildRef)
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método e verificar erro
            await expect(configManager.removeLocation('loc1'))
                .rejects.toThrow('Localização não encontrada');
        });
    });

    describe('exportConfig', () => {
        it('deve exportar configurações em JSON', async () => {
            // Importar funções mockadas
            const { ref } = require("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
            
            // Configurar retornos dos mocks
            const mockConfig = {
                ghostPoints: { common: 10, strong: 50 },
                inventoryLimit: 10
            };
            
            const mockRef = {
                once: jest.fn().mockResolvedValue({
                    val: () => mockConfig
                })
            };
            
            ref.mockReturnValue(mockRef);
            
            // Executar método
            const result = await configManager.exportConfig('json');
            
            // Verificar resultados
            expect(result).toBe(JSON.stringify(mockConfig, null, 2));
        });
    });
});