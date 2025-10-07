/**
 * @jest-environment jsdom
 */

// Mock da classe Html5Qrcode
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockIsScanning = false;

class MockHtml5Qrcode {
    constructor(elementId) {
        this.elementId = elementId;
    }
    
    async start(camera, config, onScanSuccess, onScanFailure) {
        return mockStart(camera, config, onScanSuccess, onScanFailure);
    }
    
    async stop() {
        return mockStop();
    }
    
    get isScanning() {
        return mockIsScanning;
    }
}

// Mock do módulo html5-qrcode
jest.mock('html5-qrcode', () => {
    return {
        Html5Qrcode: MockHtml5Qrcode
    };
}, { virtual: true });

import { QRManager } from '../qr-manager.js';

describe('QRManager', () => {
    let qrManager;

    beforeEach(() => {
        qrManager = new QRManager();
        jest.clearAllMocks();
    });

    describe('startQrScanner', () => {
        it('deve iniciar o scanner de QR Code corretamente', async () => {
            const qrReaderElementId = 'qr-reader';
            const onScanSuccess = jest.fn();
            const onError = jest.fn();
            
            // Configurar mock para resolver com sucesso
            mockStart.mockResolvedValue();
            
            await qrManager.startQrScanner(qrReaderElementId, onScanSuccess, onError);
            
            expect(qrManager.html5QrCode).toBeInstanceOf(MockHtml5Qrcode);
            expect(qrManager.html5QrCode.elementId).toBe(qrReaderElementId);
        });

        it('deve chamar onError quando falhar ao iniciar o scanner', async () => {
            const qrReaderElementId = 'qr-reader';
            const onScanSuccess = jest.fn();
            const onError = jest.fn();
            
            // Configurar mock para rejeitar com erro
            mockStart.mockRejectedValue(new Error('Failed to start'));
            
            await qrManager.startQrScanner(qrReaderElementId, onScanSuccess, onError);
            
            expect(onError).toHaveBeenCalled();
        });
    });

    describe('stopQrScanner', () => {
        it('deve parar o scanner de QR Code quando estiver escaneando', async () => {
            // Criar um mock específico para este teste
            const mockQrCodeInstance = {
                isScanning: true,
                stop: jest.fn().mockResolvedValue()
            };
            
            qrManager.html5QrCode = mockQrCodeInstance;
            
            await qrManager.stopQrScanner();
            
            expect(mockQrCodeInstance.stop).toHaveBeenCalled();
            expect(qrManager.html5QrCode).toBeNull();
        });

        it('não deve causar erro quando não há scanner ativo', async () => {
            qrManager.html5QrCode = null;
            
            await expect(qrManager.stopQrScanner()).resolves.toBeUndefined();
        });
    });

    describe('isContainmentUnit', () => {
        it('deve retornar true para QR Code válido', () => {
            const validQrCode = qrManager.CONTAINMENT_UNIT_ID;
            
            expect(qrManager.isContainmentUnit(validQrCode)).toBe(true);
        });

        it('deve retornar false para QR Code inválido', () => {
            const invalidQrCode = 'INVALID_QR_CODE';
            
            expect(qrManager.isContainmentUnit(invalidQrCode)).toBe(false);
        });
    });

    describe('getContainmentUnitId', () => {
        it('deve retornar o ID da unidade de contenção', () => {
            expect(qrManager.getContainmentUnitId()).toBe(qrManager.CONTAINMENT_UNIT_ID);
        });
    });
});