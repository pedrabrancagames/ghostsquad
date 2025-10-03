/**
 * Game State Manager - Ghost Squad
 * Gerencia o estado do jogo, incluindo inventário, pontos, níveis e desbloqueios
 */

import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

export class GameStateManager {
    constructor() {
        this.userStats = {
            points: 0,
            captures: 0,
            level: 1,
            ecto1Unlocked: false
        };
        this.inventory = [];
        this.activeGhosts = []; // Armazenará os fantasmas carregados do Firebase
        this.activeEvent = null; // Armazenará o evento ativo

        // Configurações padrão do jogo
        this.CAPTURE_DURATION_NORMAL = 5000;
        this.CAPTURE_DURATION_STRONG = 8000;
        this.INVENTORY_LIMIT = 5;
        this.ECTO1_UNLOCK_COUNT = 5;
        
        this.locations = {};
        this.ECTO1_POSITION = {};
        this.selectedLocation = null;
        this.currentHuntingRadius = 15; // Valor padrão, será sobrescrito pela localização
        this.firebaseDatabase = null;
    }

    /**
     * Define o conteúdo ativo (fantasmas e evento) carregado do Firebase.
     * @param {object[]} activeGhosts - A lista de fantasmas ativos.
     * @param {object|null} activeEvent - O evento atualmente ativo.
     */
    setActiveContent(activeGhosts, activeEvent) {
        this.activeGhosts = activeGhosts;
        this.activeEvent = activeEvent;
        console.log("Conteúdo ativo definido no GameState:", { 
            ghostCount: this.activeGhosts.length, 
            activeEvent: this.activeEvent 
        });
    }

    // Carrega as configurações do jogo do Firebase
    async loadGameConfig() {
        console.log('Carregando configurações do jogo do Firebase...');
        if (!this.firebaseDatabase) {
            console.warn('Firebase Database não configurado para carregar configurações.');
            return;
        }

        try {
            const configRef = ref(this.firebaseDatabase, 'gameConfig');
            const snapshot = await get(configRef);
            const config = snapshot.val();

            if (config) {
                console.log('Configurações do jogo carregadas:', config);
                this.INVENTORY_LIMIT = config.inventoryLimit || this.INVENTORY_LIMIT;
                this.CAPTURE_RADIUS = config.captureRadius || this.CAPTURE_RADIUS;
                this.ECTO1_UNLOCK_COUNT = config.ecto1UnlockCount || this.ECTO1_UNLOCK_COUNT;

                if (config.captureDuration) {
                    this.CAPTURE_DURATION_NORMAL = config.captureDuration.common || this.CAPTURE_DURATION_NORMAL;
                    this.CAPTURE_DURATION_STRONG = config.captureDuration.strong || this.CAPTURE_DURATION_STRONG;
                }
            } else {
                console.warn('Nenhuma configuração de jogo encontrada no Firebase. Usando padrões.');
            }
        } catch (error) {
            console.error('Erro ao carregar configurações do jogo:', error);
        }
    }

    // Atualiza as estatísticas do usuário
    updateUserStats(points = 0, captures = 0) {
        this.userStats.points += points;
        this.userStats.captures += captures;

        // Verifica se o ECTO-1 deve ser desbloqueado
        if (this.userStats.captures >= this.ECTO1_UNLOCK_COUNT && !this.userStats.ecto1Unlocked) {
            this.userStats.ecto1Unlocked = true;
        }

        return this.userStats;
    }

    // Adiciona um fantasma ao inventário
    addGhostToInventory(ghost) {
        if (this.inventory.length < this.INVENTORY_LIMIT) {
            this.inventory.push(ghost);
            return true;
        }
        return false;
    }

    // Limpa o inventário
    clearInventory() {
        this.inventory = [];
    }

    // Define a localização selecionada
    async setSelectedLocation(locationName) {
        try {
            console.log(`Tentando definir localização: ${locationName}`);
            const locations = await this.getLocations();
            console.log('Localizações disponíveis:', locations);
            
            if (Object.keys(locations).length === 0) {
                console.warn('Nenhuma localização disponível');
                return false;
            }
            
            if (locations[locationName]) {
                this.selectedLocation = locations[locationName];
                this.currentHuntingRadius = this.selectedLocation.huntingRadius || 15; // Usar o raio da localização ou padrão
                console.log('Localização selecionada:', this.selectedLocation);
                this.ECTO1_POSITION = {
                    lat: this.selectedLocation.lat + 0.0005,
                    lon: this.selectedLocation.lon - 0.0005
                };
                console.log('Posição do ECTO-1:', this.ECTO1_POSITION);
                return true;
            }
            console.warn(`Localização "${locationName}" não encontrada`);
            return false;
        } catch (error) {
            console.error('Erro ao definir localização selecionada:', error);
            return false;
        }
    }

    // Gera dados para um novo fantasma a partir da lista de fantasmas ativos
    generateGhost() {
        if (this.isInventoryFull()) {
            console.log("Inventário cheio, não vai gerar novo fantasma.");
            return null;
        }
        if (this.activeGhosts.length === 0) {
            console.log("Nenhum fantasma ativo para gerar.");
            return null;
        }

        // 1. Sortear um fantasma da lista de fantasmas ativos
        const randomIndex = Math.floor(Math.random() * this.activeGhosts.length);
        const ghostTemplate = this.activeGhosts[randomIndex];

        // 2. Definir duração da captura com base no tipo
        let captureDuration;
        switch (ghostTemplate.type) {
            case 'forte':
                captureDuration = this.CAPTURE_DURATION_STRONG;
                break;
            case 'medio':
                captureDuration = (this.CAPTURE_DURATION_NORMAL + this.CAPTURE_DURATION_STRONG) / 2;
                break;
            case 'fraco':
            default:
                captureDuration = this.CAPTURE_DURATION_NORMAL;
                break;
        }
        
        // 3. Gerar a posição do fantasma
        const radius = 0.0001; // Raio de aparição em torno do centro da localização
        const lat = this.selectedLocation.lat + (Math.random() - 0.5) * radius * 2;
        const lon = this.selectedLocation.lon + (Math.random() - 0.5) * radius * 2;

        // 4. Montar o objeto final do fantasma
        const newGhostData = {
            lat: lat,
            lon: lon,
            name: ghostTemplate.name,
            type: ghostTemplate.type,
            points: ghostTemplate.points || 10, // Usa os pontos do DB, com fallback
            modelUrl: ghostTemplate.modelUrl, // URL do modelo 3D vinda do DB
            captureDuration: captureDuration,
            behavior: ghostTemplate.behavior || 'orbit', // Comportamento do DB, com fallback
            scale: ghostTemplate.scale || 1.0 // Escala do DB, com fallback
        };

        console.log("Novo fantasma gerado:", newGhostData.name);
        return newGhostData;
    }

    // Verifica se o inventário está cheio
    isInventoryFull() {
        return this.inventory.length >= this.INVENTORY_LIMIT;
    }

    // Obtém o número de fantasmas no inventário
    getInventoryCount() {
        return this.inventory.length;
    }

    // Obtém as estatísticas do usuário
    getUserStats() {
        return this.userStats;
    }

    // Obtém o inventário
    getInventory() {
        return this.inventory;
    }

    // Obtém a posição do ECTO-1
    getEcto1Position() {
        return this.ECTO1_POSITION;
    }

    // Verifica se o ECTO-1 está desbloqueado
    isEcto1Unlocked() {
        return this.userStats.ecto1Unlocked;
    }

    // Obtém a localização selecionada
    getSelectedLocation() {
        return this.selectedLocation;
    }

    // Define a instância do Firebase Database
    setFirebaseDatabase(database) {
        console.log('Configurando Firebase Database:', database);
        this.firebaseDatabase = database;
    }

    // Obtém todas as localizações disponíveis do Firebase
    async getLocations() {
        console.log('Obtendo localizações do Firebase...');
        
        if (!this.firebaseDatabase) {
            console.warn('Firebase Database não configurado');
            return {};
        }

        try {
            const locationsRef = ref(this.firebaseDatabase, 'locations');
            const snapshot = await get(locationsRef);
            let locationsData = snapshot.val() || {};

            const locations = {};
            for (const [key, location] of Object.entries(locationsData)) {
                if (location.active !== false) {
                    locations[location.name] = {
                        lat: location.lat,
                        lon: location.lon,
                        huntingRadius: location.huntingRadius || 15 // Adiciona o raio de caça
                    };
                }
            }

            return locations;
        } catch (error) {
            console.error('Erro ao obter localizações do Firebase:', error);
            return {};
        }
    }
}
