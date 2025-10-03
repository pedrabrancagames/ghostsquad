/**
 * Utilitários de Segurança
 * 
 * Funções para proteger informações sensíveis e garantir práticas seguras
 */

// Armazenar configuração do Firebase de forma mais segura
const SECURE_CONFIG = {
    // As chaves do Firebase Web são intencionalmente públicas e seguras para exposição no cliente
    // O Firebase usa mecanismos de segurança baseados em regras e autenticação
    firebase: {
        projectId: "ghostbusters-ar-game",
        authDomain: "ghostbusters-ar-game.firebaseapp.com",
        databaseURL: "https://ghostbusters-ar-game-default-rtdb.firebaseio.com",
        storageBucket: "ghostbusters-ar-game.appspot.com"
    },
    // Outras configurações seguras para o cliente
    game: {
        maxInactiveTime: 30 * 60 * 1000, // 30 minutos
        maxFailedLogins: 5,
        loginWindow: 10 * 60 * 1000 // 10 minutos
    }
};

/**
 * Função para obter configurações seguras
 * @param {string} section - Seção da configuração
 * @returns {Object} - Configuração solicitada
 */
function getSecureConfig(section) {
    if (section && SECURE_CONFIG[section]) {
        return JSON.parse(JSON.stringify(SECURE_CONFIG[section])); // Retorna cópia profunda
    }
    return JSON.parse(JSON.stringify(SECURE_CONFIG));
}

/**
 * Função para proteger dados sensíveis antes de exibi-los
 * @param {any} data - Dados a serem protegidos
 * @returns {any} - Dados com informações sensíveis mascaradas
 */
function protectSensitiveData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }

    // Criar uma cópia para não modificar os dados originais
    const protectedData = JSON.parse(JSON.stringify(data));

    // Mascara campos sensíveis
    if (protectedData.apiKey) {
        protectedData.apiKey = maskString(protectedData.apiKey);
    }
    if (protectedData.authToken) {
        protectedData.authToken = maskString(protectedData.authToken);
    }
    if (protectedData.refreshToken) {
        protectedData.refreshToken = maskString(protectedData.refreshToken);
    }
    if (protectedData.password) {
        protectedData.password = maskString(protectedData.password);
    }
    if (protectedData.token) {
        protectedData.token = maskString(protectedData.token);
    }

    return protectedData;
}

/**
 * Função para mascarar uma string sensível
 * @param {string} str - String a ser mascarada
 * @returns {string} - String mascarada
 */
function maskString(str) {
    if (typeof str !== 'string') {
        return str;
    }
    
    if (str.length <= 8) {
        return '*'.repeat(Math.max(1, str.length));
    }
    
    // Mostra os primeiros 2 e últimos 2 caracteres, mascara o resto
    return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
}

/**
 * Função para logar mensagens de forma segura, removendo dados sensíveis
 * @param {string} message - Mensagem a ser logada
 * @param {any} data - Dados adicionais (serão protegidos)
 * @param {string} level - Nível do log (log, warn, error)
 */
function secureLog(message, data, level = 'log') {
    const protectedData = protectSensitiveData(data);
    const logMessage = `[SECURE] ${message}`;
    
    switch (level) {
        case 'error':
            console.error(logMessage, protectedData);
            break;
        case 'warn':
            console.warn(logMessage, protectedData);
            break;
        case 'info':
            console.info(logMessage, protectedData);
            break;
        default:
            console.log(logMessage, protectedData);
    }
}

/**
 * Função para verificar se uma URL é segura para redirecionamento
 * @param {string} url - URL a ser verificada
 * @returns {boolean} - True se a URL for segura
 */
function isSafeRedirectUrl(url) {
    try {
        const parsedUrl = new URL(url, window.location.origin);
        const allowedDomains = [
            'localhost',
            '127.0.0.1',
            'pedrabrancagames.github.io',
            'ghostbusters-ar-game.web.app',
            'ghostbusters-ar-game.firebaseapp.com'
        ];
        
        return allowedDomains.some(domain => 
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );
    } catch (e) {
        // Se não for uma URL válida, não é segura
        return false;
    }
}

/**
 * Função para sanitizar entradas do usuário
 * @param {any} input - Entrada a ser sanitizada
 * @returns {any} - Entrada sanitizada
 */
function sanitizeInput(input) {
    if (typeof input === 'string') {
        // Remover scripts e HTML potencialmente perigosos
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remover scripts
            .replace(/javascript:/gi, '')  // Remover javascript:
            .replace(/vbscript:/gi, '')  // Remover vbscript:
            .replace(/on\w+\s*=/gi, '')  // Remover atributos de eventos
            .replace(/<[^>]*>/g, '')  // Remover outras tags HTML
            .trim();  // Remover espaços extras
    }
    
    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }
    
    if (input !== null && typeof input === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return input;
}

/**
 * Função para proteger o console de vazamento de informações
 */
function protectConsole() {
    // Armazenar referências originais
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    // Substituir métodos do console para proteger dados sensíveis
    console.log = function (...args) {
        const processedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return protectSensitiveData(arg);
            }
            return arg;
        });
        originalLog.apply(console, processedArgs);
    };
    
    console.error = function (...args) {
        const processedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return protectSensitiveData(arg);
            }
            return arg;
        });
        originalError.apply(console, processedArgs);
    };
    
    console.warn = function (...args) {
        const processedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return protectSensitiveData(arg);
            }
            return arg;
        });
        originalWarn.apply(console, processedArgs);
    };
    
    console.info = function (...args) {
        const processedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return protectSensitiveData(arg);
            }
            return arg;
        });
        originalInfo.apply(console, processedArgs);
    };
}

// Exportações ES6
export {
    getSecureConfig,
    protectSensitiveData,
    maskString,
    secureLog,
    isSafeRedirectUrl,
    sanitizeInput,
    protectConsole
};

// Exportar para compatibilidade CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSecureConfig,
        protectSensitiveData,
        maskString,
        secureLog,
        isSafeRedirectUrl,
        sanitizeInput,
        protectConsole
    };
}

// Se estiver no navegador, adicionar ao objeto global
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        getSecureConfig,
        protectSensitiveData,
        maskString,
        secureLog,
        isSafeRedirectUrl,
        sanitizeInput,
        protectConsole
    };
}