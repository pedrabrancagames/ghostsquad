/**
 * Sistema de Notificações
 * 
 * Classe responsável por gerenciar notificações e feedback visual para o usuário administrador.
 */

/**
 * Classe NotificationSystem
 * Gerencia a exibição de notificações na interface administrativa
 */
export class NotificationSystem {
    /**
     * Construtor do NotificationSystem
     */
    constructor() {
        // Criar container para notificações se não existir
        this.createNotificationContainer();
    }
    
    /**
     * Cria o container para notificações no DOM
     */
    createNotificationContainer() {
        // Verificar se o container já existe
        if (!document.querySelector('#notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }
    
    /**
     * Mostra uma notificação de sucesso
     * @param {string} message - Mensagem da notificação
     * @param {number} duration - Duração em milissegundos (padrão: 5000)
     */
    showSuccess(message, duration = 5000) {
        this.showNotification(message, 'success', duration);
    }
    
    /**
     * Mostra uma notificação de erro
     * @param {string} message - Mensagem da notificação
     * @param {number} duration - Duração em milissegundos (padrão: 7000)
     */
    showError(message, duration = 7000) {
        this.showNotification(message, 'error', duration);
    }
    
    /**
     * Mostra uma notificação de aviso
     * @param {string} message - Mensagem da notificação
     * @param {number} duration - Duração em milissegundos (padrão: 5000)
     */
    showWarning(message, duration = 5000) {
        this.showNotification(message, 'warning', duration);
    }
    
    /**
     * Mostra uma notificação de informação
     * @param {string} message - Mensagem da notificação
     * @param {number} duration - Duração em milissegundos (padrão: 5000)
     */
    showInfo(message, duration = 5000) {
        this.showNotification(message, 'info', duration);
    }
    
    /**
     * Mostra uma notificação
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo da notificação (success, error, warning, info)
     * @param {number} duration - Duração em milissegundos
     */
    showNotification(message, type, duration) {
        // Criar elemento da notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Adicionar conteúdo
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Adicionar ao container
        const container = document.querySelector('#notification-container');
        if (container) {
            container.appendChild(notification);
        }
        
        // Adicionar evento para fechar a notificação
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification);
            });
        }
        
        // Remover automaticamente após a duração especificada
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
    }
    
    /**
     * Remove uma notificação
     * @param {HTMLElement} notification - Elemento da notificação
     */
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            // Adicionar classe de animação de saída
            notification.classList.add('notification-out');
            
            // Remover após a animação
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    /**
     * Mostra uma notificação de confirmação
     * @param {string} message - Mensagem da notificação
     * @param {Function} onConfirm - Função a ser chamada quando o usuário confirmar
     * @param {Function} onCancel - Função a ser chamada quando o usuário cancelar
     * @returns {Promise<boolean>} - Promise que resolve com true se confirmado, false se cancelado
     */
    showConfirmation(message, onConfirm, onCancel) {
        return new Promise((resolve) => {
            // Criar modal de confirmação
            const modal = document.createElement('div');
            modal.className = 'confirmation-modal';
            modal.innerHTML = `
                <div class="confirmation-content">
                    <div class="confirmation-header">
                        <h3>Confirmação</h3>
                    </div>
                    <div class="confirmation-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirmation-actions">
                        <button id="confirm-btn" class="btn-primary">Confirmar</button>
                        <button id="cancel-btn" class="btn-secondary">Cancelar</button>
                    </div>
                </div>
            `;
            
            // Adicionar ao documento
            document.body.appendChild(modal);
            
            // Configurar eventos
            const confirmBtn = modal.querySelector('#confirm-btn');
            const cancelBtn = modal.querySelector('#cancel-btn');
            
            const close = (result) => {
                // Remover modal
                document.body.removeChild(modal);
                
                // Resolver promise
                resolve(result);
                
                // Chamar callbacks se fornecidos
                if (result && onConfirm) onConfirm();
                if (!result && onCancel) onCancel();
            };
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => close(true));
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => close(false));
            }
            
            // Fechar ao pressionar ESC
            const handleEsc = (event) => {
                if (event.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            
            document.addEventListener('keydown', handleEsc);
        });
    }
}

// Instância singleton do NotificationSystem
export const notificationSystem = new NotificationSystem();