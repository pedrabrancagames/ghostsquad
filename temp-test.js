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
    expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
    expect(showEcto1OnMapCallback).not.toHaveBeenCalled();
});