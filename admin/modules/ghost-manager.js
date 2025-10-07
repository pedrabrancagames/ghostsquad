/**
 * Módulo para gerenciar fantasmas no Firebase Realtime Database.
 */
export class GhostManager {
    constructor(database) {
        this.db = database;
        this.ghostsRef = this.db.ref('ghosts');
    }

    /**
     * Adiciona um novo fantasma ao banco de dados.
     * @param {object} ghostData - Dados do fantasma (nome, tipo, status, modelUrl, etc.).
     * @returns {Promise<void>}
     */
    async addGhost(ghostData) {
        const newGhostRef = this.ghostsRef.push();
        ghostData.id = newGhostRef.key;
        return newGhostRef.set(ghostData);
    }

    /**
     * Busca todos os fantasmas e escuta por atualizações.
     * @param {function} callback - Função a ser chamada com os dados dos fantasmas.
     */
    getGhosts(callback) {
        this.ghostsRef.on('value', (snapshot) => {
            const ghosts = snapshot.val() || {};
            callback(ghosts);
        });
    }

    /**
     * Atualiza um fantasma existente.
     * @param {string} ghostId - ID do fantasma a ser atualizado.
     * @param {object} ghostData - Novos dados para o fantasma.
     * @returns {Promise<void>}
     */
    async updateGhost(ghostId, ghostData) {
        return this.ghostsRef.child(ghostId).update(ghostData);
    }

    /**
     * Deleta um fantasma do banco de dados.
     * @param {string} ghostId - ID do fantasma a ser deletado.
     * @returns {Promise<void>}
     */
    async deleteGhost(ghostId) {
        return this.ghostsRef.child(ghostId).remove();
    }
}