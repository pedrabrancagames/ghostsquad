import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

// Importar os novos módulos
import { AuthManager } from './auth-manager.js';
import { GameStateManager } from './game-state.js';
import { ARManager } from './ar-manager.js';
import { UIManager } from './ui-manager.js';
import { MapManager } from './map-manager.js';
import { QRManager } from './qr-manager.js';
import { RankingsManager } from './rankings.js';
import { FirebaseDataManager } from './firebase-data-manager.js';

AFRAME.registerComponent('game-manager', {
    init: async function () {
        console.log('Inicializando game-manager...');
        this.uiManager = new UIManager();
        this.uiManager.initializeUIElements(this);

        await this.preloadAssets();

        this.firebaseConfig = {
            apiKey: "AIzaSyAHVatoCWMcCWLzJfH993OOVRS04S3f3oI",
            authDomain: "ghostfire-bbb16.firebaseapp.com",
            databaseURL: "https://ghostfire-bbb16-default-rtdb.firebaseio.com",
            projectId: "ghostfire-bbb16",
            storageBucket: "ghostfire-bbb16.appspot.com",
            messagingSenderId: "149492792943",
            appId: "1:149492792943:web:9db199904a4daf7c0e979a"
        };

        // Inicializa os módulos na ordem correta
        this.authManager = new AuthManager(this);
        this.gameState = new GameStateManager();
        this.arManager = new ARManager();
        this.mapManager = new MapManager();
        this.qrManager = new QRManager();
        this.rankingsManager = new RankingsManager(this);

        // Deixa o AuthManager inicializar o Firebase e nos devolver as instâncias
        const { auth, database } = this.authManager.initializeApp(this.firebaseConfig);
        this.auth = auth;
        this.database = database;

        // Agora inicializa os outros managers que dependem do Firebase
        this.firebaseDataManager = new FirebaseDataManager(this.database);
        this.gameState.setFirebaseDatabase(this.database);

        this.arManager.initializeARElements();
        this.mapManager.setMinimapElement(this.uiManager.minimapElement);
        this.rankingsManager.initializeRankingsElements();
        
        this.bindMethods();
        this.uiManager.addEventListeners(this);

        this.gameInitialized = false;
        this.currentUser = null;
        this.isCapturing = false;
        this.captureTimer = null;
        this.progressInterval = null;

        this.protonBeamSound = document.getElementById('proton-beam-sound');
        this.ghostCaptureSound = document.getElementById('ghost-capture-sound');
        this.inventoryFullSound = document.getElementById('inventory-full-sound');
        
        console.log('game-manager inicializado com sucesso');
    },

    bindMethods: function () {
        this.onAuthStateChanged = this.authManager.onAuthStateChanged.bind(this.authManager);
        this.updateInventoryUI = this.updateInventoryUI.bind(this);
        this.depositGhosts = this.depositGhosts.bind(this);
        this.onScanSuccess = this.onScanSuccess.bind(this);
        this.startQrScanner = this.startQrScanner.bind(this);
        this.stopQrScanner = this.stopQrScanner.bind(this);
        this.showNotification = this.uiManager.showNotification.bind(this.uiManager);
        this.hideNotification = this.uiManager.hideNotification.bind(this.uiManager);
        this.initGame = this.initGame.bind(this);
        this.initMap = this.initMap.bind(this);
        this.showEcto1OnMap = this.showEcto1OnMap.bind(this);
        this.generateGhost = this.generateGhost.bind(this);
        this.startGps = this.startGps.bind(this);
        this.onGpsUpdate = this.onGpsUpdate.bind(this);
        this.checkProximity = this.checkProximity.bind(this);
        this.startCapture = this.startCapture.bind(this);
        this.cancelCapture = this.cancelCapture.bind(this);
        this.ghostCaptured = this.ghostCaptured.bind(this);
        this.setupHitTest = this.arManager.setupHitTest.bind(this.arManager);
        this.placeObject = this.arManager.placeObject.bind(this.arManager);
        this.tick = this.tick.bind(this);

    },

    preloadAssets: function () {
        return new Promise((resolve) => {
            const loadingInfo = document.getElementById('loading-info');
            loadingInfo.innerText = 'Autenticação necessária para caçar.';
            document.getElementById('loading-bar-container').classList.add('hidden');
            document.getElementById('auth-buttons-container').classList.remove('hidden');
            document.getElementById('admin-link-container').classList.remove('hidden');
            resolve();
        });
    },

    updateInventoryUI: function () {
        this.uiManager.updateInventoryUI(
            this.gameState.getInventory(),
            this.gameState.INVENTORY_LIMIT
        );
    },

    depositGhosts: function () {
        if (window.visualEffectsSystem) {
            const qrRect = document.getElementById('qr-reader').getBoundingClientRect();
            window.visualEffectsSystem.showCelebrationEffect(qrRect.left + qrRect.width / 2, qrRect.top + qrRect.height / 2, 'ghost_captured');
        }
        
        if (window.notificationSystem) {
            window.notificationSystem.success(`${this.gameState.getInventory().length} fantasmas depositados com sucesso! +${this.gameState.getInventory().reduce((total, ghost) => total + ghost.points, 0)} pontos`, { duration: 5000 });
        }
        
        this.gameState.clearInventory();
        const userRef = ref(this.database, 'users/' + this.currentUser.uid);
        update(userRef, { inventory: this.gameState.getInventory() });

        // Atualizar o ranking após depositar fantasmas
        this.updateRankings();

        this.updateInventoryUI();
        this.generateGhost();
    },

    onScanSuccess: function (decodedText, decodedResult) {
        this.stopQrScanner();
        if (this.qrManager.isContainmentUnit(decodedText)) {
            this.depositGhosts();
        } else {
            if (window.notificationSystem) {
                window.notificationSystem.error("QR Code inválido! Procure pela unidade de contenção oficial.");
            } else {
                alert("QR Code inválido!");
            }
        }
    },

    startQrScanner: async function () {
        this.uiManager.inventoryModal.classList.add('hidden');
        if (this.el.sceneEl.is('ar-mode')) {
            try {
                await this.el.sceneEl.exitVR();
            } catch (e) {
                console.error("Falha ao sair do modo AR.", e);
            }
        }
        setTimeout(() => {
            this.uiManager.gameUi.classList.add('hidden');
            this.uiManager.showScreen('qrScanner');
            this.qrManager.startQrScanner("qr-reader", this.onScanSuccess, (err) => {
                this.uiManager.showNotification("Erro ao iniciar scanner de QR Code. Verifique as permissões da câmera no navegador.");
                this.stopQrScanner();
            });
        }, 500);
    },

    stopQrScanner: function () {
        this.qrManager.stopQrScanner();
        this.uiManager.qrScannerScreen.classList.add('hidden');
        this.uiManager.locationScreen.classList.remove('hidden');
        this.uiManager.gameUi.classList.add('hidden');
    },

    initGame: async function () {
        console.log('Carregando conteúdo dinâmico do Firebase...');
        this.uiManager.showLoadingOnEnterButton(true);

        const { activeGhosts, activeEvent } = await this.firebaseDataManager.getActiveContent();
        this.gameState.setActiveContent(activeGhosts, activeEvent);

        if (activeEvent && activeEvent.logoUrl) {
            this.uiManager.setGameLogo(activeEvent.logoUrl);
            console.log(`Evento "${activeEvent.name}" ativo. Logo do jogo alterada.`);
        }

        if (activeGhosts.length === 0) {
            this.uiManager.showNotification("Nenhum fantasma ativo no momento. Volte mais tarde!");
            this.uiManager.showLoadingOnEnterButton(false);
            return;
        }

        this.uiManager.showLoadingOnEnterButton(false);
        console.log('Iniciando jogo...');
        this.gameInitialized = true;
        this.uiManager.locationScreen.classList.add('hidden');
        this.uiManager.gameUi.classList.remove('hidden');
        this.initMap();

        const sceneEl = this.el.sceneEl;
        sceneEl.addEventListener('enter-vr', () => {
            if (sceneEl.is('ar-mode')) this.setupHitTest(sceneEl);
        });

        try {
            await sceneEl.enterVR(true);
        } catch (e) {
            console.error("Não foi possível iniciar a sessão AR.", e);
        }
    },

    initMap: function () {
        const selectedLocation = this.gameState.getSelectedLocation();
        if (selectedLocation) {
            this.mapManager.initMap(selectedLocation, this.gameState.isEcto1Unlocked(), this.showEcto1OnMap);
            this.generateGhost();
            this.startGps();
        } else {
            console.error('Nenhuma localização selecionada para inicializar o mapa');
        }
    },

    showEcto1OnMap: function () {
        this.mapManager.showEcto1OnMap(this.gameState.getEcto1Position());
    },

    generateGhost: function () {
        if (this.gameState.isInventoryFull()) {
            this.uiManager.updateDistanceInfo("Inventário Cheio!");
            this.mapManager.removeGhostMarker();
            return;
        }
        
        const ghostData = this.gameState.generateGhost();
        this.currentGhostData = ghostData; // Armazena os dados do fantasma atual

        if (ghostData) {
            this.mapManager.updateGhostMarker(ghostData);
        } else {
            this.uiManager.updateDistanceInfo("Não há fantasmas por perto. Explore a área!");
            this.mapManager.removeGhostMarker();
        }
    },

    startGps: function () {
        navigator.geolocation.watchPosition(this.onGpsUpdate, () => { 
            this.uiManager.showNotification("Não foi possível obter sua localização."); 
        }, { enableHighAccuracy: true });
    },

    onGpsUpdate: function (position) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        this.mapManager.updatePlayerPosition(userLat, userLon);
        this.checkProximity(userLat, userLon);
    },

    checkProximity: function (userLat, userLon) {
        const result = this.mapManager.checkProximity(userLat, userLon, this.currentGhostData, this.gameState.getEcto1Position(), this.gameState.isEcto1Unlocked(), this.gameState.INVENTORY_LIMIT, this.gameState.getInventory(), this.gameState.currentHuntingRadius);

        if (result.distanceInfo) {
            this.uiManager.updateDistanceInfo(result.distanceInfo, result.isNearObject ? (result.objectToPlace === 'ghost' ? "#ff0000" : "#00aaff") : "#92F428");
        }

        this.arManager.setObjectToPlace(result.objectToPlace, this.currentGhostData);

        if (result.isNearGhost !== undefined) {
            this.uiManager.minimapElement.classList.toggle('near-ghost', result.isNearGhost);
        }
    },

    startCapture: function () {
        if (this.isCapturing || !this.arManager.isObjectPlaced('ghost') || this.gameState.isInventoryFull()) return;

        this.arManager.pauseGhostAnimations();
        this.isCapturing = true;
        this.protonBeamSound.play();
        
        if (window.visualEffectsSystem) window.visualEffectsSystem.startProtonBeamEffect();
        if (window.animationManager) this.protonFireAnimation = window.animationManager.animateProtonPackFire(this.uiManager.protonPackIcon);

        this.uiManager.showProtonPackProgress();
        let startTime = Date.now();
        const duration = this.currentGhostData.captureDuration;
        
        this.progressInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            this.uiManager.updateProtonPackProgress(progress);
        }, 100);

        this.captureTimer = setTimeout(() => { this.ghostCaptured(); }, duration);
    },

    cancelCapture: function () {
        if (!this.isCapturing) return;
        this.isCapturing = false;
        this.protonBeamSound.pause();
        this.protonBeamSound.currentTime = 0;
        
        if (window.visualEffectsSystem) window.visualEffectsSystem.stopProtonBeamEffect();
        if (this.protonFireAnimation) this.protonFireAnimation.stop();
        
        clearTimeout(this.captureTimer);
        clearInterval(this.progressInterval);
        this.uiManager.hideProtonPackProgress();
        this.arManager.resumeGhostAnimations();
    },

    ghostCaptured: function () {
        this.cancelCapture();
        this.ghostCaptureSound.play();
        
        if (window.visualEffectsSystem && window.visualEffectsSystem.isInitialized) {
            window.visualEffectsSystem.showCelebrationEffect(window.innerWidth / 2, window.innerHeight / 2, 'ghost_captured');
        }

        if (window.visualEffectsSystem) {
            const inventoryRect = this.uiManager.inventoryIconContainer.getBoundingClientRect();
            window.visualEffectsSystem.showSuctionEffect(window.innerWidth / 2, window.innerHeight / 2, inventoryRect.left + inventoryRect.width / 2, inventoryRect.top + inventoryRect.height / 2);
        }
        
        if (this.arManager.dynamicGhostEntity && window.animationManager) {
            window.animationManager.animateGhostCapture(this.arManager.dynamicGhostEntity);
        }
        
        if (window.notificationSystem && window.notificationSystem.isInitialized) {
            window.notificationSystem.ghostCaptured(this.currentGhostData.name, this.currentGhostData.points);
        }
        
        if (this.arManager.dynamicGhostEntity) {
            this.arManager.dynamicGhostEntity.setAttribute('visible', false);
        }
        
        this.arManager.resetPlacementState();

        const ghostData = this.currentGhostData;
        this.gameState.addGhostToInventory({ id: Date.now(), type: ghostData.name, points: ghostData.points });
        const userStats = this.gameState.updateUserStats(ghostData.points, 1);
        this.updateInventoryUI();

        if (this.gameState.isInventoryFull()) {
            this.inventoryFullSound.play();
            if (window.animationManager) window.animationManager.animateInventoryFull(this.uiManager.inventoryIconContainer);
            if (window.notificationSystem) window.notificationSystem.inventoryFull();
        }

        if (userStats.ecto1Unlocked && !this.gameState.userStats.ecto1Unlocked) {
            this.gameState.userStats.ecto1Unlocked = true;
            this.showEcto1OnMap();
            if (window.visualEffectsSystem) window.visualEffectsSystem.showCelebrationEffect(window.innerWidth / 2, window.innerHeight / 2, 'ecto1_unlocked');
            if (window.notificationSystem) window.notificationSystem.ecto1Unlocked();
        }

        const userRef = ref(this.database, 'users/' + this.currentUser.uid);
        update(userRef, { points: userStats.points, captures: userStats.captures, inventory: this.gameState.getInventory(), ecto1Unlocked: userStats.ecto1Unlocked });

        // Atualizar o ranking após capturar um fantasma
        this.updateRankings();

        this.generateGhost();
    },

    updateRankings: function () {
        // Obter o nome correto do usuário para o ranking
        let displayName = 'Caça-Fantasma';
        if (this.userStats && this.userStats.displayName && this.userStats.displayName.trim() !== '') {
            displayName = this.userStats.displayName;
        } else if (this.currentUser) {
            if (this.currentUser.displayName && this.currentUser.displayName.trim() !== '') {
                displayName = this.currentUser.displayName;
            } else if (this.currentUser.email) {
                displayName = this.currentUser.email.split('@')[0];
            }
        }

        // Atualizar o ranking no caminho 'rankings/{uid}'
        const rankRef = ref(this.database, 'rankings/' + this.currentUser.uid);
        set(rankRef, {
            displayName: displayName,
            points: this.gameState.userStats.points || 0,
            captures: this.gameState.userStats.captures || 0
        }).then(() => {
            console.log('Ranking atualizado para o usuário:', this.currentUser.uid);
        }).catch((error) => {
            console.error('Erro ao atualizar ranking:', error);
        });

        // Atualizar o ranking após capturar um fantasma
        if (this.rankingsManager) {
            console.log('Atualizando ranking após captura de fantasma...');
            this.rankingsManager.loadRankings();
        }
    },



    tick: function (time, timeDelta) {
        if (!this.gameInitialized) return;
        const frame = this.el.sceneEl.renderer.xr.getFrame();
        if (!frame) return;
        this.arManager.tick(this.gameInitialized, frame);
    }
});