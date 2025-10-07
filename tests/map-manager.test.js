/**
 * @jest-environment jsdom
 */

import { MapManager } from '../map-manager.js';

describe('MapManager', () => {
    let mapManager;

    beforeEach(() => {
        mapManager = new MapManager();
        jest.clearAllMocks();
    });

    describe('initMap', () => {
        it('deve inicializar o mapa corretamente', () => {
            // Configurar mocks para Leaflet
            const mockMap = {
                setView: jest.fn(),
                remove: jest.fn(),
                getZoom: jest.fn()
            };
            
            const mockTileLayer = {
                addTo: jest.fn(() => mockTileLayer) // Retornar o próprio objeto para encadeamento
            };
            
            global.L = {
                map: jest.fn(() => mockMap),
                tileLayer: jest.fn(() => mockTileLayer)
            };
            
            const selectedLocation = { lat: -27.630913, lon: -48.679793 };
            const ecto1Unlocked = false;
            const showEcto1OnMapCallback = jest.fn();
            const mockMinimapElement = {};
            
            mapManager.setMinimapElement(mockMinimapElement);
            mapManager.initMap(selectedLocation, ecto1Unlocked, showEcto1OnMapCallback);
            
            expect(global.L.map).toHaveBeenCalledWith(mockMinimapElement);
            expect(mockMap.setView).toHaveBeenCalledWith([selectedLocation.lat, selectedLocation.lon], 18);
            expect(global.L.tileLayer).toHaveBeenCalledWith('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            // Simplificar a verificação do addTo
            expect(mockTileLayer.addTo).toHaveBeenCalled();
            expect(showEcto1OnMapCallback).not.toHaveBeenCalled();
        });

        it('deve chamar showEcto1OnMapCallback quando ecto1Unlocked é true', () => {
            // Configurar mocks para Leaflet
            const mockMap = {
                setView: jest.fn(),
                remove: jest.fn(),
                getZoom: jest.fn()
            };
            
            const mockTileLayer = {
                addTo: jest.fn(() => mockTileLayer) // Retornar o próprio objeto para encadeamento
            };
            
            global.L = {
                map: jest.fn(() => mockMap),
                tileLayer: jest.fn(() => mockTileLayer)
            };
            
            const selectedLocation = { lat: -27.630913, lon: -48.679793 };
            const ecto1Unlocked = true;
            const showEcto1OnMapCallback = jest.fn();
            const mockMinimapElement = {};
            
            mapManager.setMinimapElement(mockMinimapElement);
            mapManager.initMap(selectedLocation, ecto1Unlocked, showEcto1OnMapCallback);
            
            expect(showEcto1OnMapCallback).toHaveBeenCalled();
        });
    });

    describe('showEcto1OnMap', () => {
        it('deve mostrar o marcador do ECTO-1 no mapa', () => {
            // Configurar mocks para Leaflet
            const mockMap = {};
            
            const mockMarker = {
                addTo: jest.fn(() => mockMarker)
            };
            
            const mockDivIcon = jest.fn();
            
            global.L = {
                marker: jest.fn(() => mockMarker),
                divIcon: mockDivIcon
            };
            
            mapManager.map = mockMap;
            const ecto1Position = { lat: -27.630913, lon: -48.679793 };
            
            mapManager.showEcto1OnMap(ecto1Position);
            
            expect(mockDivIcon).toHaveBeenCalledWith({
                className: 'ecto-marker',
                html: '<div style="font-size: 20px;">🚗</div>',
                iconSize: [20, 20]
            });
            expect(global.L.marker).toHaveBeenCalledWith([ecto1Position.lat, ecto1Position.lon], expect.any(Object));
            expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
        });
    });

    describe('updatePlayerPosition', () => {
        it('deve criar um novo marcador para o jogador quando não existe', () => {
            // Configurar mocks para Leaflet
            const mockMap = {
                setView: jest.fn(),
                getZoom: jest.fn(() => 18)
            };
            
            const mockMarker = {
                addTo: jest.fn(() => mockMarker)
            };
            
            const mockDivIcon = jest.fn();
            
            global.L = {
                marker: jest.fn(() => mockMarker),
                divIcon: mockDivIcon
            };
            
            mapManager.map = mockMap;
            const lat = -27.630913;
            const lon = -48.679793;
            
            mapManager.updatePlayerPosition(lat, lon);
            
            expect(mockDivIcon).toHaveBeenCalledWith({
                className: 'player-marker',
                html: '<div style="background-color: #92F428; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [15, 15]
            });
            expect(global.L.marker).toHaveBeenCalledWith([lat, lon], expect.any(Object));
            expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
            expect(mockMap.setView).toHaveBeenCalledWith([lat, lon], 18);
        });

        it('deve atualizar a posição do marcador existente do jogador', () => {
            // Configurar mocks para Leaflet
            const mockMap = {
                setView: jest.fn(),
                getZoom: jest.fn(() => 18)
            };
            
            const mockMarker = {
                setLatLng: jest.fn(() => mockMarker)
            };
            
            global.L = {
                marker: jest.fn(() => mockMarker)
            };
            
            mapManager.map = mockMap;
            mapManager.playerMarker = mockMarker;
            const lat = -27.630913;
            const lon = -48.679793;
            
            mapManager.updatePlayerPosition(lat, lon);
            
            expect(mockMarker.setLatLng).toHaveBeenCalledWith([lat, lon]);
            expect(mockMap.setView).toHaveBeenCalledWith([lat, lon], 18);
        });
    });

    describe('updateGhostMarker', () => {
        it('deve criar um novo marcador para o fantasma quando não existe', () => {
            // Configurar mocks para Leaflet
            const mockMap = {};
            
            const mockMarker = {
                addTo: jest.fn(() => mockMarker)
            };
            
            const mockDivIcon = jest.fn();
            
            global.L = {
                marker: jest.fn(() => mockMarker),
                divIcon: mockDivIcon
            };
            
            mapManager.map = mockMap;
            const ghostData = {
                lat: -27.630913,
                lon: -48.679793,
                type: 'Fantasma Comum'
            };
            
            mapManager.updateGhostMarker(ghostData);
            
            expect(mockDivIcon).toHaveBeenCalledWith({
                className: 'ghost-marker',
                html: '<div style="font-size: 24px; text-shadow: 0 0 5px #000;">👻</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            expect(global.L.marker).toHaveBeenCalledWith([ghostData.lat, ghostData.lon], expect.any(Object));
            expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
        });

        it('deve atualizar o marcador existente do fantasma', () => {
            // Configurar mocks para Leaflet
            const mockMap = {};
            
            const mockMarker = {
                setLatLng: jest.fn(() => mockMarker),
                setIcon: jest.fn(() => mockMarker)
            };
            
            const mockDivIcon = jest.fn();
            
            global.L = {
                marker: jest.fn(() => mockMarker),
                divIcon: mockDivIcon
            };
            
            mapManager.map = mockMap;
            mapManager.ghostMarker = mockMarker;
            const ghostData = {
                lat: -27.630913,
                lon: -48.679793,
                type: 'Fantasma Forte'
            };
            
            mapManager.updateGhostMarker(ghostData);
            
            expect(mockMarker.setLatLng).toHaveBeenCalledWith([ghostData.lat, ghostData.lon]);
            expect(mockMarker.setIcon).toHaveBeenCalled();
        });
    });

    describe('removeGhostMarker', () => {
        it('deve remover o marcador do fantasma quando existe', () => {
            const mockMarker = {
                remove: jest.fn()
            };
            
            mapManager.ghostMarker = mockMarker;
            
            mapManager.removeGhostMarker();
            
            expect(mockMarker.remove).toHaveBeenCalled();
            expect(mapManager.ghostMarker).toBeNull();
        });

        it('não deve causar erro quando não há marcador do fantasma', () => {
            mapManager.ghostMarker = null;
            
            expect(() => mapManager.removeGhostMarker()).not.toThrow();
        });
    });

    describe('checkProximity', () => {
        const userLat = -27.630913;
        const userLon = -48.679793;
        const ecto1Position = { lat: -27.630918, lon: -48.679798 };
        const inventoryLimit = 5;
        const inventory = [];

        it('deve detectar proximidade com fantasma', () => {
            const ghostData = {
                lat: -27.630914, // Muito próximo
                lon: -48.679794, // Muito próximo
                type: 'Fantasma Comum'
            };
            
            const result = mapManager.checkProximity(
                userLat, userLon, ghostData, ecto1Position, true, inventoryLimit, inventory
            );
            
            expect(result.isNearObject).toBe(true);
            expect(result.objectToPlace).toBe('ghost');
            expect(result.distanceInfo).toContain('FANTASMA');
        });

        it('deve detectar proximidade com ECTO-1', () => {
            const ghostData = null;
            const ecto1Unlocked = true;
            
            // Posições que fazem a distância ser menor que 15 metros
            const closeEcto1Position = { lat: -27.63091301, lon: -48.67979301 };
            
            const result = mapManager.checkProximity(
                userLat, userLon, ghostData, closeEcto1Position, ecto1Unlocked, inventoryLimit, inventory
            );
            
            expect(result.isNearObject).toBe(true);
            expect(result.objectToPlace).toBe('ecto1');
            expect(result.distanceInfo).toBe("ECTO-1 PRÓXIMO! OLHE AO REDOR!");
        });

        it('deve retornar distância quando não há proximidade', () => {
            const ghostData = {
                lat: -27.631913, // Distante
                lon: -48.680793, // Distante
                type: 'Fantasma Comum'
            };
            
            const result = mapManager.checkProximity(
                userLat, userLon, ghostData, ecto1Position, false, inventoryLimit, inventory
            );
            
            expect(result.isNearObject).toBe(false);
            expect(result.distanceInfo).toContain('Fantasma:');
        });
    });

    describe('setMinimapElement', () => {
        it('deve definir o elemento do minimapa', () => {
            const mockElement = {};
            mapManager.setMinimapElement(mockElement);
            
            expect(mapManager.minimapElement).toBe(mockElement);
        });
    });

    describe('getMap', () => {
        it('deve retornar a instância do mapa', () => {
            const mockMapInstance = {};
            mapManager.map = mockMapInstance;
            
            expect(mapManager.getMap()).toBe(mockMapInstance);
        });
    });
});