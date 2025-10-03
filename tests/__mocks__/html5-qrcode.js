// Mock simples para html5-qrcode
const Html5Qrcode = jest.fn().mockImplementation(() => {
    return {
        start: jest.fn().mockResolvedValue(),
        stop: jest.fn().mockResolvedValue(),
        isScanning: false
    };
});

export { Html5Qrcode };