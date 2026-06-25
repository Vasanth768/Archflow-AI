// --- ARCHFLOW AI - 3D RENDERING WORKSPACE VIEWER ---

document.addEventListener("DOMContentLoaded", () => {
    // Check if on 3D viewer screen
    const sceneImg = document.getElementById("viewer3DImage");
    if (!sceneImg) return;

    let activeProject = ArchFlow.getActiveProject();
    if (!activeProject) return;

    // Local state variables for render adjustments
    let activeAngle = "isometric"; // front, side, isometric
    let activeTimeOfDay = "day"; // day, night
    let activeMaterials = {
        facade: activeProject.materials.facade || "concrete-plaster",
        railings: activeProject.materials.railings || "steel-grill",
        lighting: activeProject.materials.lighting || "warm-led"
    };

    // UI elements
    const angleBtns = document.querySelectorAll(".angle-control-btn");
    const materialCards = document.querySelectorAll(".material-swatch-card");
    const styleTabs = document.querySelectorAll(".viewer-top-tab");
    const dayNightBtn = document.getElementById("toggle-day-night-btn");
    
    // Dynamic Render Pipeline Simulation
    // Returns appropriate high-fidelity architectural images based on selected style & configurations
    function update3DImage() {
        let baseImgUrl = "";
        
        // Choose base image based on project active style selection
        const style = activeProject.selectedStyle;
        
        if (style === "Budget Friendly") {
            baseImgUrl = ArchFlow.IMAGES.budget;
        } else if (style === "Premium Luxury" || style === "Luxury") {
            baseImgUrl = ArchFlow.IMAGES.luxury;
        } else if (style === "Minimalist White" || style === "Minimalist") {
            baseImgUrl = ArchFlow.IMAGES.minimalist;
        } else if (style === "Traditional Modern" || style === "Traditional") {
            baseImgUrl = ArchFlow.IMAGES.traditional;
        } else {
            baseImgUrl = ArchFlow.IMAGES.standard;
        }
        
        sceneImg.src = baseImgUrl;

        // Apply visual overlays or filters for time-of-day simulation
        if (activeTimeOfDay === "night") {
            // Apply night atmosphere filters: dark, high contrast, blue hue shift, overlay warm window light glows
            sceneImg.style.filter = "brightness(0.4) contrast(1.1) saturate(0.85) sepia(0.15) hue-rotate(190deg)";
            sceneImg.style.boxShadow = "inset 0 0 100px rgba(0,0,0,0.8), 0 10px 15px -3px rgba(0, 0, 0, 0.3)";
            document.querySelector(".viewer-3d-frame").style.backgroundColor = "#02040a";
        } else {
            // Standard daytime render clarity
            sceneImg.style.filter = "brightness(1.0) contrast(1.0) saturate(1.0) sepia(0) hue-rotate(0deg)";
            sceneImg.style.boxShadow = "none";
            document.querySelector(".viewer-3d-frame").style.backgroundColor = "#0f172a";
        }

        // Simulating Materials Cladding selection overlays
        // Update information labels on properties panel
        const matFacadeLabel = document.getElementById("label-facade-mat");
        const matRailingLabel = document.getElementById("label-railing-mat");
        const matLightLabel = document.getElementById("label-lighting-mat");

        if (matFacadeLabel) {
            matFacadeLabel.innerText = getFriendlyName(activeMaterials.facade);
            matRailingLabel.innerText = getFriendlyName(activeMaterials.railings);
            matLightLabel.innerText = getFriendlyName(activeMaterials.lighting);
        }
    }

    function getFriendlyName(slug) {
        return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }

    // Angle Preset selections
    angleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            angleBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeAngle = btn.dataset.angle;
            
            ArchFlow.showToast(`Switched 3D camera to ${activeAngle.toUpperCase()} view.`, "info");
            update3DImage();
        });
    });

    // Material Swatch selections
    materialCards.forEach((card) => {
        card.addEventListener("click", () => {
            const type = card.dataset.type; // facade, railing, lighting
            const val = card.dataset.value;
            
            // Uncheck previous of same type
            document.querySelectorAll(`.material-swatch-card[data-type="${type}"]`).forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            
            activeMaterials[type] = val;
            ArchFlow.updateProjectMaterials(activeProject.id, activeMaterials);
            
            ArchFlow.showToast(`Applied ${getFriendlyName(val)} to building exterior.`, "success");
            update3DImage();
        });
    });

    // Style Swatches (Top bar on 3D page)
    styleTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            styleTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            const newStyle = tab.dataset.style;
            activeProject.selectedStyle = newStyle;
            ArchFlow.updateProjectStyleSelection(activeProject.id, newStyle);
            
            ArchFlow.showToast(`Switched exterior design to ${newStyle}`, "success");
            update3DImage();
        });
    });

    // Day/Night switch controls
    if (dayNightBtn) {
        dayNightBtn.addEventListener("click", () => {
            if (activeTimeOfDay === "day") {
                activeTimeOfDay = "night";
                dayNightBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right:6px;"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg> Switch to Day`;
                ArchFlow.showToast("Rendering evening LED lighting...", "info");
            } else {
                activeTimeOfDay = "day";
                dayNightBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right:6px;"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg> Switch to Night`;
                ArchFlow.showToast("Rendering natural sunlight scene...", "info");
            }
            update3DImage();
        });
    }

    // Auto load current materials visual indicators on swatch items
    function highlightSelectedSwatches() {
        document.querySelectorAll(".material-swatch-card").forEach((card) => {
            const type = card.dataset.type;
            const val = card.dataset.value;
            if (activeMaterials[type] === val) {
                card.classList.add("active");
            } else {
                card.classList.remove("active");
            }
        });

        document.querySelectorAll(".viewer-top-tab").forEach((tab) => {
            if (tab.dataset.style === activeProject.selectedStyle) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    }

    // Initialize Page load values
    highlightSelectedSwatches();
    update3DImage();
});
