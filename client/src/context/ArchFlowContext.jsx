import React, { createContext, useContext, useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { CanonicalOption04 } from '../engine/cad/CanonicalOption04.js';
import { createEmptyPlan } from '../engine/cad/CanonicalSchema.js';
import { ArchitectureAIProvider } from '../engine/cad/ArchitectureAIProvider.js';
import { ConstraintValidator } from '../engine/cad/ConstraintValidator.js';

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

const aiProvider = new ArchitectureAIProvider();
const validator = new ConstraintValidator();

const DEFAULT_PROJECTS = [
    {
        id: 'f1',
        name: 'GF Scheme Plan - Option 04',
        client: 'KS Infra',
        width: 45,
        length: 70,
        floors: 1,
        status: 'Completed',
        time: '2 hours ago',
        badge: 'ref-badge-blue',
        area: 1405,
        facing: 'East',
        bedrooms: 2,
        bathrooms: 4,
        plan: CanonicalOption04,
        rooms: CanonicalOption04.rooms,
        walls: CanonicalOption04.walls,
        doors: CanonicalOption04.doors,
        windows: CanonicalOption04.windows,
        stairs: CanonicalOption04.stairs,
        columns: CanonicalOption04.columns,
        furniture: CanonicalOption04.furniture,
        generatedDesigns: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'f2',
        name: 'Duplex Villa - 40x60',
        client: 'Suresh Builders',
        width: 40,
        length: 60,
        floors: 2,
        status: 'AI Generated',
        time: '1 day ago',
        badge: 'ref-badge-green',
        area: 2400,
        facing: 'North',
        bedrooms: 4,
        bathrooms: 4,
        generatedDesigns: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'f3',
        name: 'Modern House - 20x30',
        client: 'Kumar Family',
        width: 20,
        length: 30,
        floors: 1,
        status: 'Completed',
        time: '2 days ago',
        badge: 'ref-badge-teal',
        area: 600,
        facing: 'West',
        bedrooms: 2,
        bathrooms: 2,
        generatedDesigns: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'f4',
        name: 'Premium Villa - 50x80',
        client: 'Greenfield Developers',
        width: 50,
        length: 80,
        floors: 2,
        status: 'In Progress',
        time: '3 days ago',
        badge: 'ref-badge-blue',
        area: 4000,
        facing: 'South',
        bedrooms: 5,
        bathrooms: 5,
        generatedDesigns: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    }
];

export const ArchFlowProvider = ({ children }) => {
    const [projects, setProjects] = useState(DEFAULT_PROJECTS);
    const [activeProjectId, setActiveProjectId] = useState('f1');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const normalizeProject = (p) => {
        if (p.id === 'f1' || (p.width === 45 && p.length === 70)) {
            return {
                ...p,
                plan: CanonicalOption04,
                walls: CanonicalOption04.walls,
                rooms: CanonicalOption04.rooms,
                doors: CanonicalOption04.doors,
                windows: CanonicalOption04.windows,
                furniture: CanonicalOption04.furniture,
                stairs: CanonicalOption04.stairs,
                columns: CanonicalOption04.columns
            };
        }
        if (!p.plan) {
            const blank = createEmptyPlan({
                id: p.id,
                name: p.name,
                client: p.client,
                width: p.width || 30,
                length: p.length || 40,
                facing: p.facing || 'East',
                floors: p.floors || 1
            });
            return {
                ...p,
                plan: blank,
                walls: blank.walls,
                rooms: p.rooms || blank.rooms,
                doors: blank.doors,
                windows: blank.windows,
                furniture: blank.furniture
            };
        }
        return p;
    };

    // Fetch projects from API on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_URL}/api/projects`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const normalized = data.map(normalizeProject);
                        setProjects(normalized);
                        localStorage.setItem("archflow_projects", JSON.stringify(normalized));
                        setActiveProjectId(normalized[0].id);
                        localStorage.setItem("archflow_active_project_id", normalized[0].id);
                    }
                } else {
                    throw new Error("HTTP " + res.status);
                }
            } catch (e) {
                console.warn("Loading from localStorage fallback:", e);
                const localData = localStorage.getItem("archflow_projects");
                if (localData) {
                    try {
                        const parsed = JSON.parse(localData);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            const normalized = parsed.map(normalizeProject);
                            setProjects(normalized);
                            setActiveProjectId(normalized[0].id);
                        } else {
                            setProjects(DEFAULT_PROJECTS);
                            localStorage.setItem("archflow_projects", JSON.stringify(DEFAULT_PROJECTS));
                            setActiveProjectId('f1');
                        }
                    } catch (err) {
                        setProjects(DEFAULT_PROJECTS);
                        localStorage.setItem("archflow_projects", JSON.stringify(DEFAULT_PROJECTS));
                        setActiveProjectId('f1');
                    }
                } else {
                    setProjects(DEFAULT_PROJECTS);
                    localStorage.setItem("archflow_projects", JSON.stringify(DEFAULT_PROJECTS));
                    setActiveProjectId('f1');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [API_URL]);

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

        const newPlan = createEmptyPlan({
            id: "project_" + Date.now(),
            name: data.name || `House Plan - ${width}x${length}`,
            client: data.client || "Self",
            type: data.type || "Residential",
            width: width,
            length: length,
            facing: data.facing || "East",
            floors: parseInt(data.floors) || 1,
            style: data.style || "Standard Modern"
        });

        const newProj = {
            id: newPlan.project.id,
            name: newPlan.project.name,
            client: newPlan.project.client,
            type: newPlan.project.type,
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
            materials: newPlan.materials,
            plan: newPlan,
            rooms: newPlan.rooms,
            walls: newPlan.walls,
            doors: newPlan.doors,
            windows: newPlan.windows,
            furniture: newPlan.furniture,
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

    const updateProjectPlan = (projectId, updatedPlan) => {
        const updated = projects.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    plan: updatedPlan,
                    walls: updatedPlan.walls,
                    rooms: updatedPlan.rooms,
                    doors: updatedPlan.doors,
                    windows: updatedPlan.windows,
                    furniture: updatedPlan.furniture,
                    stairs: updatedPlan.stairs,
                    columns: updatedPlan.columns,
                    lastUpdated: new Date().toISOString()
                };
            }
            return p;
        });
        saveProjectsList(updated);
    };

    const duplicateProject = (id) => {
        const project = projects.find(p => p.id === id) || DEFAULT_PROJECTS.find(p => p.id === id);
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

    const renameProject = (id, newName) => {
        const updated = projects.map(p => {
            if (p.id === id) {
                return { ...p, name: newName, lastUpdated: new Date().toISOString() };
            }
            return p;
        });
        saveProjectsList(updated);
        showToast("Project renamed successfully", "success");
    };

    const updateProjectRoomLayout = (projectId, rooms) => {
        const updated = projects.map(p => {
            if (p.id === projectId) {
                const plan = p.plan ? { ...p.plan, rooms } : { ...createEmptyPlan(), rooms };
                return { ...p, rooms, plan, lastUpdated: new Date().toISOString() };
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

    return (
        <ArchFlowContext.Provider value={{
            projects,
            activeProjectId,
            loading,
            selectProject,
            getActiveProject,
            createProject,
            updateProjectPlan,
            duplicateProject,
            deleteProject,
            renameProject,
            updateProjectRoomLayout,
            updateProjectStyleSelection,
            updateProjectMaterials,
            showToast,
            aiProvider,
            validator,
            IMAGES: ARCH_IMAGES
        }}>
            {children}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </ArchFlowContext.Provider>
    );
};

export const useArchFlow = () => useContext(ArchFlowContext);
