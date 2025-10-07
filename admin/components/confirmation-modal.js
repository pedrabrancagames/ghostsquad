/**
 * Sistema de Modais de Confirmação
 * 
 * Componente responsável por exibir modais de confirmação para ações críticas.
 */

/**
 * Mostra um modal de confirmação
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem de confirmação
 * @param {Object} options - Opções do modal
 * @param {string} options.confirmText - Texto do botão de confirmação (padrão: "Confirmar")
 * @param {string} options.cancelText - Texto do botão de cancelamento (padrão: "Cancelar")
 * @param {string} options.confirmClass - Classe CSS para o botão de confirmação (padrão: "btn-primary")
 * @param {string} options.cancelClass - Classe CSS para o botão de cancelamento (padrão: "btn-secondary")
 * @returns {Promise<boolean>} - Promise que resolve com true se confirmado, false se cancelado
 */
export function showConfirmationModal(title, message, options = {}) {
    return new Promise((resolve) => {
        // Opções padrão
        const defaultOptions = {
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            confirmClass: 'btn-primary',
            cancelClass: 'btn-secondary'
        };
        
        // Mesclar opções
        const opts = { ...defaultOptions, ...options };
        
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'modal confirmation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-actions">
                    <button id="modal-confirm" class="${opts.confirmClass}">${opts.confirmText}</button>
                    <button id="modal-cancel" class="${opts.cancelClass}">${opts.cancelText}</button>
                </div>
            </div>
        `;
        
        // Adicionar ao documento
        document.body.appendChild(modal);
        
        // Configurar eventos
        const closeModal = (result) => {
            // Remover modal
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            // Resolver promise
            resolve(result);
        };
        
        // Botão de confirmação
        const confirmBtn = modal.querySelector('#modal-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => closeModal(true));
        }
        
        // Botão de cancelamento
        const cancelBtn = modal.querySelector('#modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(false));
        }
        
        // Botão de fechar
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(false));
        }
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(false);
            }
        });
        
        // Fechar ao pressionar ESC
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        
        document.addEventListener('keydown', handleEsc);
    });
}

/**
 * Mostra um modal de confirmação para ações destrutivas
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem de confirmação
 * @param {string} destructiveAction - Descrição da ação destrutiva
 * @returns {Promise<boolean>} - Promise que resolve com true se confirmado, false se cancelado
 */
export function showDestructiveConfirmation(title, message, destructiveAction) {
    return showConfirmationModal(title, message, {
        confirmText: `Sim, ${destructiveAction}`,
        cancelText: 'Cancelar',
        confirmClass: 'btn-danger',
        cancelClass: 'btn-secondary'
    });
}

/**
 * Mostra um modal de entrada de texto
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem do modal
 * @param {string} placeholder - Placeholder para o campo de texto
 * @param {string} defaultValue - Valor padrão para o campo de texto
 * @returns {Promise<string|null>} - Promise que resolve com o texto inserido ou null se cancelado
 */
export function showTextInputModal(title, message, placeholder = '', defaultValue = '') {
    return new Promise((resolve) => {
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'modal text-input-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <div class="form-group">
                        <input type="text" id="modal-input" placeholder="${placeholder}" value="${defaultValue}">
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="modal-confirm" class="btn-primary">Confirmar</button>
                    <button id="modal-cancel" class="btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
        
        // Adicionar ao documento
        document.body.appendChild(modal);
        
        // Focar no campo de texto
        const input = modal.querySelector('#modal-input');
        if (input) {
            setTimeout(() => {
                input.focus();
            }, 100);
        }
        
        // Configurar eventos
        const closeModal = (result) => {
            // Remover modal
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            // Resolver promise
            resolve(result);
        };
        
        // Botão de confirmação
        const confirmBtn = modal.querySelector('#modal-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const inputValue = input ? input.value : '';
                closeModal(inputValue);
            });
        }
        
        // Botão de cancelamento
        const cancelBtn = modal.querySelector('#modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(null));
        }
        
        // Botão de fechar
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(null));
        }
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(null);
            }
        });
        
        // Fechar ao pressionar ESC
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                closeModal(null);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        
        // Confirmar ao pressionar Enter
        const handleEnter = (event) => {
            if (event.key === 'Enter') {
                const inputValue = input ? input.value : '';
                closeModal(inputValue);
                document.removeEventListener('keydown', handleEnter);
            }
        };
        
        document.addEventListener('keydown', handleEsc);
        document.addEventListener('keydown', handleEnter);
    });
}