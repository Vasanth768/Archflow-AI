package com.archflow.server.service;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class ArchitecturalImagePromptBuilder {

    public String buildExteriorPrompt(Map<String, Object> requirements, int index, int attempt) {
        String context = (String) requirements.getOrDefault("context", "City");
        String buildingType = (String) requirements.getOrDefault("buildingType", "single_floor");
        String styleDirection = (String) requirements.getOrDefault("styleDirection", "Standard Modern");
        String roofStyleReq = (String) requirements.getOrDefault("roofStyle", "Auto");
        String budget = (String) requirements.getOrDefault("budget", "Standard");
        Integer width = requirements.containsKey("width") ? ((Number) requirements.get("width")).intValue() : 30;
        Integer length = requirements.containsKey("length") ? ((Number) requirements.get("length")).intValue() : 40;
        String facing = (String) requirements.getOrDefault("facing", "East");

        boolean isVillage = "Village".equalsIgnoreCase(context);

        // Map building structure
        String structuralSubject;
        String floorConstraints;
        if ("single_floor".equalsIgnoreCase(buildingType) || "1".equals(String.valueOf(buildingType))) {
            structuralSubject = "single-storey ground-floor residential Indian bungalow";
            floorConstraints = "EXACTLY ONE-STOREY RESIDENTIAL HOUSE. GROUND FLOOR ONLY. NO UPPER FLOOR. NO FIRST FLOOR. NO DUPLEX. "
                    + "The roof sits directly above the ground-floor ceiling slab. Low horizontal profile, continuous roofline, single entrance portal.";
        } else if ("double_floor_duplex".equalsIgnoreCase(buildingType) || "2".equals(String.valueOf(buildingType))) {
            structuralSubject = "contemporary two-storey duplex residential home";
            floorConstraints = "Two distinct habitable architectural levels, ground floor and first floor, balanced vertical and horizontal proportions, elegant upper balcony.";
        } else if ("villa".equalsIgnoreCase(buildingType)) {
            structuralSubject = "luxury architectural residential villa";
            floorConstraints = "Spacious luxury independent villa, expansive facade with multiple architectural volumes, double-height entrance canopy, covered car porch.";
        } else if ("apartment".equalsIgnoreCase(buildingType)) {
            structuralSubject = "multi-family residential apartment building";
            floorConstraints = "Stately residential building with articulated floor plates, repeating balconies, contemporary architectural facade.";
        } else if ("farmhouse".equalsIgnoreCase(buildingType)) {
            structuralSubject = "rural Indian retreat farmhouse residence";
            floorConstraints = "Expansive open-layout low-density residential architecture, broad verandah sit-outs, integrated landscape frontage.";
        } else {
            structuralSubject = "residential home";
            floorConstraints = "Balanced residential architecture with realistic construction proportions.";
        }

        // Roof style mapping
        String roofDescription;
        if ("Sloped".equalsIgnoreCase(roofStyleReq) || "Tile".equalsIgnoreCase(roofStyleReq)) {
            roofDescription = "terracotta clay tiled pitched roof with deep overhanging eaves";
        } else if ("Flat".equalsIgnoreCase(roofStyleReq)) {
            roofDescription = "clean flat reinforced concrete roof with minimalist parapet";
        } else {
            roofDescription = isVillage ? "traditional sloped terracotta roof with clay tiles" : "modern flat roof with subtle geometric canopy overhangs";
        }

        // Camera perspective rotation based on variation index
        String[] cameraAngles = {
            "Straight front architectural elevation, eye-level perspective",
            "Front-left three-quarter architectural perspective",
            "Front-right three-quarter perspective with landscape context",
            "Wide-angle street view elevation showing plot frontage",
            "Subtle cinematic low-angle front elevation",
            "Frontal three-quarter view with natural sunlight framing"
        };
        String cameraAngle = cameraAngles[index % cameraAngles.length];

        // Variation specific styles
        String styleDetails;
        if (styleDirection.contains("Traditional")) {
            styleDetails = "Traditional South Indian vernacular elements, exposed red brick accents, carved wooden door pillar details, earthy warm color palette.";
        } else if (styleDirection.contains("Luxury") || styleDirection.contains("Premium")) {
            styleDetails = "Premium luxury contemporary architecture, travertine stone cladding, warm wood louvers, floor-to-ceiling recessed glass windows, warm integrated LED facade lighting.";
        } else if (styleDirection.contains("Minimalist")) {
            styleDetails = "Minimalist tropical architecture, smooth off-white textured plaster, clean geometric massing, dark aluminium window frames, lush manicured planters.";
        } else if (styleDirection.contains("Budget")) {
            styleDetails = "Practical modern economical residential construction, clean plaster finish, durable powder-coated steel gate, compact covered sitout.";
        } else {
            styleDetails = "Contemporary Indian residential architecture, balanced off-white and warm grey color scheme, stone accent wall, modern motorized gate.";
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append(floorConstraints).append(" ");
        prompt.append("Professional photorealistic 8k architectural photograph of a ").append(structuralSubject).append(". ");
        prompt.append("Plot size: ").append(width).append("x").append(length).append(" ft, ").append(facing).append(" facing. ");
        prompt.append("Context: ").append(context).append(" setting in Tamil Nadu, India. ");
        prompt.append("Architectural Style: ").append(styleDirection).append(". ").append(styleDetails).append(" ");
        prompt.append("Roof: ").append(roofDescription).append(". ");
        prompt.append("Entrance: Covered entrance sit-out with granite steps. ");
        prompt.append("Compound: Boundary compound wall with integrated exterior lighting and modern gate. ");
        prompt.append("Environment: Natural bright daylight, crisp shadows, realistic Indian residential landscaping with palm and potted flora. ");
        prompt.append("Camera: ").append(cameraAngle).append(". ");
        prompt.append("Must strictly be an exterior building elevation photograph. Highly detailed architectural render, Octane render quality, realistic materials.");

        if (attempt > 1) {
            prompt.append(" Distinct architectural variation from previous render with updated facade massing.");
        }

        return prompt.toString();
    }

    public String buildNegativePrompt(String buildingType) {
        StringBuilder neg = new StringBuilder();
        neg.append("blurry, low quality, distorted, watermark, signature, interior view, room interior, bedroom, kitchen, living room, swimming pool, cartoon, 3d CGI animation, fantasy house, american colonial house, european cottage, skyscraper");

        if ("single_floor".equalsIgnoreCase(buildingType) || "1".equals(String.valueOf(buildingType))) {
            neg.append(", two-storey, multi-storey, G+1, second floor, upper floor, upper windows, upper balcony, roof stairs, staircase to roof, duplex, tall building");
        }

        return neg.toString();
    }
}
