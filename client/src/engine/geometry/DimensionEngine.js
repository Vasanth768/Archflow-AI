/**
 * DimensionEngine handles the math for positioning dimension lines.
 */

export const generateOuterDimensions = (plot, offset = 40) => {
    return [
        {
            type: 'top',
            startX: 0, endX: plot.width,
            y: -offset,
            text: `${plot.width}'-0"`
        },
        {
            type: 'left',
            startY: 0, endY: plot.length,
            x: -offset,
            text: `${plot.length}'-0"`,
            rotated: true
        }
    ];
};
