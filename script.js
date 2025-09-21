const plantInfo = {
    Ahwagandha: {
        name: "Ashwagandha",
        info: "Ashwagandha is an ancient medicinal herb. It's classified as an adaptogen, meaning it can help your body manage stress."
    document.addEventListener('DOMContentLoaded', () => {
        const plantSelector = document.getElementById('plantSelector');
        const plantModel = document.getElementById('plant-model');
        let selectedPlant = null;
        const plantInfo = {
            Ahwagandha: {
                name: "Ashwagandha",
                info: "Ashwagandha is an ancient medicinal herb. It's classified as an adaptogen, meaning it can help your body manage stress."
            },
            Cardamom: {
                name: "Cardamom",
                info: "Cardamom is known for its strong aroma and is commonly used in traditional medicine for digestive issues and oral health."
            },
            Cinnamon: {
                name: "Cinnamon",
                info: "Cinnamon is loaded with antioxidants and has anti-inflammatory properties. It can help regulate blood sugar levels."
            },
            clove: {
                name: "Clove",
                info: "Cloves contain powerful antioxidants and have antibacterial properties. They're traditionally used for dental pain and digestive issues."
            },
            tulsi: {
                name: "Tulsi (Holy Basil)",
                info: "Tulsi is considered a sacred plant in Ayurveda. It has adaptogenic properties and helps combat stress and boost immunity."
            },
            Turmeric: {
                name: "Turmeric",
                info: "Turmeric contains curcumin, a powerful anti-inflammatory compound. It's known for its antioxidant properties and potential health benefits."
            }
        };

        // Update info card
        function updatePlantInfo(name, info) {
            const infoCard = document.getElementById('plantInfo');
            infoCard.innerHTML = `
                <h2>${name}</h2>
                <p>${info}</p>
            `;
        }

        document.addEventListener('DOMContentLoaded', () => {
            const plantSelector = document.getElementById('plantSelector');
            const plantModel = document.getElementById('plant-model');
            let selectedPlant = null;
            let initialScale = 0.2;
            let lastTouch = null;
            let lastDistance = null;
            let isDragging = false;
            let dragStart = null;

            // Handle plant selection
            const debugMsg = document.getElementById('debug-message');
            function showDebug(msg) {
                debugMsg.textContent = msg;
                debugMsg.style.display = 'block';
            }

            plantSelector.addEventListener('change', (e) => {
                selectedPlant = e.target.value;
                if (selectedPlant) {
                    showDebug('Loading model: ' + selectedPlant);
                    plantModel.setAttribute('gltf-model', `models/${selectedPlant}.glb`);
                    plantModel.setAttribute('scale', '1 1 1');
                    plantModel.setAttribute('position', '0 0 -2');
                    plantModel.setAttribute('rotation', '0 0 0');
                    plantModel.setAttribute('visible', 'true');
                    updatePlantInfo(plantInfo[selectedPlant].name, plantInfo[selectedPlant].info);
                } else {
                    showDebug('No model selected');
                    plantModel.setAttribute('visible', 'false');
                }
            });
    // Debug: log model load success/error
    plantModel.addEventListener('model-loaded', () => {
        // Check if model is visible and scale is reasonable
        let scale = plantModel.getAttribute('scale');
        let msg = 'Model loaded successfully: ' + selectedPlant;
        if (scale.x < 0.05 || scale.y < 0.05 || scale.z < 0.05) {
            msg += ' (Warning: Model may be too small)';
        }
        showDebug(msg);
    });
    plantModel.addEventListener('model-error', (err) => {
        showDebug('Error loading model! Check file and path.');
    });

            // Touch gestures for move/zoom/rotate
            const scene = document.querySelector('a-scene');
            let lastTouches = [];
            let lastDistance = null;
            let lastAngle = null;
            scene.addEventListener('touchstart', (e) => {
                if (!plantModel.getAttribute('visible')) return;
                lastTouches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
                if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    lastDistance = Math.sqrt(dx * dx + dy * dy);
                    lastAngle = Math.atan2(dy, dx);
                }
            });
            scene.addEventListener('touchmove', (e) => {
                if (!plantModel.getAttribute('visible')) return;
                if (e.touches.length === 1 && lastTouches.length === 1) {
                    // One finger drag to move
                    const dx = e.touches[0].clientX - lastTouches[0].x;
                    const dy = e.touches[0].clientY - lastTouches[0].y;
                    const pos = plantModel.getAttribute('position');
                    plantModel.setAttribute('position', `${pos.x + dx * 0.01} ${pos.y} ${pos.z + dy * 0.01}`);
                    lastTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
                } else if (e.touches.length === 2 && lastTouches.length === 2) {
                    // Pinch to zoom
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const scale = plantModel.getAttribute('scale');
                    const factor = distance / lastDistance;
                    plantModel.setAttribute('scale', `${scale.x * factor} ${scale.y * factor} ${scale.z * factor}`);
                    lastDistance = distance;

                    // Two-finger rotate
                    const angle = Math.atan2(dy, dx);
                    const rot = plantModel.getAttribute('rotation');
                    const deltaAngle = (angle - lastAngle) * (180 / Math.PI); // Convert to degrees
                    plantModel.setAttribute('rotation', `${rot.x} ${rot.y + deltaAngle} ${rot.z}`);
                    lastAngle = angle;

                    lastTouches = [
                        { x: e.touches[0].clientX, y: e.touches[0].clientY },
                        { x: e.touches[1].clientX, y: e.touches[1].clientY }
                    ];
                }
            });
            scene.addEventListener('touchend', () => {
                lastTouches = [];
                lastDistance = null;
                lastAngle = null;
            });

            // Mouse wheel for desktop zoom
            scene.addEventListener('wheel', (e) => {
                if (!plantModel.getAttribute('visible')) return;
                const scale = plantModel.getAttribute('scale');
                const factor = e.deltaY < 0 ? 1.1 : 0.9;
                plantModel.setAttribute('scale', `${scale.x * factor} ${scale.y * factor} ${scale.z * factor}`);
            });

            // Mouse drag for desktop move
            scene.addEventListener('mousedown', (e) => {
                if (!plantModel.getAttribute('visible')) return;
                isDragging = true;
                dragStart = { x: e.clientX, y: e.clientY };
            });
            scene.addEventListener('mousemove', (e) => {
                if (!isDragging || !plantModel.getAttribute('visible')) return;
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                const pos = plantModel.getAttribute('position');
                plantModel.setAttribute('position', `${pos.x + dx * 0.01} ${pos.y} ${pos.z + dy * 0.01}`);
                dragStart = { x: e.clientX, y: e.clientY };
            });
            scene.addEventListener('mouseup', () => {
                isDragging = false;
            });
            scene.addEventListener('mouseleave', () => {
                isDragging = false;
            });
        });
            const scale = distance / touchStartDistance;

            const { model } = getCurrentElements();
            const currentScale = model.getAttribute('scale');
            const newScale = scale > 1 ? SCALE_FACTOR : 1 / SCALE_FACTOR;
            
            model.setAttribute('scale', 
                `${currentScale.x * newScale} ${currentScale.y * newScale} ${currentScale.z * newScale}`);

            touchStartDistance = distance;
        }
    });

    gestureArea.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Mouse wheel for desktop zoom
    gestureArea.addEventListener('wheel', (e) => {
        e.preventDefault();
        const { model } = getCurrentElements();
        if (!model) return;

        const scale = model.getAttribute('scale');
        const scaleFactor = e.deltaY < 0 ? SCALE_FACTOR : 1 / SCALE_FACTOR;

        model.setAttribute('scale',
            `${scale.x * scaleFactor} ${scale.y * scaleFactor} ${scale.z * scaleFactor}`);
    });

    // Mouse drag for desktop movement and rotation
    gestureArea.addEventListener('mousedown', (e) => {
        touchStartX = e.clientX;
        touchStartY = e.clientY;
        isDragging = true;
    });

    gestureArea.addEventListener('mousemove', (e) => {
        if (!isDragging || !getCurrentElements().model) return;

        const deltaX = e.clientX - touchStartX;
        const deltaY = e.clientY - touchStartY;

        const { container, model } = getCurrentElements();
        const pos = container.getAttribute('position');
        const rot = model.getAttribute('rotation');

        // Shift key for rotation, otherwise movement
        if (e.shiftKey) {
            model.setAttribute('rotation',
                `${rot.x} ${rot.y} ${rot.z + (deltaY * ROTATION_ANGLE / 50)}`);
        } else {
            container.setAttribute('position',
                `${pos.x + (deltaX * MOVE_DISTANCE / 50)} ${pos.y} ${pos.z + (deltaY * MOVE_DISTANCE / 50)}`);
        }

        touchStartX = e.clientX;
        touchStartY = e.clientY;
    });

    gestureArea.addEventListener('mouseup', () => {
        isDragging = false;
    });

    gestureArea.addEventListener('mouseleave', () => {
        isDragging = false;
    });
});