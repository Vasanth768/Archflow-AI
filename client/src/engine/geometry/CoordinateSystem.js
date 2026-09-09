/**
 * CoordinateSystem handles transformations between Screen Pixels and Architectural Feet
 */

export class CoordinateSystem {
    constructor(canvasWidth, canvasHeight, plotWidth, plotLength, scaleMultiplier, panX, panY) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.plotWidth = plotWidth;
        this.plotLength = plotLength;
        this.scaleMultiplier = scaleMultiplier;
        
        // Base scale to fit plot into canvas with professional margin
        const PADDING = 80; // pixels of padding
        const availableWidth = this.canvasWidth - (PADDING * 2);
        const availableHeight = this.canvasHeight - (PADDING * 2);
        
        const sX = availableWidth / this.plotWidth;
        const sY = availableHeight / this.plotLength;
        // Lock aspect ratio, use the most constrained dimension
        this.baseScale = Math.min(sX, sY);
        
        this.scale = this.baseScale * this.scaleMultiplier;
        
        // Calculate center offset + pan (centers the exact 45x70 plan inside the canvas)
        this.offsetX = ((this.canvasWidth - (this.plotWidth * this.scale)) / 2) + panX;
        this.offsetY = ((this.canvasHeight - (this.plotLength * this.scale)) / 2) + panY;
    }

    // Feet to Canvas Pixels
    toCanvas(ftX, ftY) {
        return {
            x: this.offsetX + (ftX * this.scale),
            y: this.offsetY + (ftY * this.scale)
        };
    }

    toCanvasLen(ftLen) {
        return ftLen * this.scale;
    }

    // Canvas Pixels to Feet
    toFeet(canvasX, canvasY) {
        return {
            x: (canvasX - this.offsetX) / this.scale,
            y: (canvasY - this.offsetY) / this.scale
        };
    }
}
