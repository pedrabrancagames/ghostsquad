// setupTests.js
// Configuração global para os testes

// Mock do módulo html5-qrcode
jest.mock('html5-qrcode', () => {
    return {
        Html5Qrcode: jest.fn().mockImplementation(() => {
            return {
                start: jest.fn().mockResolvedValue(),
                stop: jest.fn().mockResolvedValue(),
                isScanning: false
            };
        })
    };
});

// Mock do Firebase
jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js", () => ({
    getAuth: jest.fn(() => ({})),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
    signInWithPopup: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn()
}), { virtual: true });

jest.mock("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js", () => ({
    getDatabase: jest.fn(() => ({})),
    ref: jest.fn(() => ({})),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn()
}), { virtual: true });

// Mock do Leaflet (L)
global.L = {
    map: jest.fn(() => ({
        setView: jest.fn(),
        remove: jest.fn(),
        getZoom: jest.fn()
    })),
    tileLayer: jest.fn(() => ({
        addTo: jest.fn()
    })),
    marker: jest.fn(() => ({
        addTo: jest.fn(() => ({
            setLatLng: jest.fn(),
            setIcon: jest.fn()
        })),
        setLatLng: jest.fn(),
        remove: jest.fn()
    })),
    divIcon: jest.fn()
};

// Mock do AFRAME
global.AFRAME = {
    components: {
        'animation__rotation': {
            pause: jest.fn(),
            play: jest.fn(),
            currentTime: 0
        },
        'animation__bob': {
            pause: jest.fn(),
            play: jest.fn(),
            currentTime: 0
        }
    }
};

// Mock do document.getElementById
document.getElementById = jest.fn((id) => {
    // Retorna elementos reais para testes que precisam deles
    if (id === 'ghost-list') {
        const element = document.createElement('ul');
        element.appendChild = jest.fn();
        return element;
    }
    
    // Para outros elementos, retorna um mock simples
    return {
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
        },
        style: {},
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        innerText: '',
        innerHTML: '',
        value: '',
        disabled: false,
        src: '',
        alt: '',
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => false)
    };
});

// Mock de querySelectorAll para botões de localização
document.querySelectorAll = jest.fn((selector) => {
    if (selector === '.location-button') {
        return [
            { classList: { add: jest.fn(), remove: jest.fn() } },
            { classList: { add: jest.fn(), remove: jest.fn() } },
            { classList: { add: jest.fn(), remove: jest.fn() } }
        ];
    }
    return [];
});