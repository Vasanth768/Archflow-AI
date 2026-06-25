// --- ARCHFLOW AI - GLOBAL APP CONTROLLER & STATE ---

// Clean up old default mock data from localStorage if it exists to keep workspace clean
(function purgeOldMockData() {
    try {
        const existingProjects = localStorage.getItem("archflow_projects");
        if (existingProjects) {
            const projs = JSON.parse(existingProjects);
            const mockNames = ["pethappampatti", "Luxury Villa - Ananya Gupta", "Compact 2BHK - Suresh M"];
            const filtered = projs.filter(p => 
                !mockNames.includes(p.name) && 
                p.client !== "vasanth" && 
                p.client !== "Ananya Gupta" && 
                p.client !== "Suresh M"
            );
            if (filtered.length !== projs.length) {
                localStorage.setItem("archflow_projects", JSON.stringify(filtered));
                // Also reset active project if it was deleted
                const activeId = localStorage.getItem("archflow_active_project_id");
                if (activeId && !filtered.find(f => f.id === activeId)) {
                    if (filtered.length > 0) {
                        localStorage.setItem("archflow_active_project_id", filtered[0].id);
                    } else {
                        localStorage.removeItem("archflow_active_project_id");
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error purging mock data:", e);
    }
})();

// Standard mock architecture images to use across the app
const ARCH_IMAGES = {
    budget: "assets/budget.png",
    standard: "assets/standard.png",
    luxury: "assets/luxury.png",
    traditional: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    minimalist: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    duplex: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    plan_thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230f172a'/><line x1='10' y1='10' x2='90' y2='10' stroke='white' stroke-width='1'/><line x1='10' y1='10' x2='10' y2='90' stroke='white' stroke-width='1'/><line x1='90' y1='10' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='10' y1='90' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='50' y1='10' x2='50' y2='90' stroke='white' stroke-dasharray='3' stroke-width='1'/><rect x='15' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='55' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='15' y='55' width='70' height='30' fill='none' stroke='white' stroke-width='1'/></svg>"
};

// Initial Mock Projects Data
const INITIAL_PROJECTS = [];

// LocalStorage Persistence Handlers
function getProjects() {
    let projects = localStorage.getItem("archflow_projects");
    if (!projects) {
        localStorage.setItem("archflow_projects", JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
    }
    return JSON.parse(projects);
}

function saveProjects(projects) {
    localStorage.setItem("archflow_projects", JSON.stringify(projects));
}

function getProjectById(id) {
    const projects = getProjects();
    return projects.find(p => p.id === id) || projects[0];
}

function getActiveProject() {
    const activeId = localStorage.getItem("archflow_active_project_id");
    const projects = getProjects();
    if (activeId) {
        const activeProj = projects.find(p => p.id === activeId);
        if (activeProj) return activeProj;
    }
    // Default to first project if none active
    if (projects.length > 0) {
        localStorage.setItem("archflow_active_project_id", projects[0].id);
        return projects[0];
    }
    return null;
}

function setActiveProjectId(id) {
    localStorage.setItem("archflow_active_project_id", id);
}

// Generate Default Floor Layout coordinate arrays based on length and width
function generateDefaultRooms(width, length) {
    const scaleFactor = 1.0;
    const rooms = [];
    
    // Scale layout to fit standard canvas coordinate boundaries (typically 30x40 units on a 600x600 canvas)
    // Here we generate standard proportional coordinates
    rooms.push({ id: "r_1", name: "Living Hall", x: 2, y: 2, w: Math.floor(width * 0.45), h: Math.floor(length * 0.35), type: "living" });
    rooms.push({ id: "r_2", name: "Kitchen", x: Math.floor(width * 0.55), y: 2, w: Math.floor(width * 0.35), h: Math.floor(length * 0.22), type: "kitchen" });
    rooms.push({ id: "r_3", name: "Dining Hall", x: Math.floor(width * 0.55), y: Math.floor(length * 0.28), w: Math.floor(width * 0.35), h: Math.floor(length * 0.18), type: "dining" });
    rooms.push({ id: "r_4", name: "Master Bedroom", x: Math.floor(width * 0.45), y: Math.floor(length * 0.5), w: Math.floor(width * 0.45), h: Math.floor(length * 0.28), type: "bedroom" });
    rooms.push({ id: "r_5", name: "Kids Bedroom", x: 2, y: Math.floor(length * 0.42), w: Math.floor(width * 0.38), h: Math.floor(length * 0.22), type: "bedroom" });
    rooms.push({ id: "r_6", name: "Common Bathroom", x: 2, y: Math.floor(length * 0.67), w: Math.floor(width * 0.25), h: Math.floor(length * 0.12), type: "toilet" });
    rooms.push({ id: "r_7", name: "Car Parking Portico", x: 2, y: Math.floor(length * 0.82), w: Math.floor(width * 0.8), h: Math.floor(length * 0.15), type: "parking" });

    return rooms;
}

function createProject(data) {
    const projects = getProjects();
    const width = parseInt(data.width) || 30;
    const length = parseInt(data.length) || 40;
    const area = width * length;
    
    const newProj = {
        id: "project_" + Date.now(),
        name: data.name || `House Plan - ${width}x${length}`,
        client: data.client || "Self",
        type: data.type || "Residential",
        location: data.location || "Default Site Location",
        width: width,
        length: length,
        area: area,
        facing: data.facing || "East",
        corner: data.corner === "true" || data.corner === true,
        road: data.road || "Main Access Road",
        floors: parseInt(data.floors) || 1,
        bedrooms: parseInt(data.bedrooms) || 2,
        bathrooms: parseInt(data.bathrooms) || 2,
        kitchen: 1,
        pooja: data.pooja === "true" || data.pooja === true,
        parking: data.parking === "true" || data.parking === true,
        balcony: data.balcony === "true" || data.balcony === true,
        style: data.style || "Standard Modern",
        budget: data.budget || "Mid Range",
        prompt: data.prompt || `Design a ${width}x${length} house facing ${data.facing}.`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: "Draft",
        selectedStyle: data.style || "Standard Modern",
        materials: {
            facade: "concrete-plaster",
            railings: "steel-grill",
            lighting: "warm-led"
        },
        rooms: generateDefaultRooms(width, length),
        variations: [
            { name: "Budget Friendly", img: ARCH_IMAGES.budget, desc: "Cost-optimized concrete structure, local standard materials, compact structural spans.", tag: "Low Cost" },
            { name: "Standard Modern", img: ARCH_IMAGES.standard, desc: "Clean geometric elevations, wooden accents, double glazing, Vastu compliance.", tag: "Best Choice" },
            { name: "Premium Luxury", img: ARCH_IMAGES.luxury, desc: "Large cantilevered roof spans, Italian marble facades, floor-to-ceiling double-height glass panels.", tag: "Premium" },
            { name: "Minimalist White", img: ARCH_IMAGES.minimalist, desc: "Smooth white render facades, simple clean alignments, geometric forms.", tag: "Minimalism" },
            { name: "Traditional Modern", img: ARCH_IMAGES.traditional, desc: "Clay tile roofs, exposed bricks, wooden columns mixed with steel glass details.", tag: "Heritage" }
        ]
    };
    
    projects.push(newProj);
    saveProjects(projects);
    setActiveProjectId(newProj.id);
    return newProj;
}

function duplicateProject(id) {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    const clone = JSON.parse(JSON.stringify(project));
    clone.id = "project_" + Date.now();
    clone.name = clone.name + " (Copy)";
    clone.createdAt = new Date().toISOString();
    clone.lastUpdated = new Date().toISOString();
    
    projects.push(clone);
    saveProjects(projects);
    showToast("Project duplicated successfully", "success");
    return clone;
}

function deleteProject(id) {
    let projects = getProjects();
    projects = projects.filter(p => p.id !== id);
    saveProjects(projects);
    
    const activeId = localStorage.getItem("archflow_active_project_id");
    if (activeId === id) {
        if (projects.length > 0) {
            localStorage.setItem("archflow_active_project_id", projects[0].id);
        } else {
            localStorage.removeItem("archflow_active_project_id");
        }
    }
    showToast("Project deleted successfully", "warning");
}

function updateProjectRoomLayout(projectId, rooms) {
    const projects = getProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
        projects[idx].rooms = rooms;
        projects[idx].lastUpdated = new Date().toISOString();
        saveProjects(projects);
    }
}

function updateProjectStyleSelection(projectId, selectedStyle) {
    const projects = getProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
        projects[idx].selectedStyle = selectedStyle;
        projects[idx].lastUpdated = new Date().toISOString();
        saveProjects(projects);
    }
}

function updateProjectMaterials(projectId, materials) {
    const projects = getProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
        projects[idx].materials = materials;
        projects[idx].lastUpdated = new Date().toISOString();
        saveProjects(projects);
    }
}

// --- UTILITY: TOAST POPUPS ---
function showToast(message, type = "success") {
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.className = "toast-notification";
        document.body.appendChild(toast);
    }
    
    // Clear classes
    toast.className = `toast-notification ${type}`;
    toast.innerText = message;
    
    // Animate in
    setTimeout(() => {
        toast.classList.add("show");
    }, 100);
    
    // Dismiss after 3s
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Check logged in status (Simulated session logic)
function checkAuth() {
    const loggedIn = localStorage.getItem("archflow_logged_in");
    // If not logged in and not on public pages or login pages, redirect
    const path = window.location.pathname;
    const isPublic = path.includes("index.html") || 
                     path.includes("features.html") || 
                     path.includes("how-it-works.html") || 
                     path.includes("use-cases.html") || 
                     path.includes("pricing.html") || 
                     path.includes("demo.html") || 
                     path.includes("contact.html") || 
                     path.includes("login.html") || 
                     path.includes("signup.html") ||
                     path === "/" ||
                     path === "";
                     
    if (!isPublic && loggedIn !== "true") {
        window.location.href = "login.html";
    }
}

// Export modules to globally available variables
window.ArchFlow = {
    getProjects,
    saveProjects,
    getProjectById,
    getActiveProject,
    setActiveProjectId,
    createProject,
    duplicateProject,
    deleteProject,
    updateProjectRoomLayout,
    updateProjectStyleSelection,
    updateProjectMaterials,
    showToast,
    checkAuth,
    IMAGES: ARCH_IMAGES
};
