/**
 * Gerenciador de Configurações
 * 
 * Classe responsável por gerenciar as configurações globais do jogo
 * e o gerenciamento de localizações de caça.
 */
export class ConfigManager {
    /**
     * Construtor do ConfigManager
     * @param {Object} database - Instância do Firebase Database
     */
    constructor(database) {
        this.database = database;
        this.gameConfigRef = database.ref('gameConfig');
        this.locationsRef = database.ref('locations');
    }
    
    /**
     * Obtém as configurações do jogo
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<Object>} - Configurações do jogo
     */
    async getGameConfig(adminAuth = null) {
        // Verificar permissões antes de obter configurações
        if (adminAuth && !adminAuth.hasPermission('config_view')) {
            throw new Error('Permissão negada: visualizar configurações do jogo');
        }
        
        try {
            const snapshot = await this.gameConfigRef.once('value');
            return snapshot.val() || this.getDefaultConfig();
        } catch (error) {
            console.error('Erro ao obter configurações do jogo:', error);
            throw error;
        }
    }
    
    /**
     * Obtém as configurações padrão do jogo
     * @returns {Object} - Configurações padrão
     */
    getDefaultConfig() {
        return {
            ghostPoints: {
                common: 10,
                strong: 50
            },
            inventoryLimit: 10,
            captureRadius: 50,
            captureDuration: {
                common: 30,
                strong: 60
            },
            ecto1UnlockCount: 5
        };
    }
    
    /**
     * Atualiza as configurações do jogo
     * @param {Object} config - Novas configurações
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async updateGameConfig(config, adminAuth) {
        // Verificar permissões antes de atualizar configurações
        if (!adminAuth || !adminAuth.hasPermission('config_edit')) {
            throw new Error('Permissão negada: atualizar configurações do jogo');
        }
        
        try {
            // Validar configurações
            this.validateConfig(config);
            
            // Sanitizar configurações antes de atualizar
            const sanitizedConfig = this.sanitizeConfig(config);
            
            // Atualizar no Firebase
            await this.gameConfigRef.update(sanitizedConfig);
        } catch (error) {
            console.error('Erro ao atualizar configurações do jogo:', error);
            throw error;
        }
    }
    
    /**
     * Valida as configurações do jogo
     * @param {Object} config - Configurações a serem validadas
     */
    validateConfig(config) {
        if (!config) {
            throw new Error('Configurações inválidas');
        }
        
        // Validar pontos de fantasmas
        if (config.ghostPoints) {
            if (config.ghostPoints.common !== undefined && config.ghostPoints.common < 0) {
                throw new Error('Pontos para fantasmas comuns não podem ser negativos');
            }
            if (config.ghostPoints.strong !== undefined && config.ghostPoints.strong < 0) {
                throw new Error('Pontos para fantasmas fortes não podem ser negativos');
            }
        }
        
        // Validar limite de inventário
        if (config.inventoryLimit !== undefined && config.inventoryLimit < 1) {
            throw new Error('Limite de inventário deve ser maior que 0');
        }
        
        // Validar raio de captura
        if (config.captureRadius !== undefined && config.captureRadius < 1) {
            throw new Error('Raio de captura deve ser maior que 0');
        }
        
        // Validar duração de captura
        if (config.captureDuration) {
            if (config.captureDuration.common !== undefined && config.captureDuration.common < 1) {
                throw new Error('Duração de captura para fantasmas comuns deve ser maior que 0');
            }
            if (config.captureDuration.strong !== undefined && config.captureDuration.strong < 1) {
                throw new Error('Duração de captura para fantasmas fortes deve ser maior que 0');
            }
        }
        
        // Validar contagem para desbloqueio do ECTO-1
        if (config.ecto1UnlockCount !== undefined && config.ecto1UnlockCount < 1) {
            throw new Error('Contagem para desbloqueio do ECTO-1 deve ser maior que 0');
        }
    }
    
    /**
     * Sanitiza as configurações do jogo
     * @param {Object} config - Configurações a serem sanitizadas
     * @returns {Object} - Configurações sanitizadas
     */
    sanitizeConfig(config) {
        if (!config) {
            return config;
        }
        
        const sanitized = { ...config };
        
        // Sanitizar campos de string se existirem
        if (sanitized.name && typeof sanitized.name === 'string') {
            sanitized.name = sanitized.name.replace(/[<>"'&]/g, function(match) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            });
        }
        
        return sanitized;
    }
    
    /**
     * Obtém todas as localizações
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<Array>} - Lista de localizações
     */
    async getLocations(adminAuth = null) {
        // Verificar permissões antes de obter localizações
        if (adminAuth && !adminAuth.hasPermission('location_view')) {
            throw new Error('Permissão negada: visualizar localizações');
        }
        
        try {
            const snapshot = await this.locationsRef.once('value');
            const locations = snapshot.val() || {};

            // Converter para array
            return Object.entries(locations).map(([id, data]) => ({
                id,
                ...data
            }));
        } catch (error) {
            console.error('Erro ao obter localizações:', error);
            throw error;
        }
    }
    
    /**
     * Obtém uma localização específica
     * @param {string} locationId - ID da localização
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<Object|null>} - Dados da localização ou null se não encontrada
     */
    async getLocationById(locationId, adminAuth = null) {
        // Verificar permissões antes de obter localização
        if (adminAuth && !adminAuth.hasPermission('location_view')) {
            throw new Error('Permissão negada: visualizar localização');
        }
        
        try {
            const locationRef = this.locationsRef.child(locationId);
            const snapshot = await locationRef.once('value');
            const data = snapshot.val();

            if (data) {
                return { id: locationId, ...data };
            }

            return null;
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            throw error;
        }
    }
    
    /**
     * Adiciona uma nova localização
     * @param {Object} location - Dados da localização
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<string>} - ID da nova localização
     */
    async addLocation(location, adminAuth) {
        // Verificar permissões antes de adicionar localização
        if (!adminAuth || !adminAuth.hasPermission('location_create')) {
            throw new Error('Permissão negada: adicionar localização');
        }
        
        try {
            // Validar localização
            this.validateLocation(location);

            // Sanitizar localização antes de adicionar
            const sanitizedLocation = this.sanitizeLocation(location);

            // Adicionar ao Firebase
            const newLocationRef = this.locationsRef.push();
            await newLocationRef.set(sanitizedLocation);

            return newLocationRef.key;
        } catch (error) {
            console.error('Erro ao adicionar localização:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza uma localização existente
     * @param {string} locationId - ID da localização
     * @param {Object} data - Dados a serem atualizados
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async updateLocation(locationId, data, adminAuth) {
        // Verificar permissões antes de atualizar localização
        if (!adminAuth || !adminAuth.hasPermission('location_edit')) {
            throw new Error('Permissão negada: atualizar localização');
        }
        
        try {
            // Validar dados
            this.validateLocationUpdate(data);

            // Sanitizar dados antes de atualizar
            const sanitizedData = this.sanitizeLocationUpdate(data);

            // Atualizar no Firebase
            const locationRef = this.locationsRef.child(locationId);
            await locationRef.update(sanitizedData);
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            throw error;
        }
    }
    
    /**
     * Remove uma localização
     * @param {string} locationId - ID da localização
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async removeLocation(locationId, adminAuth) {
        // Verificar permissões antes de remover localização
        if (!adminAuth || !adminAuth.hasPermission('location_delete')) {
            throw new Error('Permissão negada: remover localização');
        }
        
        try {
            // Verificar se a localização existe
            const location = await this.getLocationById(locationId, adminAuth);
            if (!location) {
                throw new Error('Localização não encontrada');
            }

            // Remover do Firebase
            const locationRef = this.locationsRef.child(locationId);
            await locationRef.remove();
        } catch (error) {
            console.error('Erro ao remover localização:', error);
            throw error;
        }
    }
    
    /**
     * Sanitiza os dados de uma localização
     * @param {Object} location - Dados da localização a serem sanitizados
     * @returns {Object} - Dados sanitizados
     */
    sanitizeLocation(location) {
        if (!location) {
            return location;
        }

        const sanitized = { ...location };

        // Sanitizar campos de string
        if (sanitized.name && typeof sanitized.name === 'string') {
            sanitized.name = sanitized.name.replace(/[<>"'&]/g, function(match) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            });
        }

        if (sanitized.description && typeof sanitized.description === 'string') {
            sanitized.description = sanitized.description.replace(/[<>"'&]/g, function(match) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            });
        }

        return sanitized;
    }
    
    /**
     * Sanitiza os dados de atualização de uma localização
     * @param {Object} data - Dados a serem sanitizados
     * @returns {Object} - Dados sanitizados
     */
    sanitizeLocationUpdate(data) {
        if (!data) {
            return data;
        }

        const sanitized = { ...data };

        // Sanitizar campos de string se existirem
        if (sanitized.name && typeof sanitized.name === 'string') {
            sanitized.name = sanitized.name.replace(/[<>"'&]/g, function(match) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            });
        }

        if (sanitized.description && typeof sanitized.description === 'string') {
            sanitized.description = sanitized.description.replace(/[<>"'&]/g, function(match) {
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            });
        }

        return sanitized;
    }
    
    /**
     * Valida os dados de uma localização
     * @param {Object} location - Dados da localização
     */
    validateLocation(location) {
        if (!location) {
            throw new Error('Dados da localização inválidos');
        }

        if (!location.name || typeof location.name !== 'string') {
            throw new Error('Nome da localização é obrigatório');
        }

        if (location.lat === undefined || location.lon === undefined) {
            throw new Error('Coordenadas (lat/lon) são obrigatórias');
        }

        if (typeof location.lat !== 'number' || typeof location.lon !== 'number') {
            throw new Error('Coordenadas devem ser números');
        }

        if (location.lat < -90 || location.lat > 90) {
            throw new Error('Latitude deve estar entre -90 e 90');
        }

        if (location.lon < -180 || location.lon > 180) {
            throw new Error('Longitude deve estar entre -180 e 180');
        }

        if (location.huntingRadius === undefined || typeof location.huntingRadius !== 'number' || location.huntingRadius < 1) {
            throw new Error('Raio de caça é obrigatório e deve ser um número maior que 0');
        }
    }
    
    /**
     * Valida os dados de atualização de uma localização
     * @param {Object} data - Dados a serem validados
     */
    validateLocationUpdate(data) {
        if (!data) {
            throw new Error('Dados de atualização inválidos');
        }

        // Validar campos individuais se presentes
        if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length === 0)) {
            throw new Error('Nome da localização deve ser uma string não vazia');
        }

        if (data.lat !== undefined) {
            if (typeof data.lat !== 'number') {
                throw new Error('Latitude deve ser um número');
            }
            if (data.lat < -90 || data.lat > 90) {
                throw new Error('Latitude deve estar entre -90 e 90');
            }
        }

        if (data.lon !== undefined) {
            if (typeof data.lon !== 'number') {
                throw new Error('Longitude deve ser um número');
            }
            if (data.lon < -180 || data.lon > 180) {
                throw new Error('Longitude deve estar entre -180 e 180');
            }
        }

        if (data.active !== undefined && typeof data.active !== 'boolean') {
            throw new Error('Status ativo deve ser um valor booleano');
        }

        if (data.huntingRadius !== undefined) {
            if (typeof data.huntingRadius !== 'number' || data.huntingRadius < 1) {
                throw new Error('Raio de caça deve ser um número maior que 0');
            }
        }
    }
    
    /**
     * Ativa uma localização
     * @param {string} locationId - ID da localização
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async activateLocation(locationId, adminAuth) {
        // Verificar permissões antes de ativar localização
        if (!adminAuth || !adminAuth.hasPermission('location_edit')) {
            throw new Error('Permissão negada: ativar localização');
        }
        
        try {
            await this.updateLocation(locationId, { active: true }, adminAuth);
        } catch (error) {
            console.error('Erro ao ativar localização:', error);
            throw error;
        }
    }
    
    /**
     * Desativa uma localização
     * @param {string} locationId - ID da localização
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async deactivateLocation(locationId, adminAuth) {
        // Verificar permissões antes de desativar localização
        if (!adminAuth || !adminAuth.hasPermission('location_edit')) {
            throw new Error('Permissão negada: desativar localização');
        }
        
        try {
            await this.updateLocation(locationId, { active: false }, adminAuth);
        } catch (error) {
            console.error('Erro ao desativar localização:', error);
            throw error;
        }
    }
    
    /**
     * Exporta as configurações do jogo
     * @param {string} format - Formato de exportação (json)
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<string>} - Configurações exportadas como string
     */
    async exportConfig(format = 'json', adminAuth) {
        // Verificar permissões antes de exportar configurações
        if (!adminAuth || !adminAuth.hasPermission('config_export')) {
            throw new Error('Permissão negada: exportar configurações');
        }
        
        try {
            const config = await this.getGameConfig(adminAuth);
            
            if (format === 'json') {
                return JSON.stringify(config, null, 2);
            }
            
            throw new Error('Formato de exportação não suportado');
        } catch (error) {
            console.error('Erro ao exportar configurações:', error);
            throw error;
        }
    }
    
    /**
     * Importa configurações do jogo
     * @param {string} configData - Dados das configurações
     * @param {string} format - Formato dos dados (json)
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async importConfig(configData, format = 'json', adminAuth) {
        // Verificar permissões antes de importar configurações
        if (!adminAuth || !adminAuth.hasPermission('config_import')) {
            throw new Error('Permissão negada: importar configurações');
        }
        
        try {
            let config;

            if (format === 'json') {
                config = JSON.parse(configData);
            } else {
                throw new Error('Formato de importação não suportado');
            }

            // Validar configurações
            this.validateConfig(config);

            // Sanitizar configurações antes de importar
            const sanitizedConfig = this.sanitizeConfig(config);

            // Atualizar no Firebase
            await this.gameConfigRef.set(sanitizedConfig);
        } catch (error) {
            console.error('Erro ao importar configurações:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza os rankings com base nos dados dos usuários
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async updateRankings(adminAuth) {
        // Verificar permissões antes de atualizar rankings
        if (!adminAuth || !adminAuth.hasPermission('ranking_update')) {
            throw new Error('Permissão negada: atualizar rankings');
        }
        
        try {
            // Obter referência para o caminho rankings
            const rankingsRef = this.database.ref('rankings');

            // Obter todos os usuários
            const usersRef = this.database.ref('users');
            const usersSnapshot = await usersRef.once('value');
            const users = usersSnapshot.val() || {};

            // Converter para array e filtrar usuários com pontos > 0
            const players = Object.entries(users)
                .map(([uid, userData]) => ({
                    uid,
                    displayName: userData.displayName || 'Caça-Fantasma',
                    points: userData.points || 0,
                    captures: userData.captures || 0
                }))
                .filter(player => player.points > 0); // Apenas usuários com pontos

            // Ordenar por pontos (descendente)
            players.sort((a, b) => b.points - a.points);

            // Criar objeto para rankings
            const rankingsData = {};
            players.forEach(player => {
                rankingsData[player.uid] = {
                    displayName: player.displayName,
                    points: player.points,
                    captures: player.captures
                };
            });

            // Atualizar rankings no Firebase
            await rankingsRef.set(rankingsData);

            console.log(`Rankings atualizados com sucesso para ${players.length} jogadores`);
        } catch (error) {
            console.error('Erro ao atualizar rankings:', error);
            throw error;
        }
    }
}