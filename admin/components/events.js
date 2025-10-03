/**
 * Componente para gerenciar a UI de Eventos.
 * Renderiza o formulário de cadastro e a lista de eventos.
 */
export function initEvents(container, eventManager) {
    const content = `
        <div class="form-container">
            <h3>Cadastrar Novo Evento</h3>
            <form id="add-event-form">
                <div class="form-group">
                    <label for="event-name">Nome do Evento</label>
                    <input type="text" id="event-name" required>
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label for="event-start-date">Data de Início</label>
                        <input type="date" id="event-start-date" required>
                    </div>
                    <div class="form-group">
                        <label for="event-start-time">Horário de Início</label>
                        <input type="time" id="event-start-time" required>
                    </div>
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label for="event-end-date">Data de Término</label>
                        <input type="date" id="event-end-date" required>
                    </div>
                    <div class="form-group">
                        <label for="event-end-time">Horário de Término</label>
                        <input type="time" id="event-end-time" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="event-logo-url">URL da Logo do Evento (Opcional)</label>
                    <input type="url" id="event-logo-url" placeholder="https://.../logo.png">
                </div>
                <button type="submit" id="save-event-btn">Salvar Evento</button>
                <button type="button" id="cancel-edit-btn" class="btn-secondary" style="display: none; margin-left: 10px;">Cancelar Edição</button>
                <div id="event-feedback" class="feedback-message" style="display: none;"></div>
            </form>
        </div>
        <div class="list-container">
            <h3>Eventos Cadastrados</h3>
            <div id="events-list-container">
                <p>Carregando eventos...</p>
            </div>
        </div>
    `;
    container.innerHTML = content;

    const addEventForm = document.getElementById('add-event-form');
    const saveEventBtn = document.getElementById('save-event-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const feedbackElement = document.getElementById('event-feedback');
    const eventsListContainer = document.getElementById('events-list-container');

    // Cancelar edição
    cancelEditBtn.addEventListener('click', () => {
        addEventForm.reset();
        saveEventBtn.textContent = 'Salvar Evento';
        saveEventBtn.removeAttribute('data-editing-id');
        cancelEditBtn.style.display = 'none';
        feedbackElement.style.display = 'none';
    });

    // Salvar evento
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const eventData = {
            name: document.getElementById('event-name').value,
            startDate: document.getElementById('event-start-date').value,
            startTime: document.getElementById('event-start-time').value,
            endDate: document.getElementById('event-end-date').value,
            endTime: document.getElementById('event-end-time').value,
            logoUrl: document.getElementById('event-logo-url').value || null,
        };

        // Verificar se estamos editando um evento existente
        const editingEventId = saveEventBtn.getAttribute('data-editing-id');
        const isEditing = !!editingEventId;

        // Feedback visual
        saveEventBtn.disabled = true;
        saveEventBtn.textContent = isEditing ? 'Atualizando...' : 'Salvando...';
        feedbackElement.style.display = 'none';

        try {
            if (isEditing) {
                // Atualizar evento existente
                await eventManager.updateEvent(editingEventId, eventData);
                feedbackElement.textContent = 'Evento atualizado com sucesso!';
                // Remover atributo de edição
                saveEventBtn.removeAttribute('data-editing-id');
                // Resetar texto do botão
                saveEventBtn.textContent = 'Salvar Evento';
                // Esconder botão de cancelar
                cancelEditBtn.style.display = 'none';
            } else {
                // Criar novo evento
                await eventManager.addEvent(eventData);
                feedbackElement.textContent = 'Evento salvo com sucesso!';
                addEventForm.reset();
            }
            feedbackElement.className = 'feedback-message success';
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            feedbackElement.textContent = 'Erro ao salvar evento. Tente novamente.';
            feedbackElement.className = 'feedback-message error';
        } finally {
            saveEventBtn.disabled = false;
            if (!isEditing) {
                saveEventBtn.textContent = 'Salvar Evento';
            } else {
                saveEventBtn.textContent = 'Atualizar Evento';
            }
            feedbackElement.style.display = 'block';
        }
    });

    // Listar eventos
    eventManager.getEvents((events) => {
        renderEventsList(events);
    });

    function renderEventsList(events) {
        if (Object.keys(events).length === 0) {
            eventsListContainer.innerHTML = '<p>Nenhum evento cadastrado.</p>';
            return;
        }

        const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Logo</th>
                        <th>Nome</th>
                        <th>Início</th>
                        <th>Término</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(events).map(key => {
                        const event = events[key];
                        const logo = event.logoUrl ? `<img src="${event.logoUrl}" alt="Logo" width="50">` : 'N/A';
                        const startDate = new Date(`${event.startDate}T${event.startTime}`).toLocaleString('pt-BR');
                        const endDate = new Date(`${event.endDate}T${event.endTime}`).toLocaleString('pt-BR');
                        return `
                            <tr>
                                <td>${logo}</td>
                                <td>${event.name}</td>
                                <td>${startDate}</td>
                                <td>${endDate}</td>
                                <td>
                                    <button class="btn-secondary edit-event-btn" data-event-id="${event.id}" data-event-data='${JSON.stringify(event)}'>Editar</button>
                                    <button class="btn-danger delete-event-btn" data-event-id="${event.id}">Excluir</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        eventsListContainer.innerHTML = table;
    }

    // Deletar evento
    eventsListContainer.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('delete-event-btn')) {
            const eventId = e.target.getAttribute('data-event-id');
            if (confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
                try {
                    await eventManager.deleteEvent(eventId);
                    // A lista será atualizada automaticamente pelo listener do getEvents
                } catch (error) {
                    console.error('Erro ao deletar evento:', error);
                    alert('Ocorreu um erro ao deletar o evento.');
                }
            }
        }
        
        // Editar evento
        if (e.target && e.target.classList.contains('edit-event-btn')) {
            const eventData = JSON.parse(e.target.getAttribute('data-event-data'));
            populateEventForm(eventData);
        }
    });

    // Preencher o formulário com os dados do evento para edição
    function populateEventForm(eventData) {
        document.getElementById('event-name').value = eventData.name;
        document.getElementById('event-start-date').value = eventData.startDate;
        document.getElementById('event-start-time').value = eventData.startTime;
        document.getElementById('event-end-date').value = eventData.endDate;
        document.getElementById('event-end-time').value = eventData.endTime;
        document.getElementById('event-logo-url').value = eventData.logoUrl || '';
        
        // Mudar o texto do botão e adicionar atributo para identificar edição
        saveEventBtn.textContent = 'Atualizar Evento';
        saveEventBtn.setAttribute('data-editing-id', eventData.id);
        
        // Mostrar botão de cancelar
        cancelEditBtn.style.display = 'inline-block';
    }
}
