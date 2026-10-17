/**
 * FeasibilityAdvisorClient.js - Client Service for Experimental Layout Feasibility Advisor (Stage 8E-A)
 * 
 * Strict Architectural Contract & Safety Mandates:
 * 1. Opt-In by Default: Feature flag 'archflow_enable_spatial_advisor' defaults to OFF (false).
 *    When disabled, zero network calls are initiated and the method returns null immediately.
 * 2. Strict AbortController & 350 ms Timeout: Aborts any pending in-flight request on new input
 *    and enforces a hard 350 ms timeout to protect client responsiveness.
 * 3. Stale-Response Protection: Discards out-of-order or late responses using monotonic request IDs.
 * 4. Fail-Open Architecture: On network error, timeout, or 4xx/5xx HTTP status, returns null without throwing.
 *    The deterministic DynamicLayoutSolver and PlanGenerator remain 100% authoritative and uninterrupted.
 * 5. Input Immutability: User's requested BHK, plot dimensions, and requirements are never mutated.
 * 6. Non-Authoritative: Advisory outputs are experimental planning guidance, never legal building codes
 *    or CAD geometry. Raw uncalibrated probabilities are never displayed as guaranteed percentages.
 */

export class FeasibilityAdvisorClient {
    constructor(options = {}) {
        this.timeoutMs = options.timeoutMs || 350;
        this.endpointUrl = options.endpointUrl || (
            typeof window !== 'undefined' && window.location?.origin
                ? '/ai/advise-layout-feasibility'
                : 'http://localhost:8000/advise-layout-feasibility'
        );
        this.activeController = null;
        this.lastRequestId = 0;
    }

    /**
     * Checks if the experimental advisor feature flag is explicitly enabled.
     * Defaults to false (OFF) unless 'archflow_enable_spatial_advisor' === 'true' in localStorage.
     */
    isEnabled() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return false;
        }
        try {
            return window.localStorage.getItem('archflow_enable_spatial_advisor') === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * Cancels any pending in-flight advisor request.
     */
    cancelPendingRequest() {
        if (this.activeController) {
            try {
                this.activeController.abort();
            } catch (e) {
                // Ignore abort errors
            }
            this.activeController = null;
        }
    }

    /**
     * Evaluates spatial layout feasibility if feature flag is enabled.
     * Returns null if feature is disabled, times out, is aborted, or fails.
     * 
     * @param {Object} input - { plot: { widthFt, lengthFt, facing, ... }, requirements: { bedrooms, ... } }
     * @returns {Promise<Object|null>} Structured advice or null.
     */
    async checkFeasibility(input) {
        // Rule 1: Feature flag default OFF check
        if (!this.isEnabled()) {
            return null;
        }

        if (!input || typeof input !== 'object') {
            return null;
        }

        // Rule 2 & 3: Cancel in-flight request & track monotonic request ID
        this.cancelPendingRequest();
        const requestId = ++this.lastRequestId;

        const controller = new AbortController();
        this.activeController = controller;

        let timerId = null;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timerId = setTimeout(() => {
                    controller.abort();
                    reject(new Error('ADVISOR_TIMEOUT'));
                }, this.timeoutMs);
            });

            const fetchPromise = fetch(this.endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(input),
                signal: controller.signal
            }).then(async (response) => {
                if (!response.ok) {
                    // Try to parse structured error
                    try {
                        const errJson = await response.json();
                        return { __isError: true, status: response.status, data: errJson };
                    } catch (e) {
                        return { __isError: true, status: response.status, data: null };
                    }
                }
                return await response.json();
            });

            const result = await Promise.race([fetchPromise, timeoutPromise]);

            // Stale response check
            if (requestId !== this.lastRequestId) {
                return null;
            }

            if (result && result.__isError) {
                // Structured HTTP 400 from advisor (INPUT_ERROR) or 500
                return null;
            }

            return result;
        } catch (err) {
            // Fails open on timeout, network abort, or connection refused
            return null;
        } finally {
            if (timerId) clearTimeout(timerId);
            if (this.activeController === controller) {
                this.activeController = null;
            }
        }
    }
}

/**
 * Reusable debounce utility for rapid input changes (e.g. typing or slider dragging).
 */
export function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export const feasibilityAdvisorClient = new FeasibilityAdvisorClient();
export default feasibilityAdvisorClient;
