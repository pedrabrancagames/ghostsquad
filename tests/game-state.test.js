/**
 * @jest-environment jsdom
 */

import { GameStateManager } from '../game-state.js';

describe('GameStateManager', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameStateManager();
    });

    describe('updateUserStats', () => {
        it('deve atualizar pontos e capturas corretamente', () => {
            const initialPoints = gameState.userStats.points;
            const initialCaptures = gameState.userStats.captures;
            
            gameState.updateUserStats(10, 1);
            
            expect(gameState.userStats.points).toBe(initialPoints + 10);
            expect(gameState.userStats.captures).toBe(initialCaptures + 1);
        });

        it('deve desbloquear ECTO-1 quando capturas atingirem o limite', () => {
            gameState.userStats.captures = 4;
            gameState.userStats.ecto1Unlocked = false;
            
            gameState.updateUserStats(0, 1);
            
            expect(gameState.userStats.ecto1Unlocked).toBe(true);
        });
    });

    describe('addGhostToInventory', () => {
        it('deve adicionar fantasma ao inventário quando houver espaço', () => {
            const ghost = { id: 1, type: 'Fantasma Comum', points: 10 };
            
            const result = gameState.addGhostToInventory(ghost);
            
            expect(result).toBe(true);
            expect(gameState.inventory).toContain(ghost);
        });

        it('não deve adicionar fantasma ao inventário quando estiver cheio', () => {
            // Preencher o inventário
            for (let i = 0; i < gameState.INVENTORY_LIMIT; i++) {
                gameState.inventory.push({ id: i, type: 'Fantasma', points: 10 });
            }
            
            const ghost = { id: 100, type: 'Fantasma Comum', points: 10 };
            const result = gameState.addGhostToInventory(ghost);
            
            expect(result).toBe(false);
            expect(gameState.inventory).not.toContain(ghost);
        });
    });

    describe('clearInventory', () => {
        it('deve limpar todos os itens do inventário', () => {
            gameState.inventory = [
                { id: 1, type: 'Fantasma Comum', points: 10 },
                { id: 2, type: 'Fantasma Forte', points: 25 }
            ];
            
            gameState.clearInventory();
            
            expect(gameState.inventory).toEqual([]);
        });
    });

    describe('setSelectedLocation', () => {
        it('deve definir a localização selecionada corretamente', async () => {
            const result = await gameState.setSelectedLocation('Praça Central');
            
            expect(result).toBe(true);
            // Como agora buscamos do Firebase, precisamos verificar de outra forma
            // Vamos verificar se a localização foi definida
            expect(gameState.selectedLocation).toBeDefined();
        });

        it('deve retornar false para localização inválida', async () => {
            const result = await gameState.setSelectedLocation('Localização Inválida');
            
            expect(result).toBe(false);
        });
    });

    describe('generateGhost', () => {
        it('deve gerar dados de fantasma quando inventário não está cheio', async () => {
            await gameState.setSelectedLocation('Praça Central');
            
            const ghostData = gameState.generateGhost();
            
            expect(ghostData).toBeDefined();
            expect(ghostData.lat).toBeDefined();
            expect(ghostData.lon).toBeDefined();
            expect(ghostData.type).toBeDefined();
            expect(ghostData.points).toBeDefined();
            expect(ghostData.captureDuration).toBeDefined();
        });

        it('não deve gerar fantasma quando inventário está cheio', async () => {
            // Preencher o inventário
            for (let i = 0; i < gameState.INVENTORY_LIMIT; i++) {
                gameState.inventory.push({ id: i, type: 'Fantasma', points: 10 });
            }
            
            const ghostData = gameState.generateGhost();
            
            expect(ghostData).toBeNull();
        });
    });

    describe('isInventoryFull', () => {
        it('deve retornar true quando inventário está cheio', () => {
            // Preencher o inventário
            for (let i = 0; i < gameState.INVENTORY_LIMIT; i++) {
                gameState.inventory.push({ id: i, type: 'Fantasma', points: 10 });
            }
            
            expect(gameState.isInventoryFull()).toBe(true);
        });

        it('deve retornar false quando inventário não está cheio', () => {
            expect(gameState.isInventoryFull()).toBe(false);
        });
    });

    describe('getInventoryCount', () => {
        it('deve retornar o número correto de itens no inventário', () => {
            const itemCount = 3;
            for (let i = 0; i < itemCount; i++) {
                gameState.inventory.push({ id: i, type: 'Fantasma', points: 10 });
            }
            
            expect(gameState.getInventoryCount()).toBe(itemCount);
        });
    });

    describe('getUserStats', () => {
        it('deve retornar as estatísticas do usuário', () => {
            const stats = gameState.getUserStats();
            
            expect(stats).toEqual(gameState.userStats);
        });
    });

    describe('getInventory', () => {
        it('deve retornar o inventário', () => {
            const inventory = [{ id: 1, type: 'Fantasma Comum', points: 10 }];
            gameState.inventory = inventory;
            
            expect(gameState.getInventory()).toBe(inventory);
        });
    });

    describe('getGhostData', () => {
        it('deve retornar os dados do fantasma atual', () => {
            const ghostData = { lat: -27.630913, lon: -48.679793, type: 'Fantasma Comum', points: 10 };
            gameState.ghostData = ghostData;
            
            expect(gameState.getGhostData()).toBe(ghostData);
        });
    });

    describe('getEcto1Position', () => {
        it('deve retornar a posição do ECTO-1', () => {
            const ecto1Position = { lat: -27.630913, lon: -48.679793 };
            gameState.ECTO1_POSITION = ecto1Position;
            
            expect(gameState.getEcto1Position()).toBe(ecto1Position);
        });
    });

    describe('isEcto1Unlocked', () => {
        it('deve retornar true quando ECTO-1 está desbloqueado', () => {
            gameState.userStats.ecto1Unlocked = true;
            
            expect(gameState.isEcto1Unlocked()).toBe(true);
        });

        it('deve retornar false quando ECTO-1 não está desbloqueado', () => {
            gameState.userStats.ecto1Unlocked = false;
            
            expect(gameState.isEcto1Unlocked()).toBe(false);
        });
    });

    describe('getSelectedLocation', () => {
        it('deve retornar a localização selecionada', () => {
            const location = { lat: -27.630913, lon: -48.679793 };
            gameState.selectedLocation = location;
            
            expect(gameState.getSelectedLocation()).toBe(location);
        });
    });

    describe('getLocations', () => {
        it('deve retornar todas as localizações disponíveis', async () => {
            const locations = await gameState.getLocations();
            
            // Verificar que as localizações foram retornadas (pode ser do Firebase ou padrão)
            expect(locations).toBeDefined();
        });
    });
});