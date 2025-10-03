/**
 * Componente para gerenciar a UI de Fantasmas.
 * Renderiza o formulário de cadastro e a lista de fantasmas.
 */
export function initGhosts(container, ghostManager, eventManager) {
    const content = `
        <div class="form-container">
            <h3>Cadastrar Novo Fantasma</h3>
            <form id="add-ghost-form">
                <div class="form-group">
                    <label for="ghost-name">Nome do Fantasma</label>
                    <input type="text" id="ghost-name" required>
                </div>

                <div class="form-group">
                    <label for="ghost-model-url">URL do Modelo (.glb)</label>
                    <input type="url" id="ghost-model-url" placeholder="https://.../modelo.glb" required>
                </div>

                <div class="form-group-row">
                    <div class="form-group">
                        <label for="ghost-status">Status</label>
                        <select id="ghost-status">
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </select>
                    </div>
                    <div class="form-group-row">
                    <div class="form-group">
                        <label for="ghost-type">Tipo</label>
                        <select id="ghost-type">
                            <option value="fraco">Fraco</option>
                            <option value="medio">Médio</option>
                            <option value="forte">Forte</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ghost-behavior">Comportamento</label>
                        <select id="ghost-behavior">
                            <option value="orbit">Flutuando e Orbitando</option>
                            <option value="stationary">Parado no Chão</option>
                        </select>
                    </div>
                </div>

                <div class="form-group-row">
                    <div class="form-group">
                        <label for="ghost-event">Evento Associado</label>
                        <select id="ghost-event">
                            <option value="">Nenhum evento</option>
                            <!-- Eventos serão populados aqui -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ghost-scale">Escala (ex: 1.0)</label>
                        <input type="number" id="ghost-scale" value="1.0" step="0.1" required>
                    </div>
                </div>

                <button type="submit" id="save-ghost-btn">Salvar Fantasma</button>
                <button type="button" id="cancel-edit-ghost-btn" class="btn-secondary" style="display: none;">Cancelar Edição</button>
                <div id="ghost-feedback" class="feedback-message" style="display: none;"></div>
            </form>
        </div>
        <div class="list-container">
            <h3>Fantasmas Cadastrados</h3>
            <div id="ghosts-list-container">
                <p>Carregando fantasmas...</p>
            </div>
        </div>
    `;
    container.innerHTML = content;

    const addGhostForm = document.getElementById('add-ghost-form');
    const saveGhostBtn = document.getElementById('save-ghost-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-ghost-btn');
    const feedbackElement = document.getElementById('ghost-feedback');
    const ghostsListContainer = document.getElementById('ghosts-list-container');
    const eventSelect = document.getElementById('ghost-event');
    const formTitle = container.querySelector('.form-container h3');

    let allEvents = {};
    let allGhosts = {};
    let editingGhostId = null; // Controla se estamos em modo de edição

    // Reseta o formulário para o modo de criação
    function resetForm() {
        addGhostForm.reset();
        editingGhostId = null;
        formTitle.textContent = 'Cadastrar Novo Fantasma';
        saveGhostBtn.textContent = 'Salvar Fantasma';
        cancelEditBtn.style.display = 'none';
    }

    // Popular o select de eventos
    eventManager.getEvents((events) => {
        allEvents = events;
        let options = '<option value="">Nenhum evento</option>';
        for (const key in events) {
            options += `<option value="${events[key].id}">${events[key].name}</option>`;
        }
        eventSelect.innerHTML = options;
        
        ghostManager.getGhosts((ghosts) => {
            allGhosts = ghosts;
            renderGhostsList(allGhosts, allEvents);
        });
    });

    // Salvar ou Atualizar fantasma
    addGhostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const ghostData = {
            name: document.getElementById('ghost-name').value,
            status: document.getElementById('ghost-status').value,
            type: document.getElementById('ghost-type').value,
            behavior: document.getElementById('ghost-behavior').value,
            scale: parseFloat(document.getElementById('ghost-scale').value) || 1.0,
            eventId: document.getElementById('ghost-event').value || null,
            modelUrl: document.getElementById('ghost-model-url').value,
        };

        if (!ghostData.modelUrl) {
            feedbackElement.textContent = 'A URL do modelo .glb é obrigatória.';
            feedbackElement.className = 'feedback-message error';
            feedbackElement.style.display = 'block';
            return;
        }

        saveGhostBtn.disabled = true;
        saveGhostBtn.textContent = 'Salvando...';
        feedbackElement.style.display = 'none';

        try {
            if (editingGhostId) {
                // ATUALIZAR fantasma existente
                await ghostManager.updateGhost(editingGhostId, ghostData);
                feedbackElement.textContent = 'Fantasma atualizado com sucesso!';
            } else {
                // CRIAR novo fantasma
                await ghostManager.addGhost(ghostData);
                feedbackElement.textContent = 'Fantasma salvo com sucesso!';
            }
            feedbackElement.className = 'feedback-message success';
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar fantasma:', error);
            feedbackElement.textContent = 'Erro ao salvar fantasma. Tente novamente.';
            feedbackElement.className = 'feedback-message error';
        } finally {
            saveGhostBtn.disabled = false;
            saveGhostBtn.textContent = editingGhostId ? 'Atualizar Fantasma' : 'Salvar Fantasma';
            feedbackElement.style.display = 'block';
        }
    });

    cancelEditBtn.addEventListener('click', resetForm);

    function renderGhostsList(ghosts, events) {
        if (Object.keys(ghosts).length === 0) {
            ghostsListContainer.innerHTML = '<p>Nenhum fantasma cadastrado.</p>';
            return;
        }

        const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Status</th>
                        <th>Tipo</th>
                        <th>Evento</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(ghosts).map(key => {
                        const ghost = ghosts[key];
                        const eventName = ghost.eventId && events[ghost.eventId] ? events[ghost.eventId].name : 'Nenhum';
                        return `
                            <tr>
                                <td>${ghost.name}</td>
                                <td><span class="status status-${ghost.status}">${ghost.status}</span></td>
                                <td>${ghost.type}</td>
                                <td>${eventName}</td>
                                <td class="actions-cell">
                                    <button class="btn-secondary edit-ghost-btn" data-ghost-id="${ghost.id}">Editar</button>
                                    <button class="btn-danger delete-ghost-btn" data-ghost-id="${ghost.id}">Excluir</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        ghostsListContainer.innerHTML = table;
    }

    // Listener para botões de Ação (Deletar e Editar)
    ghostsListContainer.addEventListener('click', async (e) => {
        const target = e.target;

        // Ação de Deletar
        if (target && target.classList.contains('delete-ghost-btn')) {
            const ghostId = target.getAttribute('data-ghost-id');
            if (confirm('Tem certeza que deseja excluir este fantasma?')) {
                try {
                    await ghostManager.deleteGhost(ghostId);
                } catch (error) {
                    console.error('Erro ao deletar fantasma:', error);
                    alert('Ocorreu um erro ao deletar o fantasma.');
                }
            }
        }

        // Ação de Editar
        if (target && target.classList.contains('edit-ghost-btn')) {
            const ghostId = target.getAttribute('data-ghost-id');
            const ghostToEdit = allGhosts[ghostId];

            if (ghostToEdit) {
                // Preencher o formulário
                document.getElementById('ghost-name').value = ghostToEdit.name;
                document.getElementById('ghost-model-url').value = ghostToEdit.modelUrl;
                document.getElementById('ghost-status').value = ghostToEdit.status;
                document.getElementById('ghost-type').value = ghostToEdit.type;
                document.getElementById('ghost-behavior').value = ghostToEdit.behavior;
                document.getElementById('ghost-scale').value = ghostToEdit.scale;
                document.getElementById('ghost-event').value = ghostToEdit.eventId || '';

                // Mudar para modo de edição
                editingGhostId = ghostId;
                formTitle.textContent = 'Editando Fantasma';
                saveGhostBtn.textContent = 'Atualizar Fantasma';
                cancelEditBtn.style.display = 'inline-block';
                window.scrollTo(0, 0); // Rola a página para o topo para ver o formulário
            }
        }
    });
}
