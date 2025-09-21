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

document.addEventListener('DOMContentLoaded', () => {
    const plantSelector = document.getElementById('plantSelector');
    const plantModel = document.getElementById('plant-model');
    const debugMsg = document.getElementById('debug-message');
    const scene = document.querySelector('a-scene');
    const gestureArea = document.getElementById('gesture-area');

    let selectedPlant = null;
    
    // --- Debug Messaging ---
    function showDebug(msg) {
        if (debugMsg) {
            debugMsg.textContent = msg;
            console.log(msg); // Also log to console for easier debugging on desktop
        }
    }

    // --- UI and Model Loading ---
    function updatePlantInfo(plantKey) {
        const infoCard = document.getElementById('plantInfo');
        if (infoCard && plantInfo[plantKey]) {
            infoCard.innerHTML = `
                <h2>${plantInfo[plantKey].name}</h2>
                <p>${plantInfo[plantKey].info}</p>
            `;
            infoCard.style.display = 'block';
        } else if (infoCard) {
            infoCard.style.display = 'none';
        }
    }

    showDebug('Page loaded. Waiting for AR scene...');

    if (scene.hasLoaded) {
        showDebug('AR Camera Ready. Select a plant.');
    } else {
        scene.addEventListener('loaded', () => {
            showDebug('AR Camera Ready. Select a plant.');
        });
    }
    
    plantSelector.addEventListener('change', (e) => {
        selectedPlant = e.target.value;
        if (selectedPlant) {
            showDebug(`Selection changed: ${selectedPlant}. Loading model...`);
            plantModel.setAttribute('gltf-model', `models/${selectedPlant}.glb`);
            // Reset model position, scale, and rotation on new model load
            plantModel.setAttribute('scale', '1 1 1');
            plantModel.setAttribute('position', '0 -0.5 -3'); // A good starting position
            plantModel.setAttribute('rotation', '0 0 0');
            plantModel.setAttribute('visible', 'true');
            updatePlantInfo(selectedPlant);
        } else {
            showDebug('No model selected.');
            plantModel.setAttribute('visible', 'false');
            updatePlantInfo(null);
        }
    });

    plantModel.addEventListener('model-loaded', () => {
        showDebug(`Model '${selectedPlant}' loaded successfully.`);
    });

    plantModel.addEventListener('model-error', (err) => {
        showDebug(`ERROR: Failed to load model for '${selectedPlant}'. Check file path and format.`);
        console.error('Model error:', err);
    });

    // --- Gesture and Mouse Controls ---
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let lastTouches = [];
    let lastDistance = null;
    let lastAngle = null;

    // Touch gestures for move/zoom/rotate
    gestureArea.addEventListener('touchstart', (e) => {
        if (!plantModel.getAttribute('visible')) return;
        lastTouches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
        if (e.touches.length === 1) {
            isDragging = true;
            dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastDistance = Math.sqrt(dx * dx + dy * dy);
            lastAngle = Math.atan2(dy, dx);
        }
    });

    gestureArea.addEventListener('touchmove', (e) => {
        if (!plantModel.getAttribute('visible')) return;
        e.preventDefault(); // Prevent page scrolling

        if (e.touches.length === 1 && isDragging) {
            // One finger drag to move
            const dx = e.touches[0].clientX - dragStart.x;
            const dy = e.touches[0].clientY - dragStart.y;
            const pos = plantModel.getAttribute('position');
            plantModel.setAttribute('position', `${pos.x + dx * 0.01} ${pos.y - dy * 0.01} ${pos.z}`);
            dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        } else if (e.touches.length === 2 && lastDistance) {
            // Pinch to zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const scale = plantModel.getAttribute('scale');
            const factor = distance / lastDistance;
            plantModel.setAttribute('scale', `${scale.x * factor} ${scale.y * factor} ${scale.z * factor}`);
            lastDistance = distance;

            // Two-finger rotate
            if (lastAngle) {
                const angle = Math.atan2(dy, dx);
                const rot = plantModel.getAttribute('rotation');
                const deltaAngle = (angle - lastAngle) * (180 / Math.PI); // Convert to degrees
                plantModel.setAttribute('rotation', `${rot.x} ${rot.y + deltaAngle} ${rot.z}`);
                lastAngle = angle;
            }
        }
    });

    gestureArea.addEventListener('touchend', () => {
        isDragging = false;
        lastTouches = [];
        lastDistance = null;
        lastAngle = null;
    });

    // Mouse controls for desktop
    gestureArea.addEventListener('wheel', (e) => {
        if (!plantModel.getAttribute('visible')) return;
        e.preventDefault();
        const scale = plantModel.getAttribute('scale');
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        plantModel.setAttribute('scale', `${scale.x * factor} ${scale.y * factor} ${scale.z * factor}`);
    });

    gestureArea.addEventListener('mousedown', (e) => {
        if (!plantModel.getAttribute('visible') || e.button !== 0) return; // Only main left-click
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
    });

    gestureArea.addEventListener('mousemove', (e) => {
        if (!isDragging || !plantModel.getAttribute('visible')) return;
        const rot = plantModel.getAttribute('rotation');
        const pos = plantModel.getAttribute('position');

        if (e.shiftKey) { // Hold Shift to rotate
             const deltaX = e.clientX - dragStart.x;
             plantModel.setAttribute('rotation', `${rot.x} ${rot.y + deltaX * 0.5} ${rot.z}`);
        } else { // Drag to move
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            plantModel.setAttribute('position', `${pos.x + deltaX * 0.01} ${pos.y - deltaY * 0.01} ${pos.z}`);
        }
        dragStart = { x: e.clientX, y: e.clientY };
    });

    gestureArea.addEventListener('mouseup', () => {
        isDragging = false;
    });

    gestureArea.addEventListener('mouseleave', () => {
        isDragging = false;
    });
});
