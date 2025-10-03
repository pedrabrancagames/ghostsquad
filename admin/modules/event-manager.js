/**
 * Módulo para gerenciar eventos no Firebase Realtime Database.
 */
export class EventManager {
    constructor(database) {
        this.db = database;
        this.eventsRef = this.db.ref('events');
    }

    /**
     * Adiciona um novo evento ao banco de dados.
     * @param {object} eventData - Dados do evento (nome, dataInicio, logoUrl, etc.).
     * @returns {Promise<void>}
     */
    async addEvent(eventData) {
        const newEventRef = this.eventsRef.push();
        eventData.id = newEventRef.key;
        return newEventRef.set(eventData);
    }

    /**
     * Busca todos os eventos e escuta por atualizações.
     * @param {function} callback - Função a ser chamada com os dados dos eventos.
     */
    getEvents(callback) {
        this.eventsRef.on('value', (snapshot) => {
            const events = snapshot.val() || {};
            callback(events);
        });
    }

    /**
     * Atualiza um evento existente.
     * @param {string} eventId - ID do evento a ser atualizado.
     * @param {object} eventData - Novos dados para o evento.
     * @returns {Promise<void>}
     */
    async updateEvent(eventId, eventData) {
        return this.eventsRef.child(eventId).update(eventData);
    }

    /**
     * Deleta um evento do banco de dados.
     * @param {string} eventId - ID do evento a ser deletado.
     * @returns {Promise<void>}
     */
    async deleteEvent(eventId) {
        return this.eventsRef.child(eventId).remove();
    }
}