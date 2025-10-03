/**
 * Módulo para gerenciar eventos no Firebase Realtime Database.
 */
export class EventManager {
    constructor(database) {
        this.db = database;
        this.eventsRef = this.db.ref('events');
    }

    /**
     * Adiciona um novo evento ao banco de dados com validação e sanitização.
     * @param {object} eventData - Dados do evento (nome, dataInicio, logoUrl, etc.).
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async addEvent(eventData, adminAuth) {
        // Verificar permissões
        if (!adminAuth || !adminAuth.hasPermission('event_create')) {
            throw new Error('Permissão negada: criar eventos');
        }

        // Validar e sanitizar os dados do evento
        const sanitizedEventData = await this.validateAndSanitizeEventData(eventData, adminAuth);
        
        // Adicionar o evento ao banco de dados
        const newEventRef = this.eventsRef.push();
        sanitizedEventData.id = newEventRef.key;
        sanitizedEventData.createdAt = new Date().toISOString();
        return newEventRef.set(sanitizedEventData);
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
     * Atualiza um evento existente com validação e sanitização.
     * @param {string} eventId - ID do evento a ser atualizado.
     * @param {object} eventData - Novos dados para o evento.
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async updateEvent(eventId, eventData, adminAuth) {
        // Verificar permissões
        if (!adminAuth || !adminAuth.hasPermission('event_edit')) {
            throw new Error('Permissão negada: editar eventos');
        }

        // Validar e sanitizar os dados do evento
        const sanitizedEventData = await this.validateAndSanitizeEventData(eventData, adminAuth);
        
        return this.eventsRef.child(eventId).update(sanitizedEventData);
    }

    /**
     * Deleta um evento do banco de dados.
     * @param {string} eventId - ID do evento a ser deletado.
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async deleteEvent(eventId, adminAuth) {
        // Verificar permissões
        if (!adminAuth || !adminAuth.hasPermission('event_delete')) {
            throw new Error('Permissão negada: deletar eventos');
        }
        
        return this.eventsRef.child(eventId).remove();
    }

    /**
     * Valida e sanitiza os dados do evento
     * @param {object} eventData - Dados do evento a serem validados
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<object>} - Dados do evento sanitizados
     */
    async validateAndSanitizeEventData(eventData, adminAuth) {
        if (!eventData) {
            throw new Error('Dados do evento são obrigatórios');
        }

        // Validar campos obrigatórios
        if (!eventData.name || typeof eventData.name !== 'string' || eventData.name.trim().length === 0) {
            throw new Error('Nome do evento é obrigatório e deve ser uma string não vazia');
        }

        if (!eventData.startDate || isNaN(Date.parse(eventData.startDate))) {
            throw new Error('Data de início do evento é obrigatória e deve ser uma data válida');
        }

        if (eventData.endDate && isNaN(Date.parse(eventData.endDate))) {
            throw new Error('Data de término do evento deve ser uma data válida');
        }

        // Sanitizar campos de string
        const sanitizedEventData = {
            name: this.sanitizeString(eventData.name),
            startDate: eventData.startDate,
            endDate: eventData.endDate || null
        };

        // Sanitizar campos opcionais
        if (eventData.description && typeof eventData.description === 'string') {
            sanitizedEventData.description = this.sanitizeString(eventData.description);
        }

        if (eventData.logoUrl && typeof eventData.logoUrl === 'string') {
            // Validar e sanitizar URL
            sanitizedEventData.logoUrl = this.validateAndSanitizeUrl(eventData.logoUrl);
        }

        if (eventData.active !== undefined) {
            sanitizedEventData.active = Boolean(eventData.active);
        }

        return sanitizedEventData;
    }

    /**
     * Sanitiza uma string
     * @param {string} str - String a ser sanitizada
     * @returns {string} - String sanitizada
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return '';
        }

        // Remover tags HTML e scripts potencialmente perigosos
        return str
            .replace(/<[^>]*>/g, '')  // Remover tags HTML
            .replace(/javascript:/gi, '')  // Remover javascript:
            .replace(/vbscript:/gi, '')  // Remover vbscript:
            .replace(/on\w+\s*=/gi, '')  // Remover atributos de eventos
            .replace(/[<>"'&]/g, function(match) {  // Sanitizar caracteres especiais
                return {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                }[match];
            })
            .trim();  // Remover espaços extras
    }

    /**
     * Valida e sanitiza uma URL
     * @param {string} url - URL a ser validada
     * @returns {string|undefined} - URL sanitizada ou undefined se inválida
     */
    validateAndSanitizeUrl(url) {
        if (typeof url !== 'string') {
            return undefined;
        }

        try {
            // Verificar se é uma URL válida
            const parsedUrl = new URL(url);
            
            // Permitir apenas HTTPS e HTTP
            if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
                return undefined;
            }
            
            // Verificar se o host parece ser válido
            if (!parsedUrl.hostname || parsedUrl.hostname.length > 255) {
                return undefined;
            }
            
            return url;
        } catch (e) {
            // Se não for uma URL válida, retornar undefined
            return undefined;
        }
    }
}