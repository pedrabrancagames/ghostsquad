/**
 * @jest-environment jsdom
 */

import { UIManager } from '../ui-manager.js';

describe('UIManager', () => {
    let uiManager;

    beforeEach(() => {
        uiManager = new UIManager();
        jest.clearAllMocks();
    });

    describe('initializeUIElements', () => {
        it('deve inicializar todos os elementos da interface', () => {
            uiManager.initializeUIElements();
            
            // Verificar que todos os elementos foram inicializados (não são null)
            expect(uiManager.loginScreen).toBeDefined();
            expect(uiManager.locationScreen).toBeDefined();
            expect(uiManager.gameUi).toBeDefined();
            expect(uiManager.inventoryModal).toBeDefined();
            expect(uiManager.qrScannerScreen).toBeDefined();
            expect(uiManager.notificationModal).toBeDefined();
            expect(uiManager.inventoryIconContainer).toBeDefined();
            expect(uiManager.inventoryBadge).toBeDefined();
            expect(uiManager.ghostList).toBeDefined();
            expect(uiManager.enterButton).toBeDefined();
            expect(uiManager.googleLoginButton).toBeDefined();
            expect(uiManager.closeInventoryButton).toBeDefined();
            expect(uiManager.depositButton).toBeDefined();
            expect(uiManager.closeScannerButton).toBeDefined();
            expect(uiManager.protonPackIcon).toBeDefined();
            expect(uiManager.protonPackProgressBar).toBeDefined();
            expect(uiManager.protonPackProgressFill).toBeDefined();
            expect(uiManager.notificationMessage).toBeDefined();
            expect(uiManager.notificationCloseButton).toBeDefined();
            expect(uiManager.minimapElement).toBeDefined();
            expect(uiManager.distanceInfo).toBeDefined();
            expect(uiManager.emailLoginScreen).toBeDefined();
            expect(uiManager.emailInput).toBeDefined();
            expect(uiManager.passwordInput).toBeDefined();
            expect(uiManager.authErrorMessage).toBeDefined();
            expect(uiManager.emailLoginShowButton).toBeDefined();
            expect(uiManager.anonymousLoginButton).toBeDefined();
            expect(uiManager.emailLoginButton).toBeDefined();
            expect(uiManager.emailSignupButton).toBeDefined();
            expect(uiManager.backToMainLoginButton).toBeDefined();
        });
    });

    describe('updateInventoryUI', () => {
        beforeEach(() => {
            // Criar elementos mock para inventoryBadge e ghostList
            uiManager.inventoryBadge = {
                innerText: ''
            };
            
            uiManager.ghostList = {
                innerHTML: '',
                appendChild: jest.fn()
            };
            
            uiManager.depositButton = {
                style: {
                    display: ''
                }
            };
        });

        it('deve atualizar a interface do inventário quando vazio', () => {
            const inventory = [];
            const inventoryLimit = 5;
            
            uiManager.updateInventoryUI(inventory, inventoryLimit);
            
            expect(uiManager.inventoryBadge.innerText).toBe('0/5');
            expect(uiManager.ghostList.innerHTML).toBe('<li>Inventário vazio.</li>');
            expect(uiManager.depositButton.style.display).toBe('none');
        });

        it('deve atualizar a interface do inventário com itens', () => {
            const inventory = [
                { id: 1, type: 'Fantasma Comum', points: 10 },
                { id: 2, type: 'Fantasma Forte', points: 25 }
            ];
            const inventoryLimit = 5;
            
            uiManager.updateInventoryUI(inventory, inventoryLimit);
            
            expect(uiManager.inventoryBadge.innerText).toBe('2/5');
            expect(uiManager.ghostList.innerHTML).not.toBe('<li>Inventário vazio.</li>');
            expect(uiManager.depositButton.style.display).toBe('block');
            // Verificar que appendChild foi chamado para cada item
            expect(uiManager.ghostList.appendChild).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateProtonPackProgress', () => {
        beforeEach(() => {
            uiManager.protonPackProgressFill = {
                style: {
                    height: ''
                }
            };
        });

        it('deve atualizar a altura do preenchimento da barra de progresso', () => {
            const progress = 0.5;
            
            uiManager.updateProtonPackProgress(progress);
            
            expect(uiManager.protonPackProgressFill.style.height).toBe('50%');
        });
    });

    describe('showProtonPackProgress e hideProtonPackProgress', () => {
        beforeEach(() => {
            uiManager.protonPackProgressBar = {
                style: {
                    display: ''
                }
            };
            uiManager.protonPackProgressFill = {
                style: {
                    height: ''
                }
            };
        });

        it('deve mostrar e esconder a barra de progresso', () => {
            uiManager.showProtonPackProgress();
            expect(uiManager.protonPackProgressBar.style.display).toBe('block');
            
            uiManager.hideProtonPackProgress();
            expect(uiManager.protonPackProgressBar.style.display).toBe('none');
            expect(uiManager.protonPackProgressFill.style.height).toBe('0%');
        });
    });

    describe('showNotification e hideNotification', () => {
        beforeEach(() => {
            uiManager.notificationMessage = {
                textContent: ''
            };
            uiManager.notificationModal = {
                classList: {
                    remove: jest.fn(),
                    add: jest.fn()
                }
            };
        });

        it('deve mostrar e esconder notificações', () => {
            const message = 'Test notification';
            
            uiManager.showNotification(message);
            expect(uiManager.notificationMessage.textContent).toBe(message);
            expect(uiManager.notificationModal.classList.remove).toHaveBeenCalledWith('hidden');
            
            uiManager.hideNotification();
            expect(uiManager.notificationModal.classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    describe('updateDistanceInfo', () => {
        beforeEach(() => {
            uiManager.distanceInfo = {
                innerText: '',
                style: {
                    color: ''
                }
            };
        });

        it('deve atualizar as informações de distância', () => {
            const text = 'Fantasma próximo!';
            const color = '#ff0000';
            
            uiManager.updateDistanceInfo(text, color);
            
            expect(uiManager.distanceInfo.innerText).toBe(text);
            expect(uiManager.distanceInfo.style.color).toBe(color);
        });
    });

    describe('setEnterButtonEnabled', () => {
        beforeEach(() => {
            uiManager.enterButton = {
                disabled: false,
                style: {
                    display: ''
                }
            };
        });

        it('deve habilitar e desabilitar o botão de entrar', () => {
            uiManager.setEnterButtonEnabled(true);
            expect(uiManager.enterButton.disabled).toBe(false);
            expect(uiManager.enterButton.style.display).toBe('block');
            
            uiManager.setEnterButtonEnabled(false);
            expect(uiManager.enterButton.disabled).toBe(true);
            expect(uiManager.enterButton.style.display).toBe('none');
        });
    });

    describe('selectLocationButton', () => {
        it('deve marcar um botão de localização como selecionado', () => {
            const mockButton = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
            
            // Mock de querySelectorAll para retornar uma lista de botões
            document.querySelectorAll = jest.fn(() => [
                { classList: { remove: jest.fn() } },
                { classList: { remove: jest.fn() } }
            ]);
            
            uiManager.selectLocationButton(mockButton);
            
            expect(mockButton.classList.add).toHaveBeenCalledWith('selected');
        });
    });

    describe('updateAuthErrorMessage', () => {
        beforeEach(() => {
            uiManager.authErrorMessage = {
                textContent: ''
            };
        });

        it('deve atualizar a mensagem de erro de autenticação', () => {
            const message = 'Erro de autenticação';
            
            uiManager.updateAuthErrorMessage(message);
            
            expect(uiManager.authErrorMessage.textContent).toBe(message);
        });
    });

    describe('clearAuthInputs', () => {
        beforeEach(() => {
            uiManager.emailInput = {
                value: ''
            };
            uiManager.passwordInput = {
                value: ''
            };
        });

        it('deve limpar os campos de entrada de email e senha', () => {
            uiManager.emailInput.value = 'test@example.com';
            uiManager.passwordInput.value = 'password123';
            
            uiManager.clearAuthInputs();
            
            expect(uiManager.emailInput.value).toBe('');
            expect(uiManager.passwordInput.value).toBe('');
        });
    });
});