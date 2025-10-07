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
                const startDate = new Date(`${event.startDate}T${event.startTime}`);
                const endDate = new Date(`${event.endDate}T${event.endTime}`);

                if (now >= startDate && now <= endDate) {
                    activeEvent = event;
                    break; // Assume que apenas um evento pode estar ativo por vez
                }
            }

            // 2. Filtrar os fantasmas
            const activeGhosts = Object.values(allGhosts).filter(ghost => {
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
}
