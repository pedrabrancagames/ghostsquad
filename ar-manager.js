/**
 * AR Manager - Ghost Squad
 * Gerencia elementos de realidade aumentada, incluindo posicionamento, hit testing e renderização
 */

export class ARManager {
    constructor() {
        this.hitTestSource = null;
        this.referenceSpace = null;
        this.placedObjects = { ghost: false, ecto1: false };
        this.objectToPlace = null;
        this.ghostData = null; // Armazena os dados do fantasma a ser colocado

        // Entidades dinâmicas
        this.reticle = null;
        this.dynamicGhostEntity = null;
        this.ghostModelEntity = null; // A sub-entidade que carrega o modelo
        this.ecto1Entity = null;
    }

    // Inicializa elementos AR
    initializeARElements() {
        this.reticle = document.getElementById('reticle');
        this.dynamicGhostEntity = document.getElementById('dynamic-ghost');
        this.ghostModelEntity = this.dynamicGhostEntity.querySelector('.model');
        this.ecto1Entity = document.getElementById('ecto-1');
    }

    // Configura o hit test para AR
    async setupHitTest(sceneEl) {
        try {
            if (!sceneEl || !sceneEl.renderer || !sceneEl.renderer.xr) {
                console.error('Cena AR não disponível para configurar hit test');
                return;
            }
            const session = sceneEl.renderer.xr.getSession();
            if (!session) {
                console.error('Sessão AR não disponível');
                return;
            }
            this.referenceSpace = await session.requestReferenceSpace('viewer');
            this.hitTestSource = await session.requestHitTestSource({ space: this.referenceSpace });
        } catch (error) {
            console.error('Erro ao configurar hit test para AR:', error);
        }
    }

    // Processa o tick para atualização de elementos AR
    tick(gameInitialized, frame) {
        if (!gameInitialized || !this.hitTestSource || !frame) return false;

        const hitTestResults = frame.getHitTestResults(this.hitTestSource);

        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(this.referenceSpace);
            this.reticle.setAttribute('visible', true);
            this.reticle.object3D.matrix.fromArray(pose.transform.matrix);
            this.reticle.object3D.matrix.decompose(this.reticle.object3D.position, this.reticle.object3D.quaternion, this.reticle.object3D.scale);
            
            if (this.objectToPlace && !this.placedObjects[this.objectToPlace]) {
                this.placeObject();
                return true; // Objeto foi colocado
            }
        } else {
            this.reticle.setAttribute('visible', false);
        }
        return false; // Nenhum objeto foi colocado
    }

    // Coloca um objeto no ambiente AR
    placeObject() {
        if (!this.objectToPlace || this.placedObjects[this.objectToPlace] || !this.reticle.getAttribute('visible')) return;

        let entityToPlace;
        if (this.objectToPlace === 'ghost' && this.ghostData) {
            entityToPlace = this.dynamicGhostEntity;
            const scale = this.ghostData.scale || 1.0;
            this.ghostModelEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

            this.ghostModelEntity.setAttribute('gltf-model', `url(${this.ghostData.modelUrl})`);

            const rotator = this.dynamicGhostEntity.querySelector('.rotator');
            const bobber = this.dynamicGhostEntity.querySelector('.model');

            if (this.ghostData.behavior === 'orbit') {
                rotator.setAttribute('animation__rotation', 'enabled', true);
                bobber.setAttribute('animation__bob', 'enabled', true);
            } else { // stationary
                rotator.setAttribute('animation__rotation', 'enabled', false);
                bobber.setAttribute('animation__bob', 'enabled', false);
            }

        } else if (this.objectToPlace === 'ecto1') {
            entityToPlace = this.ecto1Entity;
        }

        if (entityToPlace) {
            const pos = this.reticle.object3D.position;
            entityToPlace.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
            entityToPlace.setAttribute('visible', 'true');
            this.placedObjects[this.objectToPlace] = true;
            this.reticle.setAttribute('visible', 'false');
        }
    }

    // Define o tipo de objeto a ser colocado e seus dados (se for fantasma)
    setObjectToPlace(objectType, ghostData = null) {
        this.objectToPlace = objectType;
        if (objectType === 'ghost') {
            this.ghostData = ghostData;
        }
    }

    // Pausa as animações do fantasma
    pauseGhostAnimations() {
        const rotator = this.dynamicGhostEntity.querySelector('.rotator');
        const bobber = this.dynamicGhostEntity.querySelector('.model');
        if (rotator.getAttribute('animation__rotation').enabled) {
            rotator.components.animation__rotation.pause();
        }
        if (bobber.getAttribute('animation__bob').enabled) {
            bobber.components.animation__bob.pause();
        }
    }

    // Retoma as animações do fantasma
    resumeGhostAnimations() {
        const rotator = this.dynamicGhostEntity.querySelector('.rotator');
        const bobber = this.dynamicGhostEntity.querySelector('.model');
        if (rotator.getAttribute('animation__rotation').enabled) {
            rotator.components.animation__rotation.play();
        }
        if (bobber.getAttribute('animation__bob').enabled) {
            bobber.components.animation__bob.play();
        }
    }

    // Verifica se um objeto foi colocado
    isObjectPlaced(objectType) {
        return this.placedObjects[objectType] || false;
    }

    // Reseta o estado de posicionamento
    resetPlacementState() {
        if (this.dynamicGhostEntity) {
            this.dynamicGhostEntity.setAttribute('visible', false);
            this.ghostModelEntity.removeAttribute('gltf-model');
        }
        this.placedObjects.ghost = false;
        this.placedObjects.ecto1 = false;
        this.objectToPlace = null;
        this.ghostData = null;
    }
}
