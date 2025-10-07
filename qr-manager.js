/**
 * QR Manager - Ghost Squad
 * Gerencia o scanner de QR Code para depositar fantasmas na unidade de contenção
 */

export class QRManager {
    constructor() {
        this.html5QrCode = null;
        this.CONTAINMENT_UNIT_ID = "GHOSTBUSTERS_CONTAINMENT_UNIT_01";
    }

    // Inicia o scanner de QR Code
    async startQrScanner(qrReaderElementId, onScanSuccess, onError) {
        try {
            // Verifica se Html5Qrcode está disponível globalmente
            if (typeof Html5Qrcode === 'undefined') {
                throw new Error('Html5Qrcode não está disponível. Verifique se a biblioteca foi carregada corretamente.');
            }
            
            // Limpa instância anterior se existir
            if (this.html5QrCode) {
                await this.stopQrScanner();
            }

            // Cria nova instância
            this.html5QrCode = new Html5Qrcode(qrReaderElementId);
            
            // Inicia o scanner
            await this.html5QrCode.start(
                { facingMode: "environment" },
                { 
                    fps: 10, 
                    qrbox: 250 
                },
                onScanSuccess,
                (errorMessage) => {
                    // Erros de leitura são normais e não precisam ser tratados
                    console.debug("QR scan debug:", errorMessage);
                }
            );
        } catch (err) {
            console.error("Erro ao iniciar scanner de QR Code:", err);
            if (onError) onError(err);
        }
    }

    // Para o scanner de QR Code
    async stopQrScanner() {
        if (this.html5QrCode && this.html5QrCode.isScanning) {
            try {
                await this.html5QrCode.stop();
            } catch (err) {
                console.warn("Falha ao parar o scanner de QR Code:", err);
            } finally {
                this.html5QrCode = null;
            }
        }
    }

    // Verifica se o QR Code escaneado é válido
    isContainmentUnit(qrCodeText) {
        return qrCodeText === this.CONTAINMENT_UNIT_ID;
    }

    // Obtém o ID da unidade de contenção
    getContainmentUnitId() {
        return this.CONTAINMENT_UNIT_ID;
    }
}