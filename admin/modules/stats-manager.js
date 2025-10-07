/**
 * Gerenciador de Estatísticas
 * 
 * Classe responsável por gerenciar estatísticas e métricas do jogo
 * para exibição em relatórios e dashboards.
 */
export class StatsManager {
    /**
     * Construtor do StatsManager
     * @param {Object} database - Instância do Firebase Database
     */
    constructor(database) {
        this.database = database;
        this.usersRef = database.ref('users');
        this.locationsRef = database.ref('locations');
        this.gameConfigRef = database.ref('gameConfig');
    }
    
    /**
     * Obtém as métricas do dashboard
     * @returns {Promise<Object>} - Métricas do dashboard
     */
    async getDashboardMetrics() {
        try {
            // Obter todos os usuários
            const usersSnapshot = await this.usersRef.once('value');
            const users = usersSnapshot.val() || {};
            
            // Calcular métricas
            const totalUsers = Object.keys(users).length;
            const activeUsers = this.calculateActiveUsers(users);
            const ghostsCaptured = this.calculateGhostsCaptured(users);
            const ecto1Unlocked = this.calculateEcto1Unlocked(users);
            
            // Calcular tendências (comparação com período anterior)
            const trends = await this.calculateTrends(users);
            
            return {
                totalUsers,
                activeUsers,
                ghostsCaptured,
                ecto1Unlocked,
                trends
            };
        } catch (error) {
            console.error('Erro ao obter métricas do dashboard:', error);
            throw error;
        }
    }
    
    /**
     * Calcula o número de usuários ativos nas últimas 24 horas
     * @param {Object} users - Objeto com dados dos usuários
     * @returns {number} - Número de usuários ativos
     */
    calculateActiveUsers(users) {
        if (!users) return 0;
        
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        let activeCount = 0;
        
        for (const userId in users) {
            const user = users[userId];
            if (user.lastActive && new Date(user.lastActive).getTime() > oneDayAgo) {
                activeCount++;
            }
        }
        
        return activeCount;
    }
    
    /**
     * Calcula o número total de fantasmas capturados
     * @param {Object} users - Objeto com dados dos usuários
     * @returns {number} - Número total de fantasmas capturados
     */
    calculateGhostsCaptured(users) {
        if (!users) return 0;
        
        let totalCaptures = 0;
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const userId in users) {
            const user = users[userId];
            if (user.captures) {
                // Se tivermos timestamps das capturas, podemos filtrar por 24h
                if (user.captureHistory) {
                    const recentCaptures = user.captureHistory.filter(capture => 
                        new Date(capture.timestamp).getTime() > oneDayAgo
                    );
                    totalCaptures += recentCaptures.length;
                } else {
                    // Caso contrário, usamos o valor total de captures
                    totalCaptures += user.captures;
                }
            }
        }
        
        return totalCaptures;
    }
    
    /**
     * Calcula o número de ECTO-1s desbloqueados
     * @param {Object} users - Objeto com dados dos usuários
     * @returns {number} - Número de ECTO-1s desbloqueados
     */
    calculateEcto1Unlocked(users) {
        if (!users) return 0;
        
        let ecto1Count = 0;
        
        for (const userId in users) {
            const user = users[userId];
            if (user.ecto1Unlocked) {
                ecto1Count++;
            }
        }
        
        return ecto1Count;
    }
    
    /**
     * Calcula tendências comparando com o período anterior
     * @param {Object} users - Objeto com dados dos usuários
     * @returns {Promise<Object>} - Tendências calculadas
     */
    async calculateTrends(users) {
        try {
            // Calcular métricas do período anterior (últimos 24-48 horas)
            const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            let previousActiveUsers = 0;
            let previousGhostsCaptured = 0;
            
            for (const userId in users) {
                const user = users[userId];
                
                // Usuários ativos no período anterior
                if (user.lastActive) {
                    const lastActive = new Date(user.lastActive).getTime();
                    if (lastActive > twoDaysAgo && lastActive <= oneDayAgo) {
                        previousActiveUsers++;
                    }
                }
                
                // Capturas no período anterior
                if (user.captureHistory) {
                    const previousCaptures = user.captureHistory.filter(capture => {
                        const captureTime = new Date(capture.timestamp).getTime();
                        return captureTime > twoDaysAgo && captureTime <= oneDayAgo;
                    });
                    previousGhostsCaptured += previousCaptures.length;
                }
            }
            
            // Obter métricas atuais
            const currentActiveUsers = this.calculateActiveUsers(users);
            const currentGhostsCaptured = this.calculateGhostsCaptured(users);
            
            // Calcular variações percentuais
            const activeUsersTrend = previousActiveUsers > 0 ? 
                ((currentActiveUsers - previousActiveUsers) / previousActiveUsers * 100) : 0;
                
            const ghostsCapturedTrend = previousGhostsCaptured > 0 ? 
                ((currentGhostsCaptured - previousGhostsCaptured) / previousGhostsCaptured * 100) : 0;
            
            return {
                activeUsers: {
                    current: currentActiveUsers,
                    previous: previousActiveUsers,
                    variation: activeUsersTrend
                },
                ghostsCaptured: {
                    current: currentGhostsCaptured,
                    previous: previousGhostsCaptured,
                    variation: ghostsCapturedTrend
                }
            };
        } catch (error) {
            console.error('Erro ao calcular tendências:', error);
            return {
                activeUsers: { current: 0, previous: 0, variation: 0 },
                ghostsCaptured: { current: 0, previous: 0, variation: 0 }
            };
        }
    }
    
    /**
     * Obtém dados para gráficos de atividade
     * @param {string} period - Período ('day', 'week', 'month')
     * @returns {Promise<Object>} - Dados para gráficos
     */
    async getActivityCharts(period = 'week') {
        try {
            // Determinar intervalo de tempo
            let days = 7;
            if (period === 'day') days = 1;
            if (period === 'month') days = 30;
            
            // Obter usuários
            const usersSnapshot = await this.usersRef.once('value');
            const users = usersSnapshot.val() || {};
            
            // Gerar dados para o período
            const chartData = this.generateActivityData(users, days);
            
            return chartData;
        } catch (error) {
            console.error('Erro ao obter dados de atividade:', error);
            throw error;
        }
    }
    
    /**
     * Gera dados de atividade para gráficos
     * @param {Object} users - Objeto com dados dos usuários
     * @param {number} days - Número de dias
     * @returns {Object} - Dados de atividade
     */
    generateActivityData(users, days) {
        const labels = [];
        const activeUsers = [];
        const captures = [];
        
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Formatar rótulo
            if (days <= 7) {
                labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
            } else {
                labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
            }
            
            // Calcular usuários ativos neste dia
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            let dailyActiveUsers = 0;
            let dailyCaptures = 0;
            
            for (const userId in users) {
                const user = users[userId];
                
                // Verificar se o usuário foi ativo neste dia
                if (user.lastActive) {
                    const lastActive = new Date(user.lastActive);
                    if (lastActive >= dayStart && lastActive <= dayEnd) {
                        dailyActiveUsers++;
                    }
                }
                
                // Verificar capturas neste dia
                if (user.captureHistory) {
                    const dayCaptures = user.captureHistory.filter(capture => {
                        const captureTime = new Date(capture.timestamp);
                        return captureTime >= dayStart && captureTime <= dayEnd;
                    });
                    dailyCaptures += dayCaptures.length;
                }
            }
            
            activeUsers.push(dailyActiveUsers);
            captures.push(dailyCaptures);
        }
        
        return {
            labels,
            activeUsers,
            captures
        };
    }
    
    /**
     * Obtém estatísticas por localização
     * @returns {Promise<Object>} - Estatísticas por localização
     */
    async getLocationStats() {
        try {
            // Obter localizações
            const locationsSnapshot = await this.locationsRef.once('value');
            const locations = locationsSnapshot.val() || {};
            
            // Obter usuários
            const usersSnapshot = await this.usersRef.once('value');
            const users = usersSnapshot.val() || {};
            
            // Calcular estatísticas por localização
            const locationStats = this.calculateLocationStats(locations, users);
            
            return locationStats;
        } catch (error) {
            console.error('Erro ao obter estatísticas de localização:', error);
            throw error;
        }
    }
    
    /**
     * Calcula estatísticas por localização
     * @param {Object} locations - Objeto com dados das localizações
     * @param {Object} users - Objeto com dados dos usuários
     * @returns {Array} - Estatísticas por localização
     */
    calculateLocationStats(locations, users) {
        const stats = [];
        
        // Inicializar estatísticas para cada localização
        for (const locationId in locations) {
            const location = locations[locationId];
            stats.push({
                id: locationId,
                name: location.name || 'Localização sem nome',
                lat: location.lat,
                lon: location.lon,
                active: location.active !== false,
                captures: 0,
                popularity: 0
            });
        }
        
        // Calcular capturas por localização
        for (const userId in users) {
            const user = users[userId];
            
            if (user.captureHistory) {
                user.captureHistory.forEach(capture => {
                    if (capture.locationId) {
                        const stat = stats.find(s => s.id === capture.locationId);
                        if (stat) {
                            stat.captures++;
                        }
                    }
                });
            }
        }
        
        // Calcular popularidade (percentual de capturas)
        const totalCaptures = stats.reduce((sum, stat) => sum + stat.captures, 0);
        stats.forEach(stat => {
            stat.popularity = totalCaptures > 0 ? (stat.captures / totalCaptures * 100) : 0;
        });
        
        // Ordenar por número de capturas (descendente)
        stats.sort((a, b) => b.captures - a.captures);
        
        return stats;
    }
    
    /**
     * Obtém os top jogadores
     * @param {number} limit - Limite de jogadores
     * @returns {Promise<Array>} - Lista de top jogadores
     */
    async getTopPlayers(limit = 100) {
        try {
            // Obter usuários
            const usersSnapshot = await this.usersRef.once('value');
            const users = usersSnapshot.val() || {};
            
            // Converter para array e calcular pontuação total
            const players = Object.entries(users).map(([uid, userData]) => ({
                uid,
                ...userData,
                totalScore: (userData.points || 0) + (userData.captures || 0) * 10
            }));
            
            // Ordenar por pontuação total (descendente)
            players.sort((a, b) => b.totalScore - a.totalScore);
            
            // Limitar resultados
            return players.slice(0, limit);
        } catch (error) {
            console.error('Erro ao obter top jogadores:', error);
            throw error;
        }
    }
    
    /**
     * Gera um relatório com filtros
     * @param {Object} filters - Filtros para o relatório
     * @returns {Promise<Object>} - Dados do relatório
     */
    async generateReport(filters = {}) {
        try {
            // Obter dados base
            const usersSnapshot = await this.usersRef.once('value');
            const users = usersSnapshot.val() || {};
            
            const locationsSnapshot = await this.locationsRef.once('value');
            const locations = locationsSnapshot.val() || {};
            
            // Aplicar filtros
            let filteredUsers = users;
            
            if (filters.startDate || filters.endDate) {
                filteredUsers = this.filterUsersByDate(users, filters.startDate, filters.endDate);
            }
            
            if (filters.minLevel) {
                filteredUsers = this.filterUsersByLevel(filteredUsers, filters.minLevel);
            }
            
            // Calcular estatísticas do relatório
            const report = {
                period: {
                    start: filters.startDate ? new Date(filters.startDate) : null,
                    end: filters.endDate ? new Date(filters.endDate) : new Date()
                },
                totalUsers: Object.keys(filteredUsers).length,
                activeUsers: this.calculateActiveUsers(filteredUsers),
                ghostsCaptured: this.calculateGhostsCaptured(filteredUsers),
                ecto1Unlocked: this.calculateEcto1Unlocked(filteredUsers),
                topPlayers: await this.getTopPlayers(10),
                locationStats: this.calculateLocationStats(locations, filteredUsers)
            };
            
            return report;
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            throw error;
        }
    }
    
    /**
     * Filtra usuários por data de atividade
     * @param {Object} users - Objeto com dados dos usuários
     * @param {Date} startDate - Data inicial
     * @param {Date} endDate - Data final
     * @returns {Object} - Usuários filtrados
     */
    filterUsersByDate(users, startDate, endDate) {
        const filtered = {};
        
        for (const userId in users) {
            const user = users[userId];
            let includeUser = true;
            
            if (startDate && user.lastActive) {
                const lastActive = new Date(user.lastActive);
                if (lastActive < new Date(startDate)) {
                    includeUser = false;
                }
            }
            
            if (endDate && user.lastActive) {
                const lastActive = new Date(user.lastActive);
                if (lastActive > new Date(endDate)) {
                    includeUser = false;
                }
            }
            
            if (includeUser) {
                filtered[userId] = user;
            }
        }
        
        return filtered;
    }
    
    /**
     * Filtra usuários por nível mínimo
     * @param {Object} users - Objeto com dados dos usuários
     * @param {number} minLevel - Nível mínimo
     * @returns {Object} - Usuários filtrados
     */
    filterUsersByLevel(users, minLevel) {
        const filtered = {};
        
        for (const userId in users) {
            const user = users[userId];
            if (user.level && user.level >= minLevel) {
                filtered[userId] = user;
            }
        }
        
        return filtered;
    }
}