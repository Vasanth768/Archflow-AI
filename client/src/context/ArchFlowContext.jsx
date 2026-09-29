import React, { createContext, useContext, useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { CanonicalOption04 } from '../engine/cad/CanonicalOption04.js';
import { createEmptyPlan } from '../engine/cad/CanonicalSchema.js';
import { ArchitectureAIProvider } from '../engine/cad/ArchitectureAIProvider.js';
import { ConstraintValidator } from '../engine/cad/ConstraintValidator.js';
import { generateDefaultFloorPlan } from '../engine/cad/PlanGenerator.js';

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

export const ArchFlowProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Authentication State Management
    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    // Helper: getUserKey for isolated storage
    const getUserKey = (currentUser) => {
        return currentUser?.email || localStorage.getItem("archflow_email") || "guest_user";
    };

    const normalizeProject = (p) => {
        if (!p) return null;
        if (!p.plan || !p.plan.rooms || p.plan.rooms.length === 0) {
            const defaultPlan = generateDefaultFloorPlan({
                id: p.id,
                name: p.name,
                client: p.client,
                width: p.width || 40,
                length: p.length || 30,
                facing: p.facing || 'East',
                floors: p.floors || 1
            });
            return {
                ...p,
                plan: defaultPlan,
                walls: defaultPlan.walls,
                rooms: defaultPlan.rooms,
                doors: defaultPlan.doors,
                windows: defaultPlan.windows,
                furniture: defaultPlan.furniture,
                stairs: defaultPlan.stairs,
                columns: defaultPlan.columns
            };
        }
        return p;
    };

    // Load projects for a specific user
    const loadUserProjects = (currentUser) => {
        const uKey = getUserKey(currentUser);
        try {
            const localData = localStorage.getItem("archflow_projects_" + uKey);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed)) {
                    const normalized = parsed.map(normalizeProject).filter(Boolean);
                    setProjects(normalized);
                    const savedActiveId = localStorage.getItem("archflow_active_project_id_" + uKey);
                    if (savedActiveId && normalized.some(p => p.id === savedActiveId)) {
                        setActiveProjectId(savedActiveId);
                    } else if (normalized.length > 0) {
                        setActiveProjectId(normalized[0].id);
                    } else {
                        setActiveProjectId(null);
                    }
                    return;
                }
            }
            // If no user projects exist, initialize strictly as empty
            setProjects([]);
            setActiveProjectId(null);
        } catch (err) {
            console.error("Failed to load user projects:", err);
            setProjects([]);
            setActiveProjectId(null);
        }
    };

    // Initialize/Restore Auth Session
    useEffect(() => {
        const restoreSession = () => {
            try {
                const loggedIn = localStorage.getItem("archflow_logged_in");
                const firstName = localStorage.getItem("archflow_first_name") || "";
                const lastName = localStorage.getItem("archflow_last_name") || "";
                const profileName = localStorage.getItem("archflow_profile_name") || (firstName && lastName ? `${firstName} ${lastName}` : firstName || "Demo User");
                const companyName = localStorage.getItem("archflow_company_name") || "Personal Studio";
                const mobileNumber = localStorage.getItem("archflow_mobile") || "";
                const location = localStorage.getItem("archflow_location") || "";
                const email = localStorage.getItem("archflow_email") || "";
                const credits = localStorage.getItem("archflow_credits");

                if (loggedIn === "true") {
                    const fullName = profileName || (firstName && lastName ? `${firstName} ${lastName}` : "Demo User");
                    const restoredUser = {
                        firstName: firstName || fullName.split(" ")[0] || "Demo",
                        lastName: lastName || fullName.split(" ").slice(1).join(" ") || "User",
                        name: fullName,
                        fullName: fullName,
                        company: companyName,
                        companyName: companyName,
                        mobileNumber: mobileNumber,
                        location: location,
                        email: email || "architect@company.com",
                        credits: credits ? parseInt(credits, 10) : 100
                    };
                    setUser(restoredUser);
                    setIsAuthenticated(true);
                    loadUserProjects(restoredUser);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    setProjects([]);
                    setActiveProjectId(null);
                }
            } catch (err) {
                console.error("Failed to restore session:", err);
                setUser(null);
                setIsAuthenticated(false);
                setProjects([]);
                setActiveProjectId(null);
            } finally {
                setAuthLoading(false);
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = ({ email, password }) => {
        if (!email || !email.trim() || !password || !password.trim()) {
            return { success: false, error: "Please enter both email and password" };
        }

        try {
            const trimmedEmail = email.trim();
            const firstName = localStorage.getItem("archflow_first_name") || "";
            const lastName = localStorage.getItem("archflow_last_name") || "";
            const savedProfile = localStorage.getItem("archflow_profile_name") || (firstName && lastName ? `${firstName} ${lastName}` : firstName || "Demo User");
            const savedCompany = localStorage.getItem("archflow_company_name") || "Apex Builders";
            const savedCredits = localStorage.getItem("archflow_credits") || "632";
            const savedMobile = localStorage.getItem("archflow_mobile") || "";
            const savedLocation = localStorage.getItem("archflow_location") || "";

            localStorage.setItem("archflow_logged_in", "true");
            localStorage.setItem("archflow_profile_name", savedProfile);
            localStorage.setItem("archflow_company_name", savedCompany);
            localStorage.setItem("archflow_email", trimmedEmail);
            localStorage.setItem("archflow_credits", savedCredits);

            const fullName = savedProfile || (firstName && lastName ? `${firstName} ${lastName}` : "Demo User");
            const newUser = {
                firstName: firstName || fullName.split(" ")[0] || "Demo",
                lastName: lastName || fullName.split(" ").slice(1).join(" ") || "User",
                name: fullName,
                fullName: fullName,
                company: savedCompany,
                companyName: savedCompany,
                mobileNumber: savedMobile,
                location: savedLocation,
                email: trimmedEmail,
                credits: parseInt(savedCredits, 10)
            };

            setUser(newUser);
            setIsAuthenticated(true);
            setAuthLoading(false);
            loadUserProjects(newUser);

            return { success: true, user: newUser };
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, error: "Failed to login. Please try again." };
        }
    };

    const signup = ({ firstName, lastName, mobileNumber, email, password, companyName, location }) => {
        if (!firstName?.trim() || !lastName?.trim() || !mobileNumber?.trim() || !email?.trim() || !password?.trim() || !companyName?.trim() || !location?.trim()) {
            return { success: false, error: "Please fill in all required fields" };
        }

        try {
            const trimmedFirst = firstName.trim();
            const trimmedLast = lastName.trim();
            const full = `${trimmedFirst} ${trimmedLast}`;
            const trimmedMobile = mobileNumber.trim();
            const trimmedEmail = email.trim();
            const trimmedCompany = companyName.trim();
            const trimmedLocation = location.trim();

            localStorage.setItem("archflow_logged_in", "true");
            localStorage.setItem("archflow_first_name", trimmedFirst);
            localStorage.setItem("archflow_last_name", trimmedLast);
            localStorage.setItem("archflow_profile_name", full);
            localStorage.setItem("archflow_company_name", trimmedCompany);
            localStorage.setItem("archflow_mobile", trimmedMobile);
            localStorage.setItem("archflow_location", trimmedLocation);
            localStorage.setItem("archflow_email", trimmedEmail);
            localStorage.setItem("archflow_credits", "100");

            // Initialize brand-new user with strictly EMPTY projects collection
            localStorage.setItem("archflow_projects_" + trimmedEmail, JSON.stringify([]));
            localStorage.removeItem("archflow_active_project_id_" + trimmedEmail);

            const newUser = {
                firstName: trimmedFirst,
                lastName: trimmedLast,
                name: full,
                fullName: full,
                company: trimmedCompany,
                companyName: trimmedCompany,
                mobileNumber: trimmedMobile,
                location: trimmedLocation,
                email: trimmedEmail,
                credits: 100
            };

            setUser(newUser);
            setIsAuthenticated(true);
            setAuthLoading(false);
            setProjects([]);
            setActiveProjectId(null);

            return { success: true, user: newUser };
        } catch (err) {
            console.error("Signup error:", err);
            return { success: false, error: "Failed to create account. Please try again." };
        }
    };

    const logout = () => {
        try {
            localStorage.removeItem("archflow_logged_in");
            setUser(null);
            setIsAuthenticated(false);
            setAuthLoading(false);
            setProjects([]);
            setActiveProjectId(null);
            return { success: true };
        } catch (err) {
            console.error("Logout error:", err);
            setUser(null);
            setIsAuthenticated(false);
            setProjects([]);
            setActiveProjectId(null);
            return { success: true };
        }
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const saveProjectsList = (updatedProjects) => {
        const uKey = getUserKey(user);
        setProjects(updatedProjects);
        localStorage.setItem("archflow_projects_" + uKey, JSON.stringify(updatedProjects));
    };

    const getActiveProject = () => {
        if (!projects || projects.length === 0) return null;
        return projects.find(p => p.id === activeProjectId) || projects[0] || null;
    };

    const selectProject = (id) => {
        const uKey = getUserKey(user);
        setActiveProjectId(id);
        if (id) {
            localStorage.setItem("archflow_active_project_id_" + uKey, id);
        } else {
            localStorage.removeItem("archflow_active_project_id_" + uKey);
        }
    };

    const createProject = (data) => {
        const width = parseInt(data.width) || 40;
        const length = parseInt(data.length) || 30;
        const area = width * length;

        const newPlan = generateDefaultFloorPlan({
            id: "project_" + Date.now(),
            name: data.name || `${width}x${length} ${data.facing || 'East'} Facing House`,
            client: data.client || user?.fullName || "Self",
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
            location: data.location || user?.location || "Site Location",
            width: width,
            length: length,
            area: area,
            facing: data.facing || "East",
            corner: data.corner === "true" || data.corner === true,
            road: data.road || "Main Access Road",
            floors: parseInt(data.floors) || 1,
            bedrooms: parseInt(data.bedrooms) || 2,
            bathrooms: parseInt(data.bathrooms) || 1,
            kitchen: 1,
            pooja: data.pooja === "true" || data.pooja === true,
            parking: data.parking === "true" || data.parking === true,
            balcony: data.balcony === "true" || data.balcony === true,
            style: data.style || "Standard Modern",
            budget: data.budget || "Mid Range",
            prompt: data.prompt || `Design a ${width}x${length} house facing ${data.facing}.`,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            status: "Saved",
            selectedStyle: data.style || "Standard Modern",
            materials: newPlan.materials,
            plan: newPlan,
            rooms: newPlan.rooms,
            walls: newPlan.walls,
            doors: newPlan.doors,
            windows: newPlan.windows,
            furniture: newPlan.furniture,
            stairs: newPlan.stairs,
            columns: newPlan.columns,
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

    const executeDesignGeneration = async (projectId, options = {}) => {
        const proj = projects.find(p => p.id === projectId);
        if (!proj) throw new Error("Project not found");

        const reqBody = {
            requirements: {
                projectId: proj.id,
                width: proj.width || 30,
                length: proj.length || 40,
                facing: proj.facing || 'East',
                context: options.context || 'City',
                buildingType: options.buildingType || 'single_floor',
                styleDirection: options.styleDirection || proj.style || 'Standard Modern',
                roofStyle: options.roofStyle || 'Auto',
                budget: options.budget || proj.budget || 'Standard'
            },
            count: options.count || 6
        };

        const res = await fetch('/api/designs/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (err.code === "AI_PROVIDER_NOT_CONFIGURED") {
                throw new Error("AI_PROVIDER_NOT_CONFIGURED");
            }
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        const variations = await res.json();
        const updated = projects.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    generatedVariations: variations,
                    lastUpdated: new Date().toISOString()
                };
            }
            return p;
        });
        saveProjectsList(updated);
        return variations;
    };

    const executeSingleRegeneration = async (projectId, designId, prompt = null) => {
        const proj = projects.find(p => p.id === projectId);
        if (!proj) throw new Error("Project not found");

        const existingDesign = (proj.generatedVariations || []).find(d => d.id === designId) || {};

        const res = await fetch('/api/designs/regenerate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ design: existingDesign, prompt })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        const updatedDesign = await res.json();
        const updated = projects.map(p => {
            if (p.id === projectId) {
                const list = (p.generatedVariations || []).map(d => d.id === designId ? updatedDesign : d);
                return { ...p, generatedVariations: list, lastUpdated: new Date().toISOString() };
            }
            return p;
        });
        saveProjectsList(updated);
        return updatedDesign;
    };

    const toggleFavoriteDesign = (projectId, designId) => {
        const updated = projects.map(p => {
            if (p.id === projectId) {
                const list = (p.generatedVariations || []).map(d => {
                    if (d.id === designId) {
                        return { ...d, isFavorite: !d.isFavorite };
                    }
                    return d;
                });
                return { ...p, generatedVariations: list, lastUpdated: new Date().toISOString() };
            }
            return p;
        });
        saveProjectsList(updated);
    };

    return (
        <ArchFlowContext.Provider value={{
            // Auth State & Actions
            authLoading,
            isAuthenticated,
            user,
            login,
            signup,
            logout,
            // Projects & Engine
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
            executeDesignGeneration,
            executeSingleRegeneration,
            toggleFavoriteDesign,
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
