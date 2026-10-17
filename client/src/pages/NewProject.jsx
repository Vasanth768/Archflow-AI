import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';
import { 
    FileText, MapPin, Compass, Home, Layers, Bed, Bath, Car, 
    Palette, DollarSign, Sparkles, Shield, Check, RefreshCw, 
    Plus, Minus, CheckCircle2, User, Maximize2, Building2, 
    ArrowRight, ArrowLeft, AlertCircle, HelpCircle, Trash2, Info
} from 'lucide-react';
import '../css/newProject.css';

const CounterControl = ({ value, onChange, min = 0, max = 10 }) => (
    <div className="np-counter">
        <button 
            type="button" 
            className="np-counter-btn" 
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
        >
            <Minus size={14} strokeWidth={2.5} />
        </button>
        <span className="np-counter-val">{value}</span>
        <button 
            type="button" 
            className="np-counter-btn" 
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
        >
            <Plus size={14} strokeWidth={2.5} />
        </button>
    </div>
);

export default function NewProject() {
    const navigate = useNavigate();
    const { createProject, showToast, IMAGES, user } = useArchFlow();
    const userKey = user?.email || user?.id || 'guest';

    useEffect(() => {
        if (window.location.search.includes('mode=ai')) {
            navigate('/ai-generator', { replace: true });
        }
    }, [navigate]);

    // Wizard Step & Validation State
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [errors, setErrors] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);

    // Form fields & states initialized clean
    const [name, setName] = useState('30x40 East Facing Residence');
    const [client, setClient] = useState(user?.fullName || '');
    const [width, setWidth] = useState(30);
    const [length, setLength] = useState(40);
    const [facing, setFacing] = useState('East');
    const [corner, setCorner] = useState(false);
    const [road, setRoad] = useState('30 ft Road');
    const [floors, setFloors] = useState(1);
    const [bedrooms, setBedrooms] = useState(2);
    const [bathrooms, setBathrooms] = useState(2);
    const [pooja, setPooja] = useState(false);
    const [parking, setParking] = useState(true);
    const [balcony, setBalcony] = useState(false);
    const [style, setStyle] = useState('Standard Modern');
    const [budget, setBudget] = useState('Mid Range');
    const [prompt, setPrompt] = useState('');

    // Additional UI states matching reference card & wizard expansion
    const [projectType, setProjectType] = useState('Residential');
    const [location, setLocation] = useState(user?.location || '');
    const [description, setDescription] = useState('');
    const [units, setUnits] = useState('ft');
    const [roadWidth, setRoadWidth] = useState('30 ft');
    const [roadPosition, setRoadPosition] = useState('Front Only');

    const [hall, setHall] = useState(1);
    const [kitchen, setKitchen] = useState(1);
    const [dining, setDining] = useState(1);
    const [poojaCount, setPoojaCount] = useState(0);
    const [balconyCount, setBalconyCount] = useState(0);
    const [parkingStr, setParkingStr] = useState('1 Car');
    
    // Additional SaaS Building Requirement Counters
    const [study, setStudy] = useState(0);
    const [storeRoom, setStoreRoom] = useState(0);
    const [utility, setUtility] = useState(0);
    const [office, setOffice] = useState(0);

    const [staircasePref, setStaircasePref] = useState('Inside');
    const [staircaseType, setStaircaseType] = useState('Straight');
    const [livingType, setLivingType] = useState('Open Living');
    const [priorities, setPriorities] = useState(['More Ventilation', 'More Natural Light', 'Vastu Focus']);

    // Canonical User-Controlled Room Requirements (Stage 8E Fix)
    const initialRoomsPreset2BHK = [
        { id: 'rm_1', type: 'master_bedroom', name: 'Master Bedroom', widthFt: 14, lengthFt: 16, floor: 1, isExact: true },
        { id: 'rm_2', type: 'attached_toilet', name: 'Att. Bathroom', widthFt: 6, lengthFt: 7, floor: 1, attachedTo: 'rm_1', isAttached: true, isExact: true },
        { id: 'rm_3', type: 'bedroom', name: 'Bedroom 2', widthFt: 11, lengthFt: 12, floor: 1, isExact: true },
        { id: 'rm_4', type: 'common_bathroom', name: 'Common Bathroom', widthFt: 6, lengthFt: 5, floor: 1, isAttached: false, isExact: true },
        { id: 'rm_5', type: 'kitchen', name: 'Kitchen', widthFt: 10, lengthFt: 10, floor: 1, isExact: true },
        { id: 'rm_6', type: 'living', name: 'Living Hall', widthFt: 14, lengthFt: 16, floor: 1, isExact: true },
        { id: 'rm_7', type: 'pooja', name: 'Pooja Room', widthFt: 5, lengthFt: 5, floor: 1, isExact: true }
    ];
    const [roomList, setRoomList] = useState(initialRoomsPreset2BHK);
    const [activePreset, setActivePreset] = useState('2BHK');
    const [newRoomType, setNewRoomType] = useState('bedroom');

    const handleApplyPreset = (presetName) => {
        setActivePreset(presetName);
        if (presetName === '1BHK') {
            const mbId = 'rm_' + Date.now() + '_1';
            setRoomList([
                { id: mbId, type: 'master_bedroom', name: 'Master Bedroom', widthFt: 12, lengthFt: 14, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_2', type: 'attached_toilet', name: 'Att. Bathroom', widthFt: 6, lengthFt: 6, floor: 1, attachedTo: mbId, isAttached: true, isExact: true },
                { id: 'rm_' + Date.now() + '_3', type: 'kitchen', name: 'Kitchen', widthFt: 9, lengthFt: 10, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_4', type: 'living', name: 'Living Hall', widthFt: 13, lengthFt: 14, floor: 1, isExact: true }
            ]);
            setBedrooms(1);
            setBathrooms(1);
        } else if (presetName === '2BHK') {
            const mbId = 'rm_' + Date.now() + '_1';
            setRoomList([
                { id: mbId, type: 'master_bedroom', name: 'Master Bedroom', widthFt: 14, lengthFt: 16, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_2', type: 'attached_toilet', name: 'Att. Bathroom', widthFt: 6, lengthFt: 7, floor: 1, attachedTo: mbId, isAttached: true, isExact: true },
                { id: 'rm_' + Date.now() + '_3', type: 'bedroom', name: 'Bedroom 2', widthFt: 11, lengthFt: 12, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_4', type: 'common_bathroom', name: 'Common Bathroom', widthFt: 6, lengthFt: 5, floor: 1, isAttached: false, isExact: true },
                { id: 'rm_' + Date.now() + '_5', type: 'kitchen', name: 'Kitchen', widthFt: 10, lengthFt: 10, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_6', type: 'living', name: 'Living Hall', widthFt: 14, lengthFt: 16, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_7', type: 'pooja', name: 'Pooja Room', widthFt: 5, lengthFt: 5, floor: 1, isExact: true }
            ]);
            setBedrooms(2);
            setBathrooms(2);
        } else if (presetName === '3BHK') {
            const mbId = 'rm_' + Date.now() + '_1';
            setRoomList([
                { id: mbId, type: 'master_bedroom', name: 'Master Bedroom', widthFt: 15, lengthFt: 18, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_2', type: 'attached_toilet', name: 'Att. Bathroom', widthFt: 6, lengthFt: 8, floor: 1, attachedTo: mbId, isAttached: true, isExact: true },
                { id: 'rm_' + Date.now() + '_3', type: 'bedroom', name: 'Bedroom 2', widthFt: 12, lengthFt: 14, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_4', type: 'bedroom', name: 'Bedroom 3', widthFt: 11, lengthFt: 13, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_5', type: 'common_bathroom', name: 'Common Bathroom', widthFt: 6, lengthFt: 6, floor: 1, isAttached: false, isExact: true },
                { id: 'rm_' + Date.now() + '_6', type: 'kitchen', name: 'Kitchen', widthFt: 12, lengthFt: 12, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_7', type: 'dining', name: 'Dining Room', widthFt: 12, lengthFt: 12, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_8', type: 'living', name: 'Living Hall', widthFt: 16, lengthFt: 18, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_9', type: 'pooja', name: 'Pooja Room', widthFt: 6, lengthFt: 6, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_10', type: 'utility', name: 'Utility Area', widthFt: 7, lengthFt: 5, floor: 1, isExact: true }
            ]);
            setBedrooms(3);
            setBathrooms(2);
        } else if (presetName === '4BHK') {
            const mbId = 'rm_' + Date.now() + '_1';
            const b2Id = 'rm_' + Date.now() + '_3';
            setRoomList([
                { id: mbId, type: 'master_bedroom', name: 'Master Bedroom', widthFt: 16, lengthFt: 20, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_2', type: 'attached_toilet', name: 'Att. Bathroom 1', widthFt: 7, lengthFt: 9, floor: 1, attachedTo: mbId, isAttached: true, isExact: true },
                { id: b2Id, type: 'bedroom', name: 'Bedroom 2', widthFt: 14, lengthFt: 15, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_4', type: 'attached_toilet', name: 'Att. Bathroom 2', widthFt: 6, lengthFt: 7, floor: 1, attachedTo: b2Id, isAttached: true, isExact: true },
                { id: 'rm_' + Date.now() + '_5', type: 'bedroom', name: 'Bedroom 3', widthFt: 13, lengthFt: 14, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_6', type: 'bedroom', name: 'Bedroom 4', widthFt: 12, lengthFt: 13, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_7', type: 'common_bathroom', name: 'Common Bathroom', widthFt: 7, lengthFt: 6, floor: 1, isAttached: false, isExact: true },
                { id: 'rm_' + Date.now() + '_8', type: 'kitchen', name: 'Kitchen', widthFt: 14, lengthFt: 12, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_9', type: 'dining', name: 'Dining Room', widthFt: 14, lengthFt: 14, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_10', type: 'living', name: 'Living Hall', widthFt: 18, lengthFt: 20, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_11', type: 'pooja', name: 'Pooja Room', widthFt: 6, lengthFt: 6, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_12', type: 'study', name: 'Study Room', widthFt: 10, lengthFt: 10, floor: 1, isExact: true }
            ]);
            setBedrooms(4);
            setBathrooms(3);
        } else if (presetName === 'Custom') {
            setRoomList([
                { id: 'rm_' + Date.now() + '_1', type: 'living', name: 'Living Hall', widthFt: 14, lengthFt: 14, floor: 1, isExact: true },
                { id: 'rm_' + Date.now() + '_2', type: 'kitchen', name: 'Kitchen', widthFt: 10, lengthFt: 10, floor: 1, isExact: true }
            ]);
            setBedrooms(0);
            setBathrooms(0);
        }
    };
    const applyPreset = handleApplyPreset;

    const handleAddRoom = (type = 'bedroom') => {
        const id = 'rm_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const nameMap = {
            master_bedroom: 'Master Bedroom',
            bedroom: `Bedroom ${roomList.filter(r => r.type === 'bedroom').length + 2}`,
            attached_toilet: 'Att. Bathroom',
            common_bathroom: 'Common Bathroom',
            kitchen: 'Kitchen',
            living: 'Living Hall',
            dining: 'Dining Room',
            pooja: 'Pooja Room',
            study: 'Study Room',
            store: 'Store Room',
            utility: 'Utility Area',
            home_office: 'Home Office',
            parking: 'Parking Space',
            balcony: 'Balcony'
        };
        const dimMap = {
            master_bedroom: { w: 14, l: 16 },
            bedroom: { w: 11, l: 12 },
            attached_toilet: { w: 6, l: 7 },
            common_bathroom: { w: 6, l: 5 },
            kitchen: { w: 10, l: 10 },
            living: { w: 14, l: 16 },
            dining: { w: 12, l: 12 },
            pooja: { w: 5, l: 5 },
            study: { w: 10, l: 10 },
            store: { w: 7, l: 6 },
            utility: { w: 7, l: 5 },
            home_office: { w: 10, l: 10 },
            parking: { w: 12, l: 16 },
            balcony: { w: 10, l: 5 }
        };
        const defaultDim = dimMap[type] || { w: 10, l: 10 };
        const hostBed = roomList.find(r => r.type === 'master_bedroom') || roomList.find(r => r.type === 'bedroom');
        const newRoom = {
            id,
            type,
            name: nameMap[type] || 'Room',
            widthFt: defaultDim.w,
            lengthFt: defaultDim.l,
            floor: 1,
            isExact: true,
            attachedTo: type === 'attached_toilet' ? (hostBed ? hostBed.id : null) : null,
            isAttached: type === 'attached_toilet'
        };
        setRoomList(prev => [...prev, newRoom]);
        setActivePreset('Custom');
    };

    const handleRemoveRoom = (id) => {
        setRoomList(prev => {
            const remaining = prev.filter(r => r.id !== id);
            const remainingBedrooms = remaining.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');
            return remaining.map(r => {
                if (r.attachedTo === id) {
                    return {
                        ...r,
                        attachedTo: remainingBedrooms.length > 0 ? remainingBedrooms[0].id : null,
                        isAttached: remainingBedrooms.length > 0
                    };
                }
                return r;
            });
        });
        setActivePreset('Custom');
    };

    const handleUpdateRoom = (id, field, value) => {
        setRoomList(prev => {
            const target = prev.find(r => r.id === id);
            if (!target) return prev;

            const nameMap = {
                master_bedroom: 'Master Bedroom',
                bedroom: 'Bedroom',
                attached_toilet: 'Att. Bathroom',
                common_bathroom: 'Common Bathroom',
                kitchen: 'Kitchen',
                living: 'Living Hall',
                dining: 'Dining Room',
                pooja: 'Pooja Room',
                study: 'Study Room',
                store: 'Store Room',
                utility: 'Utility Area',
                home_office: 'Home Office',
                parking: 'Parking Space',
                balcony: 'Balcony'
            };

            return prev.map(r => {
                if (r.id !== id) {
                    // If target bedroom changed away from bedroom, reassign any toilet attached to it
                    if (field === 'type' && (target.type === 'master_bedroom' || target.type === 'bedroom') && value !== 'master_bedroom' && value !== 'bedroom') {
                        if (r.attachedTo === id) {
                            const otherBeds = prev.filter(rm => rm.id !== id && (rm.type === 'master_bedroom' || rm.type === 'bedroom'));
                            return {
                                ...r,
                                attachedTo: otherBeds.length > 0 ? otherBeds[0].id : null,
                                isAttached: otherBeds.length > 0
                            };
                        }
                    }
                    return r;
                }

                const updated = { ...r, [field]: value };

                if (field === 'type') {
                    // Update default label if not custom named
                    if (!r.name || Object.values(nameMap).includes(r.name) || r.name.startsWith('Bedroom ')) {
                        updated.name = nameMap[value] || 'Room';
                    }
                    if (value === 'attached_toilet') {
                        updated.isAttached = true;
                        if (!updated.attachedTo) {
                            const bed = prev.find(rm => rm.id !== id && (rm.type === 'master_bedroom' || rm.type === 'bedroom'));
                            updated.attachedTo = bed ? bed.id : null;
                        }
                    } else {
                        updated.isAttached = false;
                        updated.attachedTo = null;
                    }
                }

                if (field === 'attachedTo') {
                    updated.isAttached = Boolean(value);
                }

                return updated;
            });
        });
        setActivePreset('Custom');
    };

    const getImg = (key, fallback) => (IMAGES && IMAGES[key]) || fallback;

    const styleOptions = [
        { name: 'Budget Friendly', img: getImg('budget', '/assets/budget.png') },
        { name: 'Standard Modern', img: getImg('standard', '/assets/standard.png') },
        { name: 'Premium Luxury', img: getImg('luxury', '/assets/luxury.png') },
        { name: 'Minimalist', img: getImg('minimalist', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80') },
        { name: 'Traditional Modern', img: getImg('traditional', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80') }
    ];

    const budgetOptions = [
        { label: 'Low Budget', sub: 'Up to 25 Lakhs', val: 'Low Cost' },
        { label: 'Mid Range', sub: '25 - 50 Lakhs', val: 'Mid Range' },
        { label: 'Premium', sub: '50 - 75 Lakhs', val: 'Premium' },
        { label: 'Luxury', sub: 'Above 75 Lakhs', val: 'Luxury' }
    ];

    const allPriorities = [
        'More Ventilation', 'More Natural Light', 'Bigger Hall', 
        'Bigger Kitchen', 'More Parking', 'Vastu Focus', 'More Storage'
    ];

    const togglePriority = (item) => {
        setPriorities(prev => 
            prev.includes(item) ? prev.filter(p => p !== item) : [...prev, item]
        );
    };

    const generateAutoPrompt = () => {
        const bLabel = budget === 'Low Cost' || budget === 'Low Budget' ? 'Up to 25 Lakhs' : budget === 'Mid Range' ? '25 - 50 Lakhs' : budget === 'Premium' ? '50 - 75 Lakhs' : 'Above 75 Lakhs';
        const unitStr = units === 'ft' ? 'ft' : units === 'm' ? 'm' : 'yds';
        const roomSummary = roomList.map(r => `${r.name} (${r.widthFt}x${r.lengthFt} ${unitStr})`).join(', ');
        const descStr = description ? ` Additional Notes: ${description}.` : '';
        return `Design a ${width}x${length} ${unitStr} (${width * length} sq.${unitStr}) ${facing.toLowerCase()}-facing ${floors}-floor residential house. Configured Rooms: ${roomSummary || 'Standard layout'}. Parking: ${parkingStr.toLowerCase()}. Staircase: ${staircasePref.toLowerCase()} (${staircaseType.toLowerCase()}). Style: ${style.toLowerCase()}. Budget: ${budget} (${bLabel}).${descStr}`;
    };

    useEffect(() => {
        setPrompt(generateAutoPrompt());
    }, [width, length, facing, floors, roomList, parkingStr, style, budget, projectType, units, description, staircasePref, staircaseType]);

    // Keep summary counts in sync with canonical roomList
    useEffect(() => {
        const beds = roomList.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom').length;
        const baths = roomList.filter(r => r.type === 'attached_toilet' || r.type === 'common_bathroom').length;
        setBedrooms(beds);
        setBathrooms(baths);
    }, [roomList]);

    // Restore Saved Draft from localStorage on mount
    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(`archflow_wizard_draft_${userKey}`);
            if (savedDraft) {
                const d = JSON.parse(savedDraft);
                if (d.currentStep) setCurrentStep(d.currentStep);
                if (d.completedSteps) setCompletedSteps(d.completedSteps);
                if (d.name !== undefined) setName(d.name);
                if (d.client !== undefined) setClient(d.client);
                if (d.projectType !== undefined) setProjectType(d.projectType);
                if (d.location !== undefined) setLocation(d.location);
                if (d.description !== undefined) setDescription(d.description);
                if (d.width !== undefined) setWidth(Number(d.width));
                if (d.length !== undefined) setLength(Number(d.length));
                if (d.facing !== undefined) setFacing(d.facing);
                if (d.corner !== undefined) setCorner(d.corner);
                if (d.road !== undefined) setRoad(d.road);
                if (d.roadWidth !== undefined) setRoadWidth(d.roadWidth);
                if (d.roadPosition !== undefined) setRoadPosition(d.roadPosition);
                if (d.units !== undefined) setUnits(d.units);
                if (d.floors !== undefined) setFloors(Number(d.floors));
                if (d.bedrooms !== undefined) setBedrooms(Number(d.bedrooms));
                if (d.bathrooms !== undefined) setBathrooms(Number(d.bathrooms));
                if (d.hall !== undefined) setHall(Number(d.hall));
                if (d.kitchen !== undefined) setKitchen(Number(d.kitchen));
                if (d.dining !== undefined) setDining(Number(d.dining));
                if (d.poojaCount !== undefined) setPoojaCount(Number(d.poojaCount));
                if (d.balconyCount !== undefined) setBalconyCount(Number(d.balconyCount));
                if (d.parkingStr !== undefined) setParkingStr(d.parkingStr);
                if (d.study !== undefined) setStudy(Number(d.study));
                if (d.storeRoom !== undefined) setStoreRoom(Number(d.storeRoom));
                if (d.utility !== undefined) setUtility(Number(d.utility));
                if (d.office !== undefined) setOffice(Number(d.office));
                if (d.staircasePref !== undefined) setStaircasePref(d.staircasePref);
                if (d.staircaseType !== undefined) setStaircaseType(d.staircaseType);
                if (d.livingType !== undefined) setLivingType(d.livingType);
                if (d.style !== undefined) setStyle(d.style);
                if (d.budget !== undefined) setBudget(d.budget);
                if (d.priorities !== undefined) setPriorities(d.priorities);
                if (d.prompt !== undefined) setPrompt(d.prompt);
                if (d.roomList && Array.isArray(d.roomList)) setRoomList(d.roomList);
                if (d.activePreset) setActivePreset(d.activePreset);
                showToast("Restored your saved project draft!", "info");
            }
        } catch (e) {
            console.error("Failed to restore draft", e);
        }
    }, [userKey]);

    const handleRegeneratePrompt = () => {
        setPrompt(generateAutoPrompt());
        showToast("AI Prompt regenerated based on current specifications.", "success");
    };

    const handleSaveDraft = () => {
        try {
            const draft = {
                currentStep, completedSteps, name, client, projectType, location, description,
                width, length, facing, corner, road, roadWidth, roadPosition, units,
                floors, bedrooms, bathrooms, hall, kitchen, dining, poojaCount, balconyCount, parkingStr,
                study, storeRoom, utility, office, staircasePref, staircaseType, livingType,
                style, budget, priorities, prompt, roomList, activePreset
            };
            localStorage.setItem(`archflow_wizard_draft_${userKey}`, JSON.stringify(draft));
            showToast("Project draft & wizard progress saved successfully!", "success");
        } catch (e) {
            showToast("Failed to save draft", "error");
        }
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1) {
            if (!name || !name.trim()) {
                setName(`${width}x${length} ${facing} Facing Residence`);
            }
        } else if (step === 2) {
            if (!width || Number(width) < 10) newErrors.width = 'Width must be at least 10.';
            if (!length || Number(length) < 10) newErrors.length = 'Length must be at least 10.';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
            return true;
        }
        return false;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 5) {
                setCurrentStep(currentStep + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            showToast("Please check mandatory fields to proceed.", "error");
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleStepClick = (targetStep) => {
        if (targetStep === currentStep) return;
        if (completedSteps.includes(targetStep) || targetStep <= currentStep || validateStep(currentStep)) {
            setCurrentStep(targetStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showToast("Please complete the current step first.", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isGenerating) return;

        if (!validateStep(1) || !validateStep(2)) {
            showToast("Please verify mandatory fields before generating.", "error");
            return;
        }

        setIsGenerating(true);
        try {
            const project = createProject({
                name,
                client,
                width: Number(width),
                length: Number(length),
                facing,
                corner,
                road,
                floors: Number(floors),
                bedrooms: Number(bedrooms),
                bathrooms: Number(bathrooms),
                pooja: poojaCount > 0,
                parking: parkingStr !== 'None',
                balcony: balconyCount > 0,
                style,
                budget,
                prompt,
                type: projectType,
                location,
                description,
                units,
                roadWidth,
                roadPosition,
                study: Number(study),
                storeRoom: Number(storeRoom),
                utility: Number(utility),
                office: Number(office),
                staircasePref,
                staircaseType,
                livingType,
                priorities,
                roomRequirements: roomList.map(r => ({
                    ...r,
                    widthFt: Number(r.widthFt) > 0 ? Number(r.widthFt) : (r.type === 'attached_toilet' ? 6 : 10),
                    lengthFt: Number(r.lengthFt) > 0 ? Number(r.lengthFt) : (r.type === 'attached_toilet' ? 7 : 10),
                    floor: Number(r.floor) || 1,
                    isExact: true
                }))
            });

            localStorage.removeItem(`archflow_wizard_draft_${userKey}`);
            if (project?.plan?.conflict) {
                showToast(project.plan.conflict.message || "Feasibility Conflict: Layout exceeds plot limits. Please review room sizes.", "warning");
            } else {
                showToast("Project layout created successfully!", "success");
            }
            navigate("/editor");
        } catch (err) {
            console.error("Failed to generate project floor plan:", err);
            showToast("Failed to generate plan. Please try again.", "error");
            setIsGenerating(false);
        }
    };

    const currentStyleImg = styleOptions.find(s => s.name === style)?.img || getImg('standard', '/assets/standard.png');
    const defaultPlanThumb = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230f172a'/><line x1='10' y1='10' x2='90' y2='10' stroke='white' stroke-width='1'/><line x1='10' y1='10' x2='10' y2='90' stroke='white' stroke-width='1'/><line x1='90' y1='10' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='10' y1='90' x2='90' y2='90' stroke='white' stroke-width='1'/><line x1='50' y1='10' x2='50' y2='90' stroke='white' stroke-dasharray='3' stroke-width='1'/><rect x='15' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='55' y='15' width='30' height='30' fill='none' stroke='white' stroke-width='1'/><rect x='15' y='55' width='70' height='30' fill='none' stroke='white' stroke-width='1'/></svg>";
    const planImg = getImg('plan_thumb', defaultPlanThumb);

    const currentBedrooms = roomList.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom').length;
    const currentBathrooms = roomList.filter(r => r.type === 'attached_toilet' || r.type === 'common_bathroom').length;

    const summaryItems = [
        { icon: <FileText size={16} />, label: 'Project Name', val: name || 'Untitled Project' },
        { icon: <User size={16} />, label: 'Client Name', val: client || 'Self' },
        { icon: <Building2 size={16} />, label: 'Project Type', val: projectType },
        { icon: <Maximize2 size={16} />, label: 'Plot Size', val: `${width} x ${length} ${units} (${width * length} sq.${units})` },
        { icon: <Compass size={16} />, label: 'Facing', val: facing },
        { icon: <Layers size={16} />, label: 'Floors', val: `${floors} ${floors === 1 ? 'Floor' : 'Floors'}` },
        { icon: <Bed size={16} />, label: 'Bedrooms', val: currentBedrooms },
        { icon: <Bath size={16} />, label: 'Bathrooms', val: currentBathrooms },
        { icon: <Car size={16} />, label: 'Parking', val: parkingStr },
        { icon: <Palette size={16} />, label: 'Style', val: style },
        { icon: <DollarSign size={16} />, label: 'Budget', val: budget === 'Mid Range' ? 'Mid Range (25 - 50 Lakhs)' : budget === 'Low Cost' || budget === 'Low Budget' ? 'Low Budget (Up to 25 Lakhs)' : budget === 'Premium' ? 'Premium (50 - 75 Lakhs)' : 'Luxury (Above 75 Lakhs)' }
    ];

    const wizardSteps = [
        { num: 1, label: 'Project Details' },
        { num: 2, label: 'Plot Details' },
        { num: 3, label: 'Room Requirements' },
        { num: 4, label: 'Style & Budget' },
        { num: 5, label: 'AI Generate' }
    ];

    // --- RENDER STEP 1: PROJECT DETAILS ---
    const renderStep1 = () => (
        <div className="np-card wizard-step-card slide-in-right">
            <div className="np-card-header">
                <div className="np-card-icon blue">
                    <FileText size={18} />
                </div>
                <h2 className="np-card-title">Step 1: Project Details & Metadata</h2>
            </div>
            <span className="np-sub-label" style={{ marginBottom: 16 }}>Enter basic administrative information for client deliverables and project tracking:</span>

            <div className="np-form-grid-2">
                <div className="np-field">
                    <label className="np-label">Project Name <span className="np-req">*</span></label>
                    <input 
                        type="text" 
                        className={`np-input ${errors.name ? 'error' : ''}`}
                        value={name} 
                        onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({...errors, name: null}); }}
                        placeholder="e.g. 30x40 East Facing House" 
                    />
                    {errors.name && <span className="np-error-text"><AlertCircle size={13} /> {errors.name}</span>}
                </div>
                <div className="np-field">
                    <label className="np-label">Client Name</label>
                    <input 
                        type="text" 
                        className="np-input" 
                        value={client} 
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="e.g. Ramesh C" 
                    />
                </div>
                <div className="np-field">
                    <label className="np-label">Project Type <span className="np-req">*</span></label>
                    <select 
                        className="np-select"
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                    >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Villa / Bungalow">Villa / Bungalow</option>
                        <option value="Apartment / Flat">Apartment / Flat</option>
                        <option value="Interior Renovation">Interior Renovation</option>
                    </select>
                </div>
                <div className="np-field">
                    <label className="np-label">Site / Location (Optional)</label>
                    <input 
                        type="text" 
                        className="np-input" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Coimbatore, Tamil Nadu" 
                    />
                </div>
            </div>

            <div className="np-field" style={{ marginTop: 14 }}>
                <label className="np-label">Project Description / Architectural Notes (Optional)</label>
                <textarea 
                    className="np-textarea-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific architectural vision, site topology notes, zoning constraints, or client preferences..."
                />
            </div>
        </div>
    );

    // --- RENDER STEP 2: PLOT DETAILS ---
    const renderStep2 = () => (
        <div className="np-card wizard-step-card slide-in-right">
            <div className="np-card-header">
                <div className="np-card-icon green">
                    <Maximize2 size={18} />
                </div>
                <h2 className="np-card-title">Step 2: Plot Dimensions & Orientation</h2>
            </div>
            <span className="np-sub-label" style={{ marginBottom: 16 }}>Configure site measurements, cardinal direction, and boundary conditions:</span>

            <div className="np-form-grid-3">
                <div className="np-field">
                    <label className="np-label">Plot Width <span className="np-req">*</span></label>
                    <div className="np-input-suffix-wrap">
                        <input 
                            type="number" 
                            className={`np-input ${errors.width ? 'error' : ''}`}
                            value={width} 
                            onChange={(e) => { setWidth(e.target.value); if (errors.width) setErrors({...errors, width: null}); }}
                            min="10"
                        />
                        <span className="np-suffix">{units}</span>
                    </div>
                    {errors.width && <span className="np-error-text"><AlertCircle size={13} /> {errors.width}</span>}
                </div>
                <div className="np-field">
                    <label className="np-label">Plot Length <span className="np-req">*</span></label>
                    <div className="np-input-suffix-wrap">
                        <input 
                            type="number" 
                            className={`np-input ${errors.length ? 'error' : ''}`}
                            value={length} 
                            onChange={(e) => { setLength(e.target.value); if (errors.length) setErrors({...errors, length: null}); }}
                            min="10"
                        />
                        <span className="np-suffix">{units}</span>
                    </div>
                    {errors.length && <span className="np-error-text"><AlertCircle size={13} /> {errors.length}</span>}
                </div>
                <div className="np-field">
                    <label className="np-label">Total Area (Auto Calculated)</label>
                    <div className="np-readonly-box">
                        <span>{width * length} sq.{units}</span>
                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Auto Calc</span>
                    </div>
                </div>
            </div>

            <div className="np-form-grid-3" style={{ marginTop: 14 }}>
                <div className="np-field">
                    <label className="np-label">Measurement Units <span className="np-req">*</span></label>
                    <select className="np-select" value={units} onChange={(e) => setUnits(e.target.value)}>
                        <option value="ft">Feet (ft)</option>
                        <option value="m">Meters (m)</option>
                        <option value="yds">Yards (yds)</option>
                    </select>
                </div>
                <div className="np-field">
                    <label className="np-label">Facing Direction <span className="np-req">*</span></label>
                    <select className="np-select" value={facing} onChange={(e) => setFacing(e.target.value)}>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="North-East">North-East</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                    </select>
                </div>
                <div className="np-field">
                    <label className="np-label">Corner Plot</label>
                    <div className="np-toggle-group">
                        <button 
                            type="button" 
                            className={`np-toggle-btn ${corner ? 'active' : ''}`}
                            onClick={() => setCorner(true)}
                        >Yes</button>
                        <button 
                            type="button" 
                            className={`np-toggle-btn ${!corner ? 'active' : ''}`}
                            onClick={() => setCorner(false)}
                        >No</button>
                    </div>
                </div>
            </div>

            <div className="np-form-grid-3" style={{ marginTop: 14 }}>
                <div className="np-field">
                    <label className="np-label">Road Side / Type</label>
                    <select className="np-select" value={road} onChange={(e) => setRoad(e.target.value)}>
                        <option value="20 ft Road">20 ft Road</option>
                        <option value="30 ft Road">30 ft Road</option>
                        <option value="40 ft Road">40 ft Road</option>
                        <option value="60 ft Highway">60 ft Highway</option>
                        <option value="No Direct Road">No Direct Road</option>
                    </select>
                </div>
                <div className="np-field">
                    <label className="np-label">Road Position</label>
                    <select className="np-select" value={roadPosition} onChange={(e) => setRoadPosition(e.target.value)}>
                        <option value="Front Only">Front Only</option>
                        <option value="Front & Rear (Through)">Front & Rear (Through)</option>
                        <option value="Two-Side (Corner)">Two-Side (Corner)</option>
                        <option value="Three-Side">Three-Side</option>
                    </select>
                </div>
                <div className="np-field">
                    <label className="np-label">Road Width (Custom/Exact)</label>
                    <input 
                        type="text" 
                        className="np-input" 
                        value={roadWidth} 
                        onChange={(e) => setRoadWidth(e.target.value)}
                        placeholder="e.g. 30 ft" 
                    />
                </div>
            </div>
        </div>
    );

    // --- RENDER STEP 3: USER-CONTROLLED ROOM REQUIREMENTS ---
    const renderStep3 = () => {
        const plotArea = width * length;
        // Total setbacks: 4 ft width (2ft left + 2ft right), 5 ft length (3ft front + 2ft rear)
        const usableWidth = Math.max(0, width - 4);
        const usableLength = Math.max(0, length - 5);
        const usableEnvelopePerFloor = usableWidth * usableLength;
        const totalUsableEnvelope = usableEnvelopePerFloor * floors;

        // Sum allocated area strictly from current active room list
        const allocatedArea = roomList.reduce((sum, r) => {
            const w = Number(r.widthFt) || 0;
            const l = Number(r.lengthFt) || 0;
            return sum + (w * l);
        }, 0);

        const utilizationPct = totalUsableEnvelope > 0 ? Math.round((allocatedArea / totalUsableEnvelope) * 100) : 0;

        let statusClass = 'pending';
        let statusText = 'Not yet validated';
        let statusSub = 'Area ratio only (Geometry verified on Generate)';

        if (allocatedArea > totalUsableEnvelope) {
            statusClass = 'danger';
            statusText = 'Infeasible';
            statusSub = `${allocatedArea} sq.${units} > ${totalUsableEnvelope} sq.${units} buildable limit`;
        }

        const bedroomRooms = roomList.filter(r => r.type === 'master_bedroom' || r.type === 'bedroom');

        return (
            <div className="np-card wizard-step-card slide-in-right">
                <div className="np-card-header">
                    <div className="np-card-icon indigo">
                        <Building2 size={18} />
                    </div>
                    <h2 className="np-card-title">Step 3: User-Controlled Room Requirements</h2>
                </div>
                <span className="np-sub-label" style={{ marginBottom: 12 }}>
                    Define every room individually. ArchFlow AI strictly preserves your specified room counts, dimensions, floor distribution, and bathroom attachments without silent truncation or arbitrary additions.
                </span>

                {/* Vertical Floors and Circulation */}
                <div className="np-form-grid-3" style={{ marginBottom: 16 }}>
                    <div className="np-field">
                        <label className="np-label">Number of Floors <span className="np-req">*</span></label>
                        <select className="np-select" value={floors} onChange={(e) => setFloors(Number(e.target.value))}>
                            <option value="1">1 Floor (Ground Only)</option>
                            <option value="2">2 Floors (G + 1)</option>
                            <option value="3">3 Floors (G + 2)</option>
                            <option value="4">4 Floors (G + 3)</option>
                        </select>
                    </div>
                    <div className="np-field">
                        <label className="np-label">Staircase Location</label>
                        <select className="np-select" value={staircasePref} onChange={(e) => setStaircasePref(e.target.value)}>
                            <option value="Inside">Inside (Internal Duplex)</option>
                            <option value="Outside">Outside (External Rental)</option>
                            <option value="Elevator + Stairs">Elevator + Stairs</option>
                        </select>
                    </div>
                    <div className="np-field">
                        <label className="np-label">Staircase Type</label>
                        <select className="np-select" value={staircaseType} onChange={(e) => setStaircaseType(e.target.value)}>
                            <option value="Straight">Straight Flight</option>
                            <option value="L-Shaped">L-Shaped</option>
                            <option value="U-Shaped / Dog-legged">U-Shaped / Dog-legged</option>
                            <option value="Spiral / Modern">Spiral / Modern</option>
                        </select>
                    </div>
                </div>

                {/* Preset Starter Options */}
                <div style={{ marginBottom: 16 }}>
                    <label className="np-label" style={{ marginBottom: 6 }}>Starting Architectural Presets (Editable):</label>
                    <div className="np-presets-row">
                        {['1BHK', '2BHK', '3BHK', '4BHK', 'Custom'].map(preset => (
                            <button
                                key={preset}
                                type="button"
                                className={`np-preset-btn ${activePreset === preset ? 'active' : ''}`}
                                onClick={() => handleApplyPreset(preset)}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Live Geometric Diagnostics Bar */}
                <div className="np-diagnostics-bar">
                    <div className="np-diag-item">
                        <span className="np-diag-label">Plot Dimensions</span>
                        <span className="np-diag-val">{width} × {length} {units}</span>
                        <span className="np-diag-sub">Plot Area: {plotArea} sq.{units}</span>
                    </div>
                    <div className="np-diag-item">
                        <span className="np-diag-label">Usable Buildable Area ({floors} Flr)</span>
                        <span className="np-diag-val">~{totalUsableEnvelope} sq.{units}</span>
                        <span className="np-diag-sub">Setbacks: 4 {units} W, 5 {units} L</span>
                    </div>
                    <div className="np-diag-item">
                        <span className="np-diag-label">Allocated Room Area</span>
                        <span className="np-diag-val">{allocatedArea} sq.{units}</span>
                        <span className="np-diag-sub">Area Ratio: {utilizationPct}% of envelope</span>
                    </div>
                    <div className="np-diag-item">
                        <span className="np-diag-label">Geometric Feasibility</span>
                        <span className={`np-diag-status ${statusClass}`}>{statusText}</span>
                        <span className="np-diag-sub">{statusSub}</span>
                    </div>
                </div>

                {/* Configured Rooms Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 16 }}>
                    <label className="np-label" style={{ margin: 0 }}>
                        Configured Rooms ({roomList.length} total)
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                        All dimensions in {units === 'ft' ? 'feet' : units === 'm' ? 'meters' : 'yards'}
                    </span>
                </div>

                {/* Responsive CSS Grid Room Editor */}
                <div className="np-room-grid-wrap">
                    <div className="np-room-grid-header">
                        <div>Room Type</div>
                        <div>Display Name</div>
                        <div>Width ({units})</div>
                        <div>Length ({units})</div>
                        <div>Bathroom Attachment</div>
                        <div>Floor</div>
                        <div style={{ textAlign: 'center' }}>
                            <span className="sr-only">Actions</span>
                        </div>
                    </div>

                    <div className="np-room-grid-body">
                        {roomList.length === 0 ? (
                            <div className="np-room-empty">
                                No rooms configured. Select a preset above or click &quot;Add Room&quot; below.
                            </div>
                        ) : (
                            roomList.map((room) => {
                                const isAttachedToilet = room.type === 'attached_toilet';
                                const isCommonBathroom = room.type === 'common_bathroom';

                                return (
                                    <div key={room.id} className="np-room-grid-row">
                                        {/* 1. Room Type */}
                                        <div>
                                            <select 
                                                className="np-room-select"
                                                value={room.type}
                                                onChange={(e) => handleUpdateRoom(room.id, 'type', e.target.value)}
                                            >
                                                <option value="master_bedroom">Master Bedroom</option>
                                                <option value="bedroom">Bedroom</option>
                                                <option value="attached_toilet">Attached Bathroom</option>
                                                <option value="common_bathroom">Common Bathroom</option>
                                                <option value="living">Living Hall</option>
                                                <option value="kitchen">Kitchen</option>
                                                <option value="dining">Dining Room</option>
                                                <option value="pooja">Pooja Room</option>
                                                <option value="study">Study Room</option>
                                                <option value="store">Store Room</option>
                                                <option value="utility">Utility Area</option>
                                                <option value="home_office">Home Office</option>
                                                <option value="parking">Parking Space</option>
                                                <option value="balcony">Balcony</option>
                                            </select>
                                        </div>

                                        {/* 2. Display Name */}
                                        <div>
                                            <input 
                                                type="text"
                                                className="np-room-input"
                                                value={room.name || ''}
                                                onChange={(e) => handleUpdateRoom(room.id, 'name', e.target.value)}
                                                placeholder="Room label"
                                            />
                                        </div>

                                        {/* 3. Width */}
                                        <div>
                                            <div className="np-dim-input-wrap">
                                                <input 
                                                    type="number"
                                                    className="np-room-input np-dim-input"
                                                    min="3"
                                                    max="100"
                                                    step="0.5"
                                                    value={room.widthFt ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleUpdateRoom(room.id, 'widthFt', val === '' ? '' : parseFloat(val));
                                                    }}
                                                    placeholder="W"
                                                />
                                                <span className="np-dim-unit">{units}</span>
                                            </div>
                                        </div>

                                        {/* 4. Length */}
                                        <div>
                                            <div className="np-dim-input-wrap">
                                                <input 
                                                    type="number"
                                                    className="np-room-input np-dim-input"
                                                    min="3"
                                                    max="100"
                                                    step="0.5"
                                                    value={room.lengthFt ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleUpdateRoom(room.id, 'lengthFt', val === '' ? '' : parseFloat(val));
                                                    }}
                                                    placeholder="L"
                                                />
                                                <span className="np-dim-unit">{units}</span>
                                            </div>
                                        </div>

                                        {/* 5. Bathroom Attachment / Relationship */}
                                        <div>
                                            {isAttachedToilet ? (
                                                <select 
                                                    className="np-room-select"
                                                    value={room.attachedTo || ''}
                                                    onChange={(e) => handleUpdateRoom(room.id, 'attachedTo', e.target.value || null)}
                                                >
                                                    <option value="">-- Choose Host Bedroom --</option>
                                                    {bedroomRooms.map(br => (
                                                        <option key={br.id} value={br.id}>{br.name || 'Bedroom'}</option>
                                                    ))}
                                                </select>
                                            ) : isCommonBathroom ? (
                                                <span className="np-attachment-badge np-attachment-common">Common Access</span>
                                            ) : (
                                                <span className="np-attachment-badge np-attachment-na">Not Applicable</span>
                                            )}
                                        </div>

                                        {/* 6. Floor */}
                                        <div>
                                            <select 
                                                className="np-room-select"
                                                value={room.floor || 1}
                                                onChange={(e) => handleUpdateRoom(room.id, 'floor', Number(e.target.value))}
                                            >
                                                {Array.from({ length: floors }, (_, i) => i + 1).map(fl => (
                                                    <option key={fl} value={fl}>Floor {fl}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 7. Remove action */}
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button 
                                                type="button" 
                                                className="np-room-del-btn" 
                                                aria-label={`Delete ${room.name || 'Room'}`}
                                                title={`Delete ${room.name || 'Room'}`}
                                                onClick={() => handleRemoveRoom(room.id)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Add Room Bar */}
                <div className="np-add-room-bar">
                    <div className="np-add-room-controls">
                        <label className="np-label" style={{ margin: 0, fontSize: '13px' }}>Add Room:</label>
                        <select 
                            className="np-room-select" 
                            style={{ width: '200px' }}
                            value={newRoomType}
                            onChange={(e) => setNewRoomType(e.target.value)}
                        >
                            <option value="bedroom">Bedroom</option>
                            <option value="master_bedroom">Master Bedroom</option>
                            <option value="attached_toilet">Attached Bathroom</option>
                            <option value="common_bathroom">Common Bathroom</option>
                            <option value="kitchen">Kitchen</option>
                            <option value="dining">Dining Room</option>
                            <option value="living">Living Hall</option>
                            <option value="pooja">Pooja Room</option>
                            <option value="study">Study Room</option>
                            <option value="store">Store Room</option>
                            <option value="utility">Utility Area</option>
                            <option value="home_office">Home Office</option>
                            <option value="parking">Parking Space</option>
                            <option value="balcony">Balcony</option>
                        </select>
                        <button 
                            type="button" 
                            className="np-btn-add-room"
                            onClick={() => handleAddRoom(newRoomType)}
                        >
                            <Plus size={15} /> Add to Plan
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- RENDER STEP 4: STYLE & BUDGET ---
    const renderStep4 = () => (
        <div className="np-card wizard-step-card slide-in-right">
            <div className="np-card-header">
                <div className="np-card-icon purple">
                    <Palette size={18} />
                </div>
                <h2 className="np-card-title">Step 4: Style, Budget & Design Priorities</h2>
            </div>
            
            <span className="np-sub-label">Exterior Architectural Style <span className="np-req">*</span></span>
            <div className="np-styles-grid" style={{ marginBottom: 22 }}>
                {styleOptions.map((item, idx) => {
                    const isSelected = style === item.name;
                    return (
                        <div 
                            key={idx} 
                            className={`np-style-card ${isSelected ? 'active' : ''}`}
                            onClick={() => setStyle(item.name)}
                        >
                            {isSelected && (
                                <div className="np-style-badge">
                                    <Check size={11} strokeWidth={3} />
                                </div>
                            )}
                            <img src={item.img} alt={item.name} className="np-style-img" />
                            <div className="np-style-title">{item.name}</div>
                        </div>
                    );
                })}
            </div>

            <span className="np-sub-label">Estimated Project Budget <span className="np-req">*</span></span>
            <div className="np-budget-grid" style={{ marginBottom: 22 }}>
                {budgetOptions.map((b, idx) => {
                    const isSelected = budget === b.val || (budget === 'Mid Range' && b.val === 'Mid Range') || (budget === 'Low Budget' && b.val === 'Low Cost');
                    return (
                        <div 
                            key={idx} 
                            className={`np-budget-card ${isSelected ? 'active' : ''}`}
                            onClick={() => setBudget(b.val)}
                        >
                            <div className="np-budget-title">{b.label}</div>
                            <div className="np-budget-sub">{b.sub}</div>
                        </div>
                    );
                })}
            </div>

            <span className="np-sub-label">Design Priorities (Select Multiple)</span>
            <div className="np-chips-wrap">
                {allPriorities.map((item, idx) => {
                    const isSelected = priorities.includes(item);
                    return (
                        <div 
                            key={idx} 
                            className={`np-chip ${isSelected ? 'active' : ''}`}
                            onClick={() => togglePriority(item)}
                        >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                            <span>{item}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // --- RENDER STEP 5: AI GENERATE & REVIEW ---
    const renderStep5 = () => (
        <div className="wizard-step-card slide-in-right">
            <div className="np-card" style={{ marginBottom: 20 }}>
                <div className="np-card-header">
                    <div className="np-card-icon blue">
                        <CheckCircle2 size={18} />
                    </div>
                    <h2 className="np-card-title">Step 5: Review Specifications & AI Generation</h2>
                </div>
                <span className="np-sub-label" style={{ marginBottom: 16 }}>Review your configured architectural parameters before running the AI layout engine:</span>

                <div className="wizard-review-grid">
                    <div className="wizard-review-box">
                        <div className="wizard-review-title">Project & Client</div>
                        <div className="wizard-review-val"><strong>Name:</strong> {name}</div>
                        <div className="wizard-review-val"><strong>Client:</strong> {client || 'Self'}</div>
                        <div className="wizard-review-val"><strong>Type:</strong> {projectType}</div>
                        <div className="wizard-review-val"><strong>Location:</strong> {location || 'Not specified'}</div>
                    </div>
                    <div className="wizard-review-box">
                        <div className="wizard-review-title">Plot & Orientation</div>
                        <div className="wizard-review-val"><strong>Dimensions:</strong> {width} x {length} {units}</div>
                        <div className="wizard-review-val"><strong>Total Area:</strong> {width * length} sq.{units}</div>
                        <div className="wizard-review-val"><strong>Facing:</strong> {facing} ({corner ? 'Corner Plot' : 'Regular'})</div>
                        <div className="wizard-review-val"><strong>Road:</strong> {road} ({roadPosition})</div>
                    </div>
                    <div className="wizard-review-box">
                        <div className="wizard-review-title">Building Setup</div>
                        <div className="wizard-review-val"><strong>Floors:</strong> {floors} {floors === 1 ? 'Floor' : 'Floors'}</div>
                        <div className="wizard-review-val"><strong>Rooms:</strong> {bedrooms} Bed, {bathrooms} Bath, {hall} Hall</div>
                        <div className="wizard-review-val"><strong>Utility/Extras:</strong> {poojaCount > 0 ? 'Pooja, ' : ''}{study > 0 ? `${study} Study, ` : ''}{storeRoom > 0 ? 'Store, ' : ''}{utility > 0 ? 'Utility, ' : ''}{office > 0 ? 'Office' : ''}</div>
                        <div className="wizard-review-val"><strong>Parking:</strong> {parkingStr}</div>
                    </div>
                    <div className="wizard-review-box">
                        <div className="wizard-review-title">Style & Budget</div>
                        <div className="wizard-review-val"><strong>Exterior Style:</strong> {style}</div>
                        <div className="wizard-review-val"><strong>Estimated Budget:</strong> {budget}</div>
                        <div className="wizard-review-val"><strong>Staircase:</strong> {staircasePref} ({staircaseType})</div>
                        <div className="wizard-review-val"><strong>Priorities:</strong> {priorities.join(', ') || 'Standard layout'}</div>
                    </div>
                </div>

                {/* Canonical Room Specifications Review Table */}
                <div style={{ marginTop: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="np-sub-label" style={{ fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            Canonical Room Specifications ({roomList.length} configured):
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                            Total Area: {roomList.reduce((sum, r) => sum + (Number(r.widthFt) || 0) * (Number(r.lengthFt) || 0), 0)} sq.{units}
                        </span>
                    </div>
                    <div className="np-review-table-wrap">
                        <table className="np-review-table">
                            <thead>
                                <tr>
                                    <th>Room Name</th>
                                    <th>Type</th>
                                    <th>Dimensions</th>
                                    <th>Floor</th>
                                    <th>Attachment</th>
                                    <th>Preservation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomList.map(r => (
                                    <tr key={r.id}>
                                        <td><strong>{r.name}</strong></td>
                                        <td style={{ textTransform: 'capitalize' }}>{r.type.replace(/_/g, ' ')}</td>
                                        <td>{r.widthFt} × {r.lengthFt} {units} ({r.widthFt * r.lengthFt} sq.{units})</td>
                                        <td>Floor {r.floor || 1}</td>
                                        <td>
                                            {r.type === 'attached_toilet' ? (
                                                <span style={{ color: '#2563EB', fontWeight: 500 }}>
                                                    Attached to {roomList.find(b => b.id === r.attachedTo)?.name || 'Bedroom'}
                                                </span>
                                            ) : r.type === 'common_bathroom' ? (
                                                <span style={{ color: '#059669', fontWeight: 500 }}>Common Access</span>
                                            ) : '—'}
                                        </td>
                                        <td><span style={{ color: '#059669', fontWeight: 600 }}>Strict Exact</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="np-card">
                <div className="np-card-header">
                    <div className="np-card-icon purple">
                        <Sparkles size={18} />
                    </div>
                    <h2 className="np-card-title">AI Prompt (Auto-Generated based on above details)</h2>
                </div>
                <div className="np-prompt-row">
                    <textarea 
                        className="np-prompt-textarea"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button 
                        type="button" 
                        className="np-regenerate-btn"
                        onClick={handleRegeneratePrompt}
                    >
                        <RefreshCw size={14} />
                        <span>Regenerate Prompt</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="np-wrapper fade-in">
            <div className="np-layout">
                {/* --- LEFT COLUMN (~75%) --- */}
                <div className="np-left-col">
                    <div className="np-breadcrumb">
                        <span className="np-bc-link" onClick={() => navigate('/my-projects')}>&lt;&lt; Projects</span>
                        <span className="np-bc-sep">&gt;</span>
                        <span className="np-bc-curr">New Project Wizard</span>
                    </div>
                    <h1 className="np-page-title">Create New Project</h1>
                    <p className="np-page-subtitle">Complete the 5-step enterprise wizard to configure your project details and generate AI architectural plans.</p>

                    {/* INTERACTIVE STEPPER HEADER */}
                    <div className="np-stepper wizard-stepper">
                        {wizardSteps.map((s, idx) => {
                            const isCurrent = currentStep === s.num;
                            const isCompleted = completedSteps.includes(s.num) && currentStep !== s.num;
                            const isUpcoming = !isCurrent && !isCompleted;
                            return (
                                <React.Fragment key={s.num}>
                                    <div 
                                        className={`np-step ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                                        onClick={() => handleStepClick(s.num)}
                                    >
                                        <div className="np-step-circle">
                                            {isCompleted ? <Check size={15} strokeWidth={3} /> : s.num}
                                        </div>
                                        <span className="np-step-label">{s.label}</span>
                                    </div>
                                    {idx < wizardSteps.length - 1 && (
                                        <div className={`np-step-line ${completedSteps.includes(s.num) ? 'completed-line' : ''}`}></div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* WIZARD STEP CONTAINER - ONLY ONE STEP VISIBLE AT A TIME */}
                        <div className="wizard-step-wrapper">
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            {currentStep === 4 && renderStep4()}
                            {currentStep === 5 && renderStep5()}
                        </div>

                        {/* WIZARD FOOTER NAVIGATION */}
                        <div className="wizard-footer">
                            <div className="wizard-footer-left">
                                {currentStep > 1 && (
                                    <button type="button" className="np-btn-prev" onClick={handlePrev}>
                                        <ArrowLeft size={16} />
                                        <span>Previous Step</span>
                                    </button>
                                )}
                            </div>

                            <div className="wizard-footer-right">
                                {currentStep < 5 ? (
                                    <button type="button" className="np-btn-next" onClick={handleNext}>
                                        <span>Next Step</span>
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <div className="wizard-step5-actions">
                                        <button type="button" className="np-btn-draft" onClick={handleSaveDraft}>
                                            Save Draft
                                        </button>
                                        <div className="np-generate-wrap">
                                            <button type="submit" className="np-btn-generate" disabled={isGenerating}>
                                                {isGenerating ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />}
                                                <span>{isGenerating ? 'Generating...' : 'Generate Plan'}</span>
                                            </button>
                                            <span className="np-credits-text">This will use 10 AI credits</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* --- RIGHT COLUMN (~25% - LIVE PROJECT SUMMARY - ALWAYS VISIBLE) --- */}
                <div className="np-right-col">
                    {/* 1. PROJECT SUMMARY CARD */}
                    <div className="np-card">
                        <div className="np-card-header" style={{ marginBottom: 12 }}>
                            <div className="np-card-icon blue" style={{ width: 28, height: 28 }}>
                                <FileText size={15} />
                            </div>
                            <h2 className="np-card-title" style={{ fontSize: 16 }}>Live Project Summary</h2>
                        </div>
                        <div className="np-summary-images">
                            <img src={currentStyleImg} alt="House Concept" className="np-summary-img-house" />
                            <img src={planImg} alt="Floor Plan Concept" className="np-summary-img-plan" />
                        </div>
                        <div className="np-summary-list">
                            {summaryItems.map((item, idx) => (
                                <div key={idx} className="np-summary-row">
                                    <span className="np-summary-label">
                                        <span className="np-summary-icon">{item.icon}</span>
                                        {item.label}
                                    </span>
                                    <span className="np-summary-val" title={item.val}>{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. AI TIPS CARD */}
                    <div className="np-card np-tips-card">
                        <div className="np-tips-header">
                            <Sparkles size={18} className="np-tips-icon" />
                            <span>AI Tips & Wizard Guide</span>
                        </div>
                        <div className="np-tips-list">
                            <div className="np-tip-item">
                                <Check size={16} className="np-tip-check" />
                                <span>Complete each step; progress is validated automatically</span>
                            </div>
                            <div className="np-tip-item">
                                <Check size={16} className="np-tip-check" />
                                <span>Use Save Draft on Step 5 to persist your specifications</span>
                            </div>
                            <div className="np-tip-item">
                                <Check size={16} className="np-tip-check" />
                                <span>You can click completed step numbers above to jump back</span>
                            </div>
                            <div className="np-tip-item">
                                <Check size={16} className="np-tip-check" />
                                <span>More room details = higher AI floor plan accuracy</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. SECURITY CARD */}
                    <div className="np-card np-security-card">
                        <div className="np-security-icon">
                            <Shield size={20} />
                        </div>
                        <div>
                            <div className="np-security-title">Enterprise grade data security.</div>
                            <div className="np-security-sub">256-bit encrypted specifications.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
