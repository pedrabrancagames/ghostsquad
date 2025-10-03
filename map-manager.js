/**
 * Map Manager - Ghost Squad
 * Gerencia o mapa, localização do jogador, marcação de pontos de interesse e cálculos de proximidade
 */

export class MapManager {
    constructor() {
        this.map = null;
        this.playerMarker = null;
        this.ghostMarker = null;
        this.ecto1Marker = null;
        this.minimapElement = null;
    }

    // Inicializa o mapa
    initMap(selectedLocation, ecto1Unlocked, showEcto1OnMapCallback) {
        // Garante que o mapa anterior seja removido antes de inicializar um novo.
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        this.map = L.map(this.minimapElement).setView([selectedLocation.lat, selectedLocation.lon], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        
        if (ecto1Unlocked) {
            showEcto1OnMapCallback();
        }
    }

    // Mostra o ECTO-1 no mapa
    showEcto1OnMap(ecto1Position) {
        const ectoIcon = L.divIcon({ 
            className: 'ecto-marker', 
            html: '<div style="font-size: 20px;">🚗</div>', 
            iconSize: [20, 20] 
        });
        
        if (!this.ecto1Marker) {
            this.ecto1Marker = L.marker([ecto1Position.lat, ecto1Position.lon], { icon: ectoIcon }).addTo(this.map);
        }
    }

    // Atualiza a posição do jogador no mapa
    updatePlayerPosition(lat, lon) {
        if (!this.playerMarker) {
            const playerIcon = L.divIcon({ 
                className: 'player-marker', 
                html: '<div style="background-color: #92F428; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>', 
                iconSize: [15, 15] 
            });
            this.playerMarker = L.marker([lat, lon], { icon: playerIcon }).addTo(this.map);
        } else {
            this.playerMarker.setLatLng([lat, lon]);
        }
        this.map.setView([lat, lon], this.map.getZoom());
    }

    // Atualiza a posição do fantasma no mapa
    updateGhostMarker(ghostData) {
        const ghostEmoji = ghostData.type === 'Fantasma Forte' ? '🎃' : '👻';
        const ghostIcon = L.divIcon({
            className: 'ghost-marker',
            html: `<div style="font-size: 24px; text-shadow: 0 0 5px #000;">${ghostEmoji}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        if(this.ghostMarker) {
            this.ghostMarker.setLatLng([ghostData.lat, ghostData.lon]).setIcon(ghostIcon);
        } else {
            this.ghostMarker = L.marker([ghostData.lat, ghostData.lon], { icon: ghostIcon }).addTo(this.map);
        }
    }

    // Remove o marcador do fantasma
    removeGhostMarker() {
        if (this.ghostMarker) {
            this.ghostMarker.remove();
            this.ghostMarker = null;
        }
    }

    // Verifica a proximidade do jogador com objetos no mapa
    checkProximity(userLat, userLon, ghostData, ecto1Position, ecto1Unlocked, inventoryLimit, inventory, captureRadius) {
        const R = 6371e3; // Raio da Terra em metros
        let isNearObject = false;
        let objectToPlace = null;
        let activeGhostEntity = null;

        // Verificar proximidade com fantasma
        if (inventory.length < inventoryLimit && ghostData && ghostData.lat) {
            const dPhiGhost = (ghostData.lat - userLat) * Math.PI / 180;
            const dLambdaGhost = (ghostData.lon - userLon) * Math.PI / 180;
            const aGhost = Math.sin(dPhiGhost / 2) * Math.sin(dPhiGhost / 2) +
                          Math.cos(userLat * Math.PI / 180) * Math.cos(ghostData.lat * Math.PI / 180) *
                          Math.sin(dLambdaGhost / 2) * Math.sin(dLambdaGhost / 2);
            const distanceGhost = R * (2 * Math.atan2(Math.sqrt(aGhost), Math.sqrt(1 - aGhost)));

            if (distanceGhost <= captureRadius) { // CAPTURE_RADIUS
                objectToPlace = 'ghost';
                // activeGhostEntity seria definido no contexto do game manager
                isNearObject = true;
                return { isNearObject, objectToPlace, activeGhostEntity, distanceInfo: `Fantasma: ${distanceGhost.toFixed(0)}m`, isNearGhost: true };
            } else {
                return { isNearObject, objectToPlace, activeGhostEntity, distanceInfo: `Fantasma: ${distanceGhost.toFixed(0)}m`, isNearGhost: false };
            }
        }

        // Verificar proximidade com ECTO-1
        if (ecto1Unlocked && !isNearObject) {
            const dPhiEcto = (ecto1Position.lat - userLat) * Math.PI / 180;
            const dLambdaEcto = (ecto1Position.lon - userLon) * Math.PI / 180;
            const aEcto = Math.sin(dPhiEcto / 2) * Math.sin(dPhiEcto / 2) +
                         Math.cos(userLat * Math.PI / 180) * Math.cos(ecto1Position.lat * Math.PI / 180) *
                         Math.sin(dLambdaEcto / 2) * Math.sin(dLambdaEcto / 2);
            const distanceEcto = R * (2 * Math.atan2(Math.sqrt(aEcto), Math.sqrt(1 - aEcto)));

            if (distanceEcto <= captureRadius) { // CAPTURE_RADIUS
                objectToPlace = 'ecto1';
                isNearObject = true;
                return { isNearObject, objectToPlace, activeGhostEntity, distanceInfo: "ECTO-1 PRÓXIMO! OLHE AO REDOR!" };
            }
        }

        return { isNearObject, objectToPlace, activeGhostEntity, distanceInfo: null };
    }

    // Define o elemento do minimapa
    setMinimapElement(element) {
        this.minimapElement = element;
    }

    // Obtém a instância do mapa
    getMap() {
        return this.map;
    }
}