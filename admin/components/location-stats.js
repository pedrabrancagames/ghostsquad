/**
 * Componente de Estatísticas de Localização
 * 
 * Componente responsável por exibir e gerenciar estatísticas
 * relacionadas às localizações do jogo.
 */

/**
 * Inicializa o componente de estatísticas de localização
 * @param {HTMLElement} element - Elemento DOM onde as estatísticas serão renderizadas
 * @param {Object} statsManager - Instância do StatsManager
 * @param {Object} database - Instância do Firebase Database
 */
export async function initLocationStats(element, statsManager, database) {
    if (!element || !statsManager || !database) {
        console.error('Elemento, StatsManager ou Database não fornecidos para o componente de estatísticas de localização');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="location-stats-container">
                <div class="loading">Carregando estatísticas de localização...</div>
            </div>
        `;
        
        // Carregar dados de localização
        const locationStats = await statsManager.getLocationStats();
        
        // Renderizar interface
        renderLocationStats(element, locationStats);
        
        // Configurar eventos
        setupEventListeners(element, database, locationStats);
    } catch (error) {
        console.error('Erro ao carregar estatísticas de localização:', error);
        element.innerHTML = `
            <div class="location-stats-container">
                <div class="error">Erro ao carregar estatísticas de localização: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de estatísticas de localização
 * @param {HTMLElement} element - Elemento DOM onde as estatísticas serão renderizadas
 * @param {Array} locationStats - Estatísticas das localizações
 */
function renderLocationStats(element, locationStats) {
    element.innerHTML = `
        <div class="location-stats-container">
            <div class="location-stats-header">
                <h2>Estatísticas de Localização</h2>
                <p>Visualize e gerencie as estatísticas das áreas de caça do jogo</p>
            </div>
            
            <div class="location-stats-content">
                <div class="stats-summary">
                    <div class="summary-card">
                        <h3>Total de Localizações</h3>
                        <p class="summary-value">${locationStats.length}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Localizações Ativas</h3>
                        <p class="summary-value">${locationStats.filter(loc => loc.active).length}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total de Capturas</h3>
                        <p class="summary-value">${locationStats.reduce((sum, loc) => sum + loc.captures, 0)}</p>
                    </div>
                </div>
                
                <div class="locations-table-container">
                    <h3>Detalhamento por Localização</h3>
                    <table class="locations-stats-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Coordenadas</th>
                                <th>Capturas</th>
                                <th>Popularidade</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderLocationsTable(locationStats)}
                        </tbody>
                    </table>
                </div>
                
                <div class="location-map-container">
                    <h3>Distribuição Geográfica</h3>
                    <div id="location-map" class="location-map">
                        <!-- Mapa será renderizado aqui -->
                        <div class="map-placeholder">
                            <p>Visualização do mapa em desenvolvimento</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza a tabela de localizações
 * @param {Array} locationStats - Estatísticas das localizações
 * @returns {string} - HTML da tabela
 */
function renderLocationsTable(locationStats) {
    if (!locationStats || locationStats.length === 0) {
        return `
            <tr>
                <td colspan="6" class="no-data">Nenhuma localização encontrada</td>
            </tr>
        `;
    }
    
    return locationStats.map(location => `
        <tr data-location-id="${location.id}">
            <td>${location.name}</td>
            <td>${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}</td>
            <td>${location.captures}</td>
            <td>${location.popularity.toFixed(1)}%</td>
            <td>
                <span class="status-badge ${location.active ? 'active' : 'inactive'}">
                    ${location.active ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td>
                <button class="btn-icon toggle-location" title="${location.active ? 'Desativar' : 'Ativar'}">
                    ${location.active ? '🚫' : '✅'}
                </button>
                <button class="btn-icon edit-location" title="Editar">
                    ✏️
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde as estatísticas são renderizadas
 * @param {Object} database - Instância do Firebase Database
 * @param {Array} locationStats - Estatísticas das localizações
 */
function setupEventListeners(element, database, locationStats) {
    // Ações em localizações (delegadas)
    element.addEventListener('click', async (event) => {
        const row = event.target.closest('tr[data-location-id]');
        if (!row) return;
        
        const locationId = row.dataset.locationId;
        const location = locationStats.find(loc => loc.id === locationId);
        if (!location) return;
        
        // Alternar status da localização
        if (event.target.closest('.toggle-location')) {
            try {
                const newStatus = !location.active;
                const locationsRef = database.ref(`locations/${locationId}`);
                await locationsRef.update({ active: newStatus });
                
                // Atualizar interface
                const statusBadge = row.querySelector('.status-badge');
                const toggleButton = row.querySelector('.toggle-location');
                
                if (statusBadge) {
                    statusBadge.className = `status-badge ${newStatus ? 'active' : 'inactive'}`;
                    statusBadge.textContent = newStatus ? 'Ativa' : 'Inativa';
                }
                
                if (toggleButton) {
                    toggleButton.title = newStatus ? 'Desativar' : 'Ativar';
                    toggleButton.textContent = newStatus ? '🚫' : '✅';
                }
                
                // Atualizar objeto location
                location.active = newStatus;
            } catch (error) {
                console.error('Erro ao alternar status da localização:', error);
                alert('Erro ao atualizar localização: ' + error.message);
            }
        }
        
        // Editar localização
        if (event.target.closest('.edit-location')) {
            editLocation(database, location, row);
        }
    });
}

/**
 * Edita uma localização
 * @param {Object} database - Instância do Firebase Database
 * @param {Object} location - Dados da localização
 * @param {HTMLElement} row - Elemento da linha da localização
 */
async function editLocation(database, location, row) {
    try {
        // Criar formulário de edição
        const newName = prompt('Novo nome da localização:', location.name);
        if (newName === null) return; // Cancelado
        
        const newLat = prompt('Nova latitude:', location.lat);
        if (newLat === null) return; // Cancelado
        
        const newLon = prompt('Nova longitude:', location.lon);
        if (newLon === null) return; // Cancelado
        
        // Validar entradas
        const latNum = parseFloat(newLat);
        const lonNum = parseFloat(newLon);
        
        if (isNaN(latNum) || isNaN(lonNum)) {
            alert('Coordenadas inválidas');
            return;
        }
        
        // Atualizar localização
        const locationsRef = database.ref(`locations/${location.id}`);
        await locationsRef.update({
            name: newName,
            lat: latNum,
            lon: lonNum
        });
        
        // Atualizar interface
        const nameCell = row.querySelector('td:nth-child(1)');
        const coordsCell = row.querySelector('td:nth-child(2)');
        
        if (nameCell) nameCell.textContent = newName;
        if (coordsCell) coordsCell.textContent = `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`;
        
        // Atualizar objeto location
        location.name = newName;
        location.lat = latNum;
        location.lon = lonNum;
        
        alert('Localização atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao editar localização:', error);
        alert('Erro ao editar localização: ' + error.message);
    }
}

/**
 * Renderiza um mapa com as localizações
 * @param {HTMLElement} mapElement - Elemento onde o mapa será renderizado
 * @param {Array} locationStats - Estatísticas das localizações
 */
function renderLocationMap(mapElement, locationStats) {
    if (!mapElement) return;
    
    // Esta é uma implementação simplificada
    // Em uma implementação real, você usaria uma biblioteca de mapas como Leaflet
    
    mapElement.innerHTML = `
        <div class="map-container">
            <div class="map-overlay">
                <p>Mapa interativo em desenvolvimento</p>
                <p>Total de localizações: ${locationStats.length}</p>
                <p>Localizações ativas: ${locationStats.filter(loc => loc.active).length}</p>
            </div>
            <div class="map-background">
                <!-- Aqui seria renderizado o mapa real -->
                ${locationStats.slice(0, 10).map(location => `
                    <div class="map-marker ${location.active ? 'active' : 'inactive'}" 
                         style="left: ${(location.lon + 180) / 360 * 100}%; top: ${(90 - location.lat) / 180 * 100}%"
                         title="${location.name} (${location.captures} capturas)">
                        ${location.captures}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}