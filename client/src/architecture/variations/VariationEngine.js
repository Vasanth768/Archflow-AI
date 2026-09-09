/**
 * VariationEngine.js - Style & Facade Variations Preserving Canonical Geometry
 */

export class VariationEngine {
    static getStyles() {
        return [
            { id: 'modern', name: 'Modern Minimalist', exteriorWall: '#e2e8f0', flooring: 'Italian Marble' },
            { id: 'contemporary', name: 'Contemporary', exteriorWall: '#cbd5e1', flooring: 'Wooden Flooring' },
            { id: 'traditional', name: 'Traditional Heritage', exteriorWall: '#fef3c7', flooring: 'Terracotta Tiles' },
            { id: 'luxury', name: 'Premium Luxury', exteriorWall: '#f8fafc', flooring: 'Imported Marble' }
        ];
    }

    static applyVariation(canonicalPlan, styleId) {
        if (!canonicalPlan) return null;
        const modified = JSON.parse(JSON.stringify(canonicalPlan));
        const style = this.getStyles().find(s => s.id === styleId) || this.getStyles()[0];

        modified.materials = {
            ...modified.materials,
            facadeStyle: style.name,
            flooringStyle: style.flooring
        };

        return modified;
    }
}
