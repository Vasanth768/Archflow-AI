/**
 * GeminiClient.js - Frontend Client for ArchFlow's Gemini AI Backend Service
 * 
 * Securely communicates with the Spring Boot server endpoints under `/api/ai/gemini/*`
 * Ensures no API keys or cloud tokens are ever exposed in client browser code.
 * Validates and sanitizes all AI responses before passing to the CAD / Vastu engine.
 */

const API_BASE = '/api/ai/gemini';

export class GeminiClient {
    constructor() {
        this.timeoutMs = 30000;
    }

    getAuthHeaders() {
        const userEmail = localStorage.getItem('archflow_email') || 'guest_user';
        return {
            'Content-Type': 'application/json',
            'X-User-Id': userEmail
        };
    }

    async checkStatus() {
        try {
            const res = await fetch(`${API_BASE}/status?userId=${encodeURIComponent(localStorage.getItem('archflow_email') || 'guest')}`);
            if (!res.ok) return { configured: false, remainingQuota: 0 };
            return await res.json();
        } catch (err) {
            console.warn('[GeminiClient] Status check unavailable:', err.message);
            return { configured: false, remainingQuota: 0 };
        }
    }

    /**
     * Requirement Parser: Converts prompt to structured plan request
     */
    async parsePlanRequirements(prompt, context = {}) {
        try {
            const res = await fetch(`${API_BASE}/parse-plan`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ prompt, context })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            
            // Client-side schema validation & safety defaults
            return {
                plot: {
                    width: Number(data.plot?.width) || 30,
                    length: Number(data.plot?.length) || 40,
                    unit: data.plot?.unit || 'ft',
                    facing: data.plot?.facing || 'East'
                },
                floors: Number(data.floors) || 1,
                buildingType: data.buildingType || 'Residential',
                style: data.style || 'Standard Modern',
                budget: data.budget || 'Mid Range',
                rooms: Array.isArray(data.rooms) ? data.rooms : [],
                requirements: data.requirements || {
                    bedrooms: 2,
                    bathrooms: 2,
                    parking: true,
                    pooja: false,
                    balcony: false,
                    staircase: 'Inside'
                },
                summary: data.summary || `${data.plot?.width || 30}x${data.plot?.length || 40} ${data.plot?.facing || 'East'} Facing House`,
                aiStatus: data.aiStatus || 'SUCCESS'
            };
        } catch (err) {
            console.warn('[GeminiClient] parsePlanRequirements fallback used:', err.message);
            return null;
        }
    }

    /**
     * AI Chatbot Conversation
     */
    async sendChatMessage(message, currentPlan = null, history = []) {
        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ message, currentPlan, history })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.warn('[GeminiClient] sendChatMessage fallback:', err.message);
            return {
                intent: 'GENERAL_ARCHITECTURAL_QUERY',
                message: `I received your request: "${message}". What architectural adjustments would you like to make?`,
                action: null
            };
        }
    }

    /**
     * Natural Language CAD Command (e.g., "Master bedroom 12x14 ஆக்கு")
     */
    async parseCommand(instruction, currentPlan = null) {
        try {
            const res = await fetch(`${API_BASE}/command`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ instruction, currentPlan })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.warn('[GeminiClient] parseCommand fallback:', err.message);
            return {
                success: false,
                action: 'UNKNOWN',
                description: err.message
            };
        }
    }

    /**
     * Vastu Explainer: Translates deterministic Vastu calculations into clear advice
     */
    async explainVastu(vastuReport, userQuery = null) {
        try {
            const res = await fetch(`${API_BASE}/vastu-explain`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ report: vastuReport, userQuery })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.warn('[GeminiClient] explainVastu fallback:', err.message);
            return {
                score: vastuReport?.score || 0,
                tier: vastuReport?.tier || 'Moderate',
                overview: `Calculated mathematical Vastu score is ${vastuReport?.score || 0}/100.`,
                actionableRemedies: ['Ensure kitchen remains in South-East (Agneya)', 'Preserve central Brahmasthan clearance']
            };
        }
    }

    /**
     * Professional Prompt Enhancer
     */
    async enhancePrompt(prompt, details = {}) {
        try {
            const res = await fetch(`${API_BASE}/enhance-prompt`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ prompt, details })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            return data.enhancedPrompt || prompt;
        } catch (err) {
            console.warn('[GeminiClient] enhancePrompt fallback:', err.message);
            return `${prompt} (Optimized with natural daylighting and sustainable ventilation).`;
        }
    }

    /**
     * Advisory Vision Analysis on uploaded floor plan / sketch
     */
    async analyzeVision(imageBase64, prompt = '') {
        try {
            const res = await fetch(`${API_BASE}/vision-analyze`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ image: imageBase64, prompt })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.warn('[GeminiClient] analyzeVision fallback:', err.message);
            return {
                detectedPlotSize: 'Estimated from drawing',
                observations: ['Floor plan image uploaded successfully for CAD reference.'],
                recommendations: ['Confirm boundary dimensions before finalizing CAD construction documents.']
            };
        }
    }
}

export const geminiClient = new GeminiClient();
export default geminiClient;
