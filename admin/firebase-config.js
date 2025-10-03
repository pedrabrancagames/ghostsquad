// Firebase configuration for admin panel
window.firebaseConfig = {
    apiKey: "AIzaSyC8DE4F6mU9oyRw8cLU5vcfxOp5RxLcgHA",
    authDomain: "ghostbusters-ar-game.firebaseapp.com",
    databaseURL: "https://ghostbusters-ar-game-default-rtdb.firebaseio.com",
    projectId: "ghostbusters-ar-game",
    storageBucket: "ghostbusters-ar-game.appspot.com",
    messagingSenderId: "4705887791",
    appId: "1:4705887791:web:a1a4e360fb9f8415be08da"
};

// Verificar origem para proteção CORS
if (window.location.origin !== 'https://pedrabrancagames.github.io' && 
    window.location.origin !== 'https://ghostbusters-ar-game.web.app' && 
    window.location.origin !== 'https://ghostbusters-ar-game.firebaseapp.com' &&
    !window.location.origin.includes('localhost')) {
    console.error('Acesso negado: origem não autorizada');
    // Opcional: redirecionar ou mostrar mensagem de erro
    // window.location.href = 'https://pedrabrancagames.github.io/ghostsquad/';
}

// Export for modules that may need it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.firebaseConfig;
}