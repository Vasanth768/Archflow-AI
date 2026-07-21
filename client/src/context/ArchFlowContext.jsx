import React, { createContext, useContext, useState, useEffect } from 'react';

const ArchFlowContext = createContext(null);

const ARCH_IMAGES = {
    budget: "/assets/budget.png",
    standard: "/assets/standard.png",
    luxury: "/assets/luxury.png",
    traditional: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    minimalist: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    duplex: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    plan_thumb: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230f172a'/><line x1='10' y1='10' x2='90' y2='10' stroke='white' stroke-width='1'/><line x1='10' y1='10' x2='10' y2='90' stroke='white' stroke-width='1'/><line x1='90' y1='10' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='10' y1='90' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='50' y1='10' x2='50' y2='90' stroke='white' stroke-dasharray='3' stroke-width='1'/><rect x='15' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='55' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='15' y='55' width='70' height='30' fill='none' stroke='white' stroke-width='1'/></svg>"
};

export const ArchFlowProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    // Fetch projects from API on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_URL}/api/projects`);
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                    
                    const savedActiveId = localStorage.getItem("archflow_active_project_id");
                    if (savedActiveId && data.find(p => p.id === savedActiveId)) {
                        setActiveProjectId(savedActiveId);
                    } else if (data.length > 0) {
                        setActiveProjectId(data[0].id);
                        localStorage.setItem("archflow_active_project_id", data[0].id);
                    }
                } else {
                    throw new Error("HTTP " + res.status);
                }
            } catch (e) {
                console.warn("Failed to load projects from server, loading from localStorage fallback:", e);
                const localData = localStorage.getItem("archflow_projects");
                if (localData) {
                    const parsed = JSON.parse(localData);
                    setProjects(parsed);
                    if (parsed.length > 0) {
                        setActiveProjectId(parsed[0].id);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const saveProjectsList = async (updatedProjects) => {
        setProjects(updatedProjects);
        localStorage.setItem("archflow_projects", JSON.stringify(updatedProjects));
        
        try {
            await fetch(`${API_URL}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProjects)
            });
        } catch (e) {
            console.error("Failed to sync projects list with server:", e);
        }
    };

    const generateDefaultRooms = (width, length) => {
        const rooms = [];
        rooms.push({ id: "r_1", name: "Living Hall", x: 2, y: 2, w: Math.floor(width * 0.45), h: Math.floor(length * 0.35), type: "living" });
        rooms.push({ id: "r_2", name: "Kitchen", x: Math.floor(width * 0.55), y: 2, w: Math.floor(width * 0.35), h: Math.floor(length * 0.22), type: "kitchen" });
        rooms.push({ id: "r_3", name: "Dining Hall", x: Math.floor(width * 0.55), y: Math.floor(length * 0.28), w: Math.floor(width * 0.35), h: Math.floor(length * 0.18), type: "dining" });
        rooms.push({ id: "r_4", name: "Master Bedroom", x: Math.floor(width * 0.45), y: Math.floor(length * 0.5), w: Math.floor(width * 0.45), h: Math.floor(length * 0.28), type: "bedroom" });
        rooms.push({ id: "r_5", name: "Kids Bedroom", x: 2, y: Math.floor(length * 0.42), w: Math.floor(width * 0.38), h: Math.floor(length * 0.22), type: "bedroom" });
        rooms.push({ id: "r_6", name: "Common Bathroom", x: 2, y: Math.floor(length * 0.67), w: Math.floor(width * 0.25), h: Math.floor(length * 0.12), type: "toilet" });
        rooms.push({ id: "r_7", name: "Car Parking Portico", x: 2, y: Math.floor(length * 0.82), w: Math.floor(width * 0.8), h: Math.floor(length * 0.15), type: "parking" });
        return rooms;
    };

    const getActiveProject = () => {
        return projects.find(p => p.id === activeProjectId) || projects[0] || null;
    };

    const selectProject = (id) => {
        setActiveProjectId(id);
        localStorage.setItem("archflow_active_project_id", id);
    };

    const createProject = (data) => {
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

        const updated = [...projects, newProj];
        saveProjectsList(updated);
        selectProject(newProj.id);
        return newProj;
    };

    const duplicateProject = (id) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        const clone = JSON.parse(JSON.stringify(project));
        clone.id = "project_" + Date.now();
        clone.name = clone.name + " (Copy)";
        clone.createdAt = new Date().toISOString();
        clone.lastUpdated = new Date().toISOString();

        const updated = [...projects, clone];
        saveProjectsList(updated);
        showToast("Project duplicated successfully", "success");
        return clone;
    };

    const deleteProject = (id) => {
        const updated = projects.filter(p => p.id !== id);
        saveProjectsList(updated);
        
        if (activeProjectId === id) {
            if (updated.length > 0) {
                selectProject(updated[0].id);
            } else {
                setActiveProjectId(null);
                localStorage.removeItem("archflow_active_project_id");
            }
        }
        showToast("Project deleted successfully", "warning");
    };

    const updateProjectRoomLayout = (projectId, rooms) => {
        const updated = projects.map(p => {
            if (p.id === projectId) {
                return { ...p, rooms, lastUpdated: new Date().toISOString() };
            }
            return p;
        });
        saveProjectsList(updated);
    };

    const updateProjectStyleSelection = (projectId, selectedStyle) => {
        const updated = projects.map(p => {
            if (p.id === projectId) {
                return { ...p, selectedStyle, lastUpdated: new Date().toISOString() };
            }
            return p;
        });
        saveProjectsList(updated);
    };

    const updateProjectMaterials = (projectId, materials) => {
        const updated = projects.map(p => {
            if (p.id === projectId) {
                return { ...p, materials, lastUpdated: new Date().toISOString() };
            }
            return p;
        });
        saveProjectsList(updated);
    };

    // Helper functions exported on window for non-migrated script tags (backward compatibility)
    useEffect(() => {
        window.ArchFlow = {
            getProjects: () => projects,
            saveProjects: saveProjectsList,
            getProjectById: (id) => projects.find(p => p.id === id) || projects[0],
            getActiveProject,
            setActiveProjectId: selectProject,
            createProject,
            duplicateProject,
            deleteProject,
            updateProjectRoomLayout,
            updateProjectStyleSelection,
            updateProjectMaterials,
            showToast,
            checkAuth: () => {
                const loggedIn = localStorage.getItem("archflow_logged_in");
                if (loggedIn !== "true" && !window.location.pathname.includes("login.html") && !window.location.pathname.includes("signup.html")) {
                    window.location.href = "/login";
                }
            },
            IMAGES: ARCH_IMAGES
        };
    }, [projects, activeProjectId]);

    return (
        <ArchFlowContext.Provider value={{
            projects,
            activeProjectId,
            loading,
            selectProject,
            getActiveProject,
            createProject,
            duplicateProject,
            deleteProject,
            updateProjectRoomLayout,
            updateProjectStyleSelection,
            updateProjectMaterials,
            showToast,
            IMAGES: ARCH_IMAGES
        }}>
            {children}
            {toast && (
                <div id="app-toast" className={`toast-notification show ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </ArchFlowContext.Provider>
    );
};

export const useArchFlow = () => useContext(ArchFlowContext);
