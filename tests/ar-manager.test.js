/**
 * @jest-environment jsdom
 */

import { ARManager } from '../ar-manager.js';

// Mock do AFRAME
const mockAFrame = {
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

// Mock do elemento DOM
const mockElement = {
    setAttribute: jest.fn(),
    getAttribute: jest.fn(() => false),
    object3D: {
        position: { x: 0, y: 0, z: 0 },
        matrix: {
            fromArray: jest.fn(),
            decompose: jest.fn()
        }
    }
};

// Mock do document.getElementById
document.getElementById = jest.fn((id) => {
    if (id === 'reticle') return mockElement;
    if (id === 'ghost-comum') return mockElement;
    if (id === 'ghost-forte') return mockElement;
    if (id === 'ghost-comum-rotator') return mockElement;
    if (id === 'ghost-comum-bobber') return mockElement;
    if (id === 'ghost-forte-rotator') return mockElement;
    if (id === 'ghost-forte-bobber') return mockElement;
    if (id === 'ecto-1') return mockElement;
    return null;
});

describe('ARManager', () => {
    let arManager;

    beforeEach(() => {
        arManager = new ARManager();
        jest.clearAllMocks();
    });

    describe('initializeARElements', () => {
        it('deve inicializar todos os elementos AR', () => {
            arManager.initializeARElements();
            
            expect(arManager.reticle).toBeDefined();
            expect(arManager.ghostComumEntity).toBeDefined();
            expect(arManager.ghostForteEntity).toBeDefined();
            expect(arManager.ghostComumRotator).toBeDefined();
            expect(arManager.ghostComumBobber).toBeDefined();
            expect(arManager.ghostForteRotator).toBeDefined();
            expect(arManager.ghostForteBobber).toBeDefined();
            expect(arManager.ecto1Entity).toBeDefined();
        });
    });

    describe('setupHitTest', () => {
        it('deve configurar o hit test corretamente', async () => {
            // Mock para referenceSpace e hitTestSource
            const mockReferenceSpace = {};
            const mockHitTestSource = {};
            
            // Mock para session
            const mockSession = {
                requestReferenceSpace: jest.fn().mockResolvedValue(mockReferenceSpace),
                requestHitTestSource: jest.fn().mockResolvedValue(mockHitTestSource)
            };
            
            // Mock para sceneEl
            const mockSceneEl = {
                renderer: {
                    xr: {
                        getSession: jest.fn(() => mockSession)
                    }
                }
            };
            
            await arManager.setupHitTest(mockSceneEl);
            
            expect(mockSceneEl.renderer.xr.getSession).toHaveBeenCalled();
            expect(mockSession.requestReferenceSpace).toHaveBeenCalledWith('viewer');
            expect(mockSession.requestHitTestSource).toHaveBeenCalledWith({ space: mockReferenceSpace });
            expect(arManager.hitTestSource).toBe(mockHitTestSource);
        });
    });

    describe('setObjectToPlace', () => {
        it('deve definir o objeto a ser colocado', () => {
            arManager.setObjectToPlace('ghost');
            
            expect(arManager.objectToPlace).toBe('ghost');
        });
    });

    describe('setActiveGhostEntity', () => {
        it('deve definir a entidade do fantasma ativo', () => {
            const mockEntity = {};
            arManager.setActiveGhostEntity(mockEntity);
            
            expect(arManager.activeGhostEntity).toBe(mockEntity);
        });
    });

    describe('isObjectPlaced', () => {
        it('deve retornar o estado correto do objeto colocado', () => {
            arManager.placedObjects.ghost = true;
            
            expect(arManager.isObjectPlaced('ghost')).toBe(true);
            expect(arManager.isObjectPlaced('ecto1')).toBe(false);
        });
    });

    describe('resetPlacementState', () => {
        it('deve resetar o estado de posicionamento', () => {
            arManager.placedObjects.ghost = true;
            arManager.placedObjects.ecto1 = true;
            arManager.objectToPlace = 'ghost';
            arManager.activeGhostEntity = {};
            arManager.currentRotatorEntity = {};
            arManager.currentBobberEntity = {};
            
            arManager.resetPlacementState();
            
            expect(arManager.placedObjects.ghost).toBe(false);
            expect(arManager.placedObjects.ecto1).toBe(false);
            expect(arManager.objectToPlace).toBeNull();
            expect(arManager.activeGhostEntity).toBeNull();
            expect(arManager.currentRotatorEntity).toBeNull();
            expect(arManager.currentBobberEntity).toBeNull();
        });
    });

    // Note: Os métodos tick e placeObject requerem mocks mais complexos do A-Frame
    // e são mais apropriados para testes de integração
});