import { TEMPLATES } from './TemplateLibrary';

export const selectTemplate = (width, length) => {
    const area = width * length;
    if (area <= 1200) return TEMPLATES.COMPACT_2BHK;
    if (area <= 2000) return TEMPLATES.PREMIUM_2BHK;
    return TEMPLATES.MODERN_3BHK;
};
