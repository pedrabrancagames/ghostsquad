/**
 * Componente de Gerenciamento de Localizações
 * 
 * Componente responsável por exibir e gerenciar as localizações de caça do jogo.
 */

/**
 * Inicializa o componente de gerenciamento de localizações
 * @param {HTMLElement} element - Elemento DOM onde as localizações serão renderizadas
 * @param {Object} configManager - Instância do ConfigManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 */
export async function initLocations(element, configManager, adminAuth) {
    if (!element || !configManager || !adminAuth) {
        console.error('Elemento, ConfigManager ou AdminAuthManager não fornecidos para o componente de localizações');
        return;
    }
    
    try {
        // Mostrar indicador de carregamento
        element.innerHTML = `
            <div class="locations-container">
                <div class="loading">Carregando localizações...</div>
            </div>
        `;
        
        // Carregar localizações
        const locations = await configManager.getLocations();
        
        // Renderizar interface
        renderLocations(element, locations);
        
        // Configurar eventos
        setupEventListeners(element, configManager, adminAuth, locations);
    } catch (error) {
        console.error('Erro ao carregar localizações:', error);
        element.innerHTML = `
            <div class="locations-container">
                <div class="error">Erro ao carregar localizações: ${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderiza a interface de gerenciamento de localizações
 * @param {HTMLElement} element - Elemento DOM onde as localizações serão renderizadas
 * @param {Array} locations - Lista de localizações
 */
function renderLocations(element, locations) {
    element.innerHTML = `
        <div class="locations-container">
            <div class="locations-header">
                <h2>Gerenciamento de Localizações</h2>
                <p>Gerencie as áreas de caça disponíveis no jogo</p>
            </div>
            
            <div class="locations-actions">
                <button id="add-location" class="btn-primary">Adicionar Nova Localização</button>
                <button id="refresh-locations" class="btn-secondary">Atualizar</button>
            </div>
            
            <div class="locations-table-container">
                <table class="locations-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Coordenadas</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderLocationsTable(locations)}
                    </tbody>
                </table>
            </div>
            
            <div class="locations-info">
                <h3>Dicas para Gerenciamento de Localizações</h3>
                <ul>
                    <li>Escolha locais públicos e acessíveis para as caças ao fantasma.</li>
                    <li>Verifique se as coordenadas estão corretas usando um mapa.</li>
                    <li>Mantenha um equilíbrio entre localizações ativas e inativas para evitar sobrecarga.</li>
                    <li>Considere a segurança dos jogadores ao selecionar locais.</li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Renderiza a tabela de localizações
 * @param {Array} locations - Lista de localizações
 * @returns {string} - HTML da tabela
 */
function renderLocationsTable(locations) {
    if (!locations || locations.length === 0) {
        return `
            <tr>
                <td colspan="5" class="no-data">Nenhuma localização cadastrada</td>
            </tr>
        `;
    }
    
    return locations.map(location => `
        <tr data-location-id="${location.id}">
            <td>${location.name}</td>
            <td>${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}</td>
            <td>${location.description || 'N/A'}</td>
            <td>
                <span class="status-badge ${location.active !== false ? 'active' : 'inactive'}">
                    ${location.active !== false ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td>
                <button class="btn-icon view-location" title="Visualizar no mapa">
                    🗺️
                </button>
                <button class="btn-icon edit-location" title="Editar">
                    ✏️
                </button>
                ${location.active !== false ? 
                    `<button class="btn-icon deactivate-location" title="Desativar">🚫</button>` : 
                    `<button class="btn-icon activate-location" title="Ativar">✅</button>`}
                <button class="btn-icon remove-location" title="Remover">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Configura os event listeners
 * @param {HTMLElement} element - Elemento DOM onde as localizações são renderizadas
 * @param {Object} configManager - Instância do ConfigManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 * @param {Array} locations - Lista de localizações
 */
function setupEventListeners(element, configManager, adminAuth, locations) {
    // Adicionar nova localização
    const addButton = element.querySelector('#add-location');
    if (addButton) {
        addButton.addEventListener('click', () => {
            showAddLocationModal(configManager, adminAuth, element);
        });
    }
    
    // Atualizar localizações
    const refreshButton = element.querySelector('#refresh-locations');
    if (refreshButton) {
        refreshButton.addEventListener('click', async () => {
            try {
                const locations = await configManager.getLocations();
                renderLocations(element, locations);
                setupEventListeners(element, configManager, adminAuth, locations);
            } catch (error) {
                console.error('Erro ao atualizar localizações:', error);
                showNotification('Erro ao atualizar localizações: ' + error.message, 'error');
            }
        });
    }
    
    // Ações em localizações (delegadas)
    element.addEventListener('click', async (event) => {
        const row = event.target.closest('tr[data-location-id]');
        if (!row) return;
        
        const locationId = row.dataset.locationId;
        const location = locations.find(loc => loc.id === locationId);
        if (!location) return;
        
        // Visualizar no mapa
        if (event.target.closest('.view-location')) {
            showLocationOnMap(location);
        }
        
        // Editar localização
        if (event.target.closest('.edit-location')) {
            showEditLocationModal(configManager, adminAuth, location, element);
        }
        
        // Ativar localização
        if (event.target.closest('.activate-location')) {
            try {
                await configManager.activateLocation(locationId);
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'activate_location', 
                        { locationId, locationName: location.name }
                    );
                }
                
                // Atualizar interface
                const statusBadge = row.querySelector('.status-badge');
                const activateButton = row.querySelector('.activate-location');
                
                if (statusBadge) {
                    statusBadge.className = 'status-badge active';
                    statusBadge.textContent = 'Ativa';
                }
                
                if (activateButton) {
                    activateButton.className = 'btn-icon deactivate-location';
                    activateButton.title = 'Desativar';
                    activateButton.textContent = '🚫';
                }
                
                showNotification('Localização ativada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao ativar localização:', error);
                showNotification('Erro ao ativar localização: ' + error.message, 'error');
            }
        }
        
        // Desativar localização
        if (event.target.closest('.deactivate-location')) {
            try {
                await configManager.deactivateLocation(locationId);
                
                // Registrar ação no log de auditoria
                const currentAdmin = adminAuth.getCurrentAdmin();
                if (currentAdmin) {
                    await adminAuth.logAdminAction(
                        currentAdmin.uid, 
                        'deactivate_location', 
                        { locationId, locationName: location.name }
                    );
                }
                
                // Atualizar interface
                const statusBadge = row.querySelector('.status-badge');
                const deactivateButton = row.querySelector('.deactivate-location');
                
                if (statusBadge) {
                    statusBadge.className = 'status-badge inactive';
                    statusBadge.textContent = 'Inativa';
                }
                
                if (deactivateButton) {
                    deactivateButton.className = 'btn-icon activate-location';
                    deactivateButton.title = 'Ativar';
                    deactivateButton.textContent = '✅';
                }
                
                showNotification('Localização desativada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao desativar localização:', error);
                showNotification('Erro ao desativar localização: ' + error.message, 'error');
            }
        }
        
        // Remover localização
        if (event.target.closest('.remove-location')) {
            if (confirm(`Tem certeza que deseja remover a localização "${location.name}"?`)) {
                try {
                    await configManager.removeLocation(locationId);
                    
                    // Registrar ação no log de auditoria
                    const currentAdmin = adminAuth.getCurrentAdmin();
                    if (currentAdmin) {
                        await adminAuth.logAdminAction(
                            currentAdmin.uid, 
                            'remove_location', 
                            { locationId, locationName: location.name }
                        );
                    }
                    
                    // Remover linha da tabela
                    row.remove();
                    
                    showNotification('Localização removida com sucesso!', 'success');
                } catch (error) {
                    console.error('Erro ao remover localização:', error);
                    showNotification('Erro ao remover localização: ' + error.message, 'error');
                }
            }
        }
    });
}

/**
 * Mostra o modal para adicionar nova localização
 * @param {Object} configManager - Instância do ConfigManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 * @param {HTMLElement} parentElement - Elemento pai para atualização
 */
function showAddLocationModal(configManager, adminAuth, parentElement) {
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Adicionar Nova Localização</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-location-form">
                    <div class="form-group">
                        <label for="location-name">Nome:</label>
                        <input type="text" id="location-name" name="location-name" required>
                    </div>
                    <div class="form-group">
                        <label for="location-lat">Latitude:</label>
                        <input type="number" id="location-lat" name="location-lat" step="0.000001" required>
                    </div>
                    <div class="form-group">
                        <label for="location-lon">Longitude:</label>
                        <input type="number" id="location-lon" name="location-lon" step="0.000001" required>
                    </div>
                    <div class="form-group">
                        <button type="button" id="get-current-location" class="btn-secondary">Usar Posição Atual</button>
                    </div>
                    <div class="form-group">
                        <label for="location-description">Descrição:</label>
                        <textarea id="location-description" name="location-description"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="location-hunting-radius">Raio de Caça (metros):</label>
                        <input type="number" id="location-hunting-radius" name="location-hunting-radius" step="1" min="1" value="100" required>
                    </div>
                    <div class="form-group">
                        <label for="location-active">
                            <input type="checkbox" id="location-active" name="location-active" checked>
                            Ativa
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Adicionar</button>
                        <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Adicionar ao documento
    document.body.appendChild(modal);
    
    // Configurar eventos do modal
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-cancel');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Obter localização atual
    const getCurrentLocationButton = modal.querySelector('#get-current-location');
    getCurrentLocationButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    modal.querySelector('#location-lat').value = position.coords.latitude;
                    modal.querySelector('#location-lon').value = position.coords.longitude;
                    showNotification('Localização preenchida com sucesso!', 'success');
                },
                (error) => {
                    console.error('Erro ao obter localização:', error);
                    showNotification(`Erro ao obter localização: ${error.message}`, 'error');
                }
            );
        } else {
            showNotification('Geolocalização não é suportada por este navegador.', 'error');
        }
    });
    
    // Submeter formulário
    const form = modal.querySelector('#add-location-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        try {
            // Coletar dados do formulário
            const location = {
                name: form['location-name'].value,
                lat: parseFloat(form['location-lat'].value),
                lon: parseFloat(form['location-lon'].value),
                description: form['location-description'].value,
                huntingRadius: parseInt(form['location-hunting-radius'].value, 10),
                active: form['location-active'].checked
            };
            
            // Adicionar localização
            const locationId = await configManager.addLocation(location);
            
            // Registrar ação no log de auditoria
            const currentAdmin = adminAuth.getCurrentAdmin();
            if (currentAdmin) {
                await adminAuth.logAdminAction(
                    currentAdmin.uid, 
                    'add_location', 
                    { locationId, locationName: location.name }
                );
            }
            
            // Fechar modal
            closeModal();
            
            // Atualizar interface
            const locations = await configManager.getLocations();
            renderLocations(parentElement, locations);
            setupEventListeners(parentElement, configManager, adminAuth, locations);
            
            showNotification('Localização adicionada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar localização:', error);
            showNotification('Erro ao adicionar localização: ' + error.message, 'error');
        }
    });
}

/**
 * Mostra o modal para editar localização
 * @param {Object} configManager - Instância do ConfigManager
 * @param {Object} adminAuth - Instância do AdminAuthManager
 * @param {Object} location - Dados da localização
 * @param {HTMLElement} parentElement - Elemento pai para atualização
 */
function showEditLocationModal(configManager, adminAuth, location, parentElement) {
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Localização</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-location-form">
                    <div class="form-group">
                        <label for="edit-location-name">Nome:</label>
                        <input type="text" id="edit-location-name" name="edit-location-name" 
                               value="${location.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-location-lat">Latitude:</label>
                        <input type="number" id="edit-location-lat" name="edit-location-lat" 
                               value="${location.lat}" step="0.000001" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-location-lon">Longitude:</label>
                        <input type="number" id="edit-location-lon" name="edit-location-lon" 
                               value="${location.lon}" step="0.000001" required>
                    </div>
                    <div class="form-group">
                        <button type="button" id="get-current-location-edit" class="btn-secondary">Usar Posição Atual</button>
                    </div>
                                        <div class="form-group">
                                            <label for="edit-location-description">Descrição:</label>
                                            <textarea id="edit-location-description" name="edit-location-description">${location.description || ''}</textarea>
                                        </div>
                                        <div class="form-group">
                                            <label for="edit-location-hunting-radius">Raio de Caça (metros):</label>
                                            <input type="number" id="edit-location-hunting-radius" name="edit-location-hunting-radius"
                                                   value="${location.huntingRadius || 100}" step="1" min="1" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="edit-location-active">
                                                <input type="checkbox" id="edit-location-active" name="edit-location-active"
                                                       ${location.active !== false ? 'checked' : ''}>
                                                Ativa
                                            </label>
                                        </div>                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Salvar</button>
                        <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Adicionar ao documento
    document.body.appendChild(modal);
    
    // Configurar eventos do modal
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-cancel');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Obter localização atual
    const getCurrentLocationButton = modal.querySelector('#get-current-location-edit');
    getCurrentLocationButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    modal.querySelector('#edit-location-lat').value = position.coords.latitude;
                    modal.querySelector('#edit-location-lon').value = position.coords.longitude;
                    showNotification('Localização preenchida com sucesso!', 'success');
                },
                (error) => {
                    console.error('Erro ao obter localização:', error);
                    showNotification(`Erro ao obter localização: ${error.message}`, 'error');
                }
            );
        } else {
            showNotification('Geolocalização não é suportada por este navegador.', 'error');
        }
    });
    
    // Submeter formulário
    const form = modal.querySelector('#edit-location-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        try {
            // Coletar dados do formulário
            const data = {
                name: form['edit-location-name'].value,
                lat: parseFloat(form['edit-location-lat'].value),
                lon: parseFloat(form['edit-location-lon'].value),
                description: form['edit-location-description'].value,
                huntingRadius: parseInt(form['edit-location-hunting-radius'].value, 10),
                active: form['edit-location-active'].checked
            };
            
            // Atualizar localização
            await configManager.updateLocation(location.id, data);
            
            // Registrar ação no log de auditoria
            const currentAdmin = adminAuth.getCurrentAdmin();
            if (currentAdmin) {
                await adminAuth.logAdminAction(
                    currentAdmin.uid, 
                    'update_location', 
                    { locationId: location.id, locationName: data.name }
                );
            }
            
            // Fechar modal
            closeModal();
            
            // Atualizar interface
            const locations = await configManager.getLocations();
            renderLocations(parentElement, locations);
            setupEventListeners(parentElement, configManager, adminAuth, locations);
            
            showNotification('Localização atualizada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            showNotification('Erro ao atualizar localização: ' + error.message, 'error');
        }
    });
}

/**
 * Mostra a localização no mapa
 * @param {Object} location - Dados da localização
 */
function showLocationOnMap(location) {
    // Esta é uma implementação simplificada
    // Em uma implementação real, você usaria uma biblioteca de mapas como Leaflet
    
    alert(`Visualização da localização "${location.name}" no mapa:
Coordenadas: ${location.lat}, ${location.lon}`);
    
    // Em uma implementação real, você poderia:
    // 1. Abrir um modal com um mapa interativo
    // 2. Usar a API do Google Maps ou OpenStreetMap
    // 3. Marcar a localização no mapa
}

/**
 * Mostra uma notificação
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo da notificação (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adicionar ao documento
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}
