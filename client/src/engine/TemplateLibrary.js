export const TEMPLATES = {
    COMPACT_2BHK: {
        id: "COMPACT_2BHK",
        name: "Compact 2BHK",
        minArea: 600, // 20x30
        maxArea: 1200, // up to 30x40
        rooms: [
            { type: "living", priority: 1, minW: 10, minH: 10 },
            { type: "kitchen", priority: 2, minW: 8, minH: 8 },
            { type: "bedroom", priority: 3, minW: 10, minH: 10, count: 2 },
            { type: "toilet", priority: 4, minW: 4, minH: 5 },
            { type: "dining", priority: 5, minW: 8, minH: 8 },
            { type: "parking", priority: 6, minW: 10, minH: 14 }
        ]
    },
    PREMIUM_2BHK: {
        id: "PREMIUM_2BHK",
        name: "Premium 2BHK",
        minArea: 1200, // 30x40
        maxArea: 2000,
        rooms: [
            { type: "living", priority: 1, minW: 12, minH: 14 },
            { type: "kitchen", priority: 2, minW: 10, minH: 10 },
            { type: "bedroom", priority: 3, minW: 11, minH: 12, count: 2 },
            { type: "toilet", priority: 4, minW: 5, minH: 7, count: 2 },
            { type: "dining", priority: 5, minW: 10, minH: 10 },
            { type: "pooja", priority: 6, minW: 4, minH: 5 },
            { type: "parking", priority: 7, minW: 11, minH: 16 },
            { type: "sitout", priority: 8, minW: 8, minH: 5 }
        ]
    },
    MODERN_3BHK: {
        id: "MODERN_3BHK",
        name: "Modern 3BHK",
        minArea: 2000, // 40x50+
        maxArea: 4000,
        rooms: [
            { type: "living", priority: 1, minW: 14, minH: 16 },
            { type: "kitchen", priority: 2, minW: 10, minH: 12 },
            { type: "bedroom", priority: 3, minW: 12, minH: 14, count: 3 },
            { type: "toilet", priority: 4, minW: 5, minH: 7, count: 3 },
            { type: "dining", priority: 5, minW: 10, minH: 12 },
            { type: "staircase", priority: 6, minW: 6, minH: 10 },
            { type: "pooja", priority: 7, minW: 5, minH: 6 },
            { type: "parking", priority: 8, minW: 12, minH: 18 },
            { type: "sitout", priority: 9, minW: 10, minH: 6 }
        ]
    }
};
