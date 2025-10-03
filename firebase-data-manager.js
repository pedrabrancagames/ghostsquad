import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/**
 * Gerencia a busca e filtragem de dados do jogo (fantasmas e eventos) do Firebase.
 */
export class FirebaseDataManager {
    constructor(database) {
        if (!database) {
            throw new Error("A instância do Firebase Database é necessária.");
        }
        this.db = database;
        this.eventsRef = ref(this.db, 'events');
        this.ghostsRef = ref(this.db, 'ghosts');
    }

    /**
     * Busca eventos e fantasmas do Firebase, filtra-os e retorna o conteúdo ativo.
     * @returns {Promise<{activeGhosts: object[], activeEvent: object|null}>}
     */
    async getActiveContent() {
        try {
            // Verificar origem para proteção
            if (window.location.origin !== 'https://pedrabrancagames.github.io' && 
                window.location.origin !== 'https://ghostbusters-ar-game.web.app' && 
                window.location.origin !== 'https://ghostbusters-ar-game.firebaseapp.com' &&
                !window.location.origin.includes('localhost')) {
                throw new Error('Acesso negado: origem não autorizada');
            }

            const [eventsSnapshot, ghostsSnapshot] = await Promise.all([
                get(this.eventsRef),
                get(this.ghostsRef)
            ]);

            const allEvents = eventsSnapshot.val() || {};
            const allGhosts = ghostsSnapshot.val() || {};

            // 1. Encontrar o evento ativo
            let activeEvent = null;
            const now = new Date();

            for (const eventId in allEvents) {
                const event = allEvents[eventId];
                
                // Validar estrutura do evento antes de processar
                if (!this.isValidEvent(event)) {
                    console.warn(`Evento ${eventId} tem estrutura inválida, pulando...`);
                    continue;
                }
                
                const startDate = new Date(`${event.startDate}T${event.startTime}`);
                const endDate = new Date(`${event.endDate}T${event.endTime}`);

                if (now >= startDate && now <= endDate) {
                    activeEvent = event;
                    break; // Assume que apenas um evento pode estar ativo por vez
                }
            }

            // 2. Filtrar os fantasmas
            const activeGhosts = Object.values(allGhosts).filter(ghost => {
                // Validar estrutura do fantasma antes de processar
                if (!this.isValidGhost(ghost)) {
                    console.warn('Fantasma tem estrutura inválida, pulando...');
                    return false;
                }
                
                // Fantasma deve estar ativo
                if (ghost.status !== 'ativo') {
                    return false;
                }

                // Se houver um evento ativo...
                if (activeEvent) {
                    // O fantasma é válido apenas se pertencer ao evento ativo
                    return ghost.eventId === activeEvent.id;
                } else {
                    // Se não houver evento ativo, apenas fantasmas sem eventId (ou com eventId vazio/null) são válidos
                    return !ghost.eventId || ghost.eventId === null || ghost.eventId === '';
                }
            });
            
            console.log('Conteúdo ativo carregado:', { activeGhosts, activeEvent });
            return { activeGhosts, activeEvent };

        } catch (error) {
            console.error("Erro ao buscar conteúdo ativo do Firebase:", error);
            return { activeGhosts: [], activeEvent: null }; // Retorna um estado seguro em caso de erro
        }
    }
    
    /**
     * Valida a estrutura de um evento
     * @param {object} event - Evento para validar
     * @returns {boolean} - True se o evento tem uma estrutura válida
     */
    isValidEvent(event) {
        if (!event || typeof event !== 'object') {
            return false;
        }
        
        // Verificar campos obrigatórios
        if (!event.name || typeof event.name !== 'string' || event.name.length === 0) {
            return false;
        }
        
        if (!event.startDate || typeof event.startDate !== 'string') {
            return false;
        }
        
        if (!event.startTime || typeof event.startTime !== 'string') {
            return false;
        }
        
        if (!event.endDate || typeof event.endDate !== 'string') {
            return false;
        }
        
        if (!event.endTime || typeof event.endTime !== 'string') {
            return false;
        }
        
        // Validar datas
        const startDate = new Date(`${event.startDate}T${event.startTime}`);
        const endDate = new Date(`${event.endDate}T${event.endTime}`);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Valida a estrutura de um fantasma
     * @param {object} ghost - Fantasma para validar
     * @returns {boolean} - True se o fantasma tem uma estrutura válida
     */
    isValidGhost(ghost) {
        if (!ghost || typeof ghost !== 'object') {
            return false;
        }
        
        // Verificar campos obrigatórios
        if (!ghost.name || typeof ghost.name !== 'string' || ghost.name.length === 0) {
            return false;
        }
        
        if (!ghost.type || typeof ghost.type !== 'string' || ghost.type.length === 0) {
            return false;
        }
        
        // Validar se campos são do tipo correto
        if (ghost.points !== undefined && typeof ghost.points !== 'number') {
            return false;
        }
        
        if (ghost.captureDuration !== undefined && typeof ghost.captureDuration !== 'number') {
            return false;
        }
        
        if (ghost.modelUrl !== undefined && typeof ghost.modelUrl !== 'string') {
            return false;
        }
        
        return true;
    }
}
