/**
 * Módulo para gerenciar fantasmas no Firebase Realtime Database.
 */
export class GhostManager {
    constructor(database) {
        this.db = database;
        this.ghostsRef = this.db.ref('ghosts');
    }

    /**
     * Adiciona um novo fantasma ao banco de dados com validação e sanitização.
     * @param {object} ghostData - Dados do fantasma (nome, tipo, status, modelUrl, etc.).
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async addGhost(ghostData, adminAuth) {
        // Verificar permissões
        if (!adminAuth || !adminAuth.hasPermission('ghost_create')) {
            throw new Error('Permissão negada: criar fantasmas');
        }

        // Validar e sanitizar os dados do fantasma
        const sanitizedGhostData = await this.validateAndSanitizeGhostData(ghostData, adminAuth);
        
        // Adicionar o fantasma ao banco de dados
        const newGhostRef = this.ghostsRef.push();
        sanitizedGhostData.id = newGhostRef.key;
        sanitizedGhostData.createdAt = new Date().toISOString();
        sanitizedGhostData.createdBy = adminAuth.getCurrentAdmin()?.uid;
        return newGhostRef.set(sanitizedGhostData);
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
     * Atualiza um fantasma existente com validação e sanitização.
     * @param {string} ghostId - ID do fantasma a ser atualizado.
     * @param {object} ghostData - Novos dados para o fantasma.
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async updateGhost(ghostId, ghostData, adminAuth) {
        // Verificar permissões
        if (!adminAuth || !adminAuth.hasPermission('ghost_edit')) {
            throw new Error('Permissão negada: editar fantasmas');
        }

        // Validar e sanitizar os dados do fantasma
        const sanitizedGhostData = await this.validateAndSanitizeGhostData(ghostData, adminAuth);
        sanitizedGhostData.updatedAt = new Date().toISOString();
        sanitizedGhostData.updatedBy = adminAuth.getCurrentAdmin()?.uid;
        
        return this.ghostsRef.child(ghostId).update(sanitizedGhostData);
    }

    /**
     * Deleta um fantasma do banco de dados.
     * @param {string} ghostId - ID do fantasma a ser deletado.
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<void>}
     */
    async deleteGhost(ghostId, adminAuth) {
        // Verificar permissões
        if (!adminAuth || !adminAuth.hasPermission('ghost_delete')) {
            throw new Error('Permissão negada: deletar fantasmas');
        }
        
        return this.ghostsRef.child(ghostId).remove();
    }

    /**
     * Valida e sanitiza os dados do fantasma
     * @param {object} ghostData - Dados do fantasma a serem validados
     * @param {Object} adminAuth - Instância do AdminAuthManager para verificação de permissões
     * @returns {Promise<object>} - Dados do fantasma sanitizados
     */
    async validateAndSanitizeGhostData(ghostData, adminAuth) {
        if (!ghostData) {
            throw new Error('Dados do fantasma são obrigatórios');
        }

        // Validar campos obrigatórios
        if (!ghostData.name || typeof ghostData.name !== 'string' || ghostData.name.trim().length === 0) {
            throw new Error('Nome do fantasma é obrigatório e deve ser uma string não vazia');
        }

        if (!ghostData.type || typeof ghostData.type !== 'string' || ghostData.type.trim().length === 0) {
            throw new Error('Tipo do fantasma é obrigatório e deve ser uma string não vazia');
        }

        if (ghostData.points !== undefined && (typeof ghostData.points !== 'number' || ghostData.points < 0)) {
            throw new Error('Pontos do fantasma devem ser um número não negativo');
        }

        if (ghostData.captureDuration !== undefined && (typeof ghostData.captureDuration !== 'number' || ghostData.captureDuration <= 0)) {
            throw new Error('Duração da captura do fantasma deve ser um número positivo');
        }

        if (ghostData.modelUrl && typeof ghostData.modelUrl !== 'string') {
            throw new Error('URL do modelo do fantasma deve ser uma string');
        }

        // Sanitizar campos de string
        const sanitizedGhostData = {
            name: this.sanitizeString(ghostData.name),
            type: this.sanitizeString(ghostData.type)
        };

        // Sanitizar campos opcionais
        if (ghostData.description && typeof ghostData.description === 'string') {
            sanitizedGhostData.description = this.sanitizeString(ghostData.description);
        }

        if (ghostData.modelUrl && typeof ghostData.modelUrl === 'string') {
            // Validar e sanitizar URL
            sanitizedGhostData.modelUrl = this.validateAndSanitizeUrl(ghostData.modelUrl);
        }

        if (ghostData.points !== undefined) {
            sanitizedGhostData.points = Number(ghostData.points);
        }

        if (ghostData.captureDuration !== undefined) {
            sanitizedGhostData.captureDuration = Number(ghostData.captureDuration);
        }

        if (ghostData.color && typeof ghostData.color === 'string') {
            sanitizedGhostData.color = this.sanitizeString(ghostData.color);
        }

        if (ghostData.active !== undefined) {
            sanitizedGhostData.active = Boolean(ghostData.active);
        }

        // Sanitizar array de habilidades se existir
        if (ghostData.abilities && Array.isArray(ghostData.abilities)) {
            sanitizedGhostData.abilities = ghostData.abilities.map(ability => this.sanitizeString(ability));
        }

        return sanitizedGhostData;
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