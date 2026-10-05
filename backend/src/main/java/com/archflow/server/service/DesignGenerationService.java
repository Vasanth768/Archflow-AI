package com.archflow.server.service;

import com.archflow.server.provider.ImageGenerationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class DesignGenerationService {

    @Autowired
    private ImageGenerationProvider imageGenerationProvider;

    @Autowired
    private ArchitecturalImageValidator imageValidator;

    @org.springframework.beans.factory.annotation.Value("${IMAGE_GENERATION_CACHE_ENABLED:true}")
    private boolean cacheEnabled;

    private final java.util.concurrent.Semaphore generationSemaphore = new java.util.concurrent.Semaphore(1);
    private final java.util.concurrent.ConcurrentHashMap<String, String> generationCache = new java.util.concurrent.ConcurrentHashMap<>();

    private static final String[] CITY_PALETTES = {
        "White + Charcoal + Wood", "Off White + Grey + Black", "Beige + Brown + Stone", "Cream + Terracotta + Grey"
    };

    private static final String[] VILLAGE_PALETTES = {
        "Cream + Terracotta", "White + Earth Brown", "Warm Beige + Dark Brown", "Light Yellow + White + Terracotta"
    };

    private static final String[] TAMIL_NADU_VARIATIONS = {
        "Minimal Contemporary Tamil Nadu",
        "Contemporary South Indian",
        "Traditional + Modern Tamil Nadu",
        "Budget-Friendly Modern",
        "Premium Contemporary",
        "Modern Tropical South Indian"
    };

    public List<Map<String, Object>> generateVariations(Map<String, Object> projectRequirements, int count) {
        String context = (String) projectRequirements.getOrDefault("context", "City");
        String buildingType = (String) projectRequirements.getOrDefault("buildingType", "Single Floor");
        String requestedStyle = (String) projectRequirements.getOrDefault("styleDirection", "AI Explore");
        String budget = (String) projectRequirements.getOrDefault("budget", "Standard");
        String roofStyleReq = (String) projectRequirements.getOrDefault("roofStyle", "Auto");
        String projectId = (String) projectRequirements.get("projectId");

        if (!imageGenerationProvider.isConfigured()) {
            throw new IllegalStateException("Image generation provider is not configured properly or local service is not running.");
        }
        System.out.println("[GENERATION] requested=" + count);

        List<CompletableFuture<Map<String, Object>>> futures = IntStream.range(0, count)
                .mapToObj(i -> CompletableFuture.supplyAsync(() -> {
                    return generateSingleVariationWithRetry(i, context, buildingType, requestedStyle, budget, roofStyleReq, projectId, 1, new ArrayList<>());
                }))
                .collect(Collectors.toList());

        List<Map<String, Object>> results = futures.stream().map(CompletableFuture::join).collect(Collectors.toList());
        
        // Final sanity check for duplicates in the batch
        List<String> seenUrls = new ArrayList<>();
        for (Map<String, Object> res : results) {
            if ("Completed".equals(res.get("status"))) {
                String url = (String) res.get("imageUrl");
                if (seenUrls.contains(url)) {
                    res.put("status", "Failed");
                    res.put("error", "Duplicate image generated.");
                } else {
                    seenUrls.add(url);
                }
            }
        }
        
        return results;
    }

    private String generateWithRateLimitRetry(String prompt, Map<String, Object> genOptions, int index, int attemptId) throws Exception {
        int rateLimitRetries = 0;
        int maxRateLimitRetries = 2;
        
        System.out.println("[CANDIDATE] design=" + (index + 1) + " attempt=" + attemptId + " started");
        while (true) {
            try {
                // Provider call
                String url = imageGenerationProvider.generateDesign(prompt, genOptions).get();
                return url;
            } catch (Exception e) {
                String errorMsg = e.getMessage();
                if (e.getCause() != null && e.getCause().getMessage() != null) {
                    errorMsg = e.getCause().getMessage();
                }
                
                if (errorMsg != null && (errorMsg.contains("402") || errorMsg.contains("PAYMENT_REQUIRED"))) {
                    System.out.println("[PROVIDER] design=" + (index + 1) + " status=402 exhausted credits");
                    throw new RuntimeException("PROVIDER_CREDITS_EXHAUSTED");
                } else if (errorMsg != null && (errorMsg.contains("429") || errorMsg.contains("rate limit") || errorMsg.contains("Too Many Requests") || errorMsg.toLowerCase().contains("unavailable"))) {
                    System.out.println("[PROVIDER] design=" + (index + 1) + " status=429");
                    rateLimitRetries++;
                    if (rateLimitRetries > maxRateLimitRetries) {
                        System.out.println("[PROVIDER_429] design=" + (index + 1) + " exhausted");
                        throw new RuntimeException("PROVIDER_RATE_LIMIT_EXHAUSTED");
                    }
                    long delay = (long) (5000 * Math.pow(2, rateLimitRetries - 1));
                    System.out.println("[PROVIDER_429] design=" + (index + 1) + " retry=" + rateLimitRetries + " delayMs=" + delay);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    System.out.println("[PROVIDER] design=" + (index + 1) + " attempt=" + attemptId + " status=failed error=\"" + errorMsg + "\"");
                    throw new RuntimeException("PROVIDER_ERROR: " + errorMsg);
                }
            }
        }
    }

    private Map<String, Object> generateSingleVariationWithRetry(int index, String context, String buildingType, String requestedStyle, String budget, String roofStyleReq, String projectId, int maxRetries, List<String> previouslyFailedPrompts) {
        int attempt = 0;
        while (attempt < maxRetries) {
            try {
                boolean isVillage = "Village".equalsIgnoreCase(context);
                String variationStyle = requestedStyle.equals("AI Explore") || requestedStyle.equals("Custom")
                    ? TAMIL_NADU_VARIATIONS[(index + attempt) % TAMIL_NADU_VARIATIONS.length]
                    : requestedStyle;
                
                String colorPalette = "";
                String facade = "";
                String entrance = "";
                String compoundWall = "";
                String gate = "";
                String landscaping = "";

                // Dynamic style mapping based on the chosen variation
                if (variationStyle.equals("Minimal Contemporary Tamil Nadu")) {
                    colorPalette = "White and cream base with grey accents";
                    facade = "Clean rectangular massing, flat RCC roof, minimal facade";
                    entrance = "Clean minimal entrance, simple sit-out";
                    compoundWall = "Simple modern compound wall";
                    gate = "Standard minimalist gate";
                    landscaping = "Clean minimalist landscaping";
                } else if (variationStyle.equals("Contemporary South Indian")) {
                    colorPalette = "Warm wood and stone accents, light base";
                    facade = "Modern horizontal elements, wood and stone accent walls";
                    entrance = "Modern entrance canopy";
                    compoundWall = "Contemporary compound wall with planters";
                    gate = "Modern metal and wood gate";
                    landscaping = "Tropical planters";
                } else if (variationStyle.equals("Traditional + Modern Tamil Nadu")) {
                    colorPalette = "Earthy cream, white, and terracotta";
                    facade = "Subtle traditional Tamil architectural elements, modern windows";
                    entrance = "Traditional Indian entrance character, covered sit-out";
                    compoundWall = "Traditional style compound wall";
                    gate = "Traditional design gate";
                    landscaping = "South Indian vegetation";
                } else if (variationStyle.equals("Budget-Friendly Modern")) {
                    colorPalette = "Clean white, grey, economical palette";
                    facade = "Simple economical construction, clean rectangular facade, practical materials";
                    entrance = "Small practical porch";
                    compoundWall = "Basic block wall";
                    gate = "Economical metal gate";
                    landscaping = "Simple compact front yard";
                } else if (variationStyle.equals("Premium Contemporary")) {
                    colorPalette = "Premium neutral tones, sophisticated greys and stone";
                    facade = "Refined materials, stronger architectural detailing, premium composition";
                    entrance = "Elegant dramatic entrance portal";
                    compoundWall = "Premium stone cladded compound wall";
                    gate = "Premium contemporary gate";
                    landscaping = "Lush realistic architectural landscaping";
                } else if (variationStyle.equals("Modern Tropical South Indian")) {
                    colorPalette = "Warm neutral colours, tropical woods";
                    facade = "Climate-responsive shading, broad horizontal facade, natural ventilation";
                    entrance = "Shaded tropical sit-out";
                    compoundWall = "Greenery integrated compound wall";
                    gate = "Modern slatted gate";
                    landscaping = "Tropical landscaping, controlled palm and plant elements";
                } else {
                    // Fallback
                    colorPalette = "White and Grey";
                    facade = "Modern clean lines";
                    entrance = "Modern glass entrance";
                    compoundWall = "Modern minimalist wall";
                    gate = "Modern horizontal gate";
                    landscaping = "Compact urban garden";
                }
                
                System.out.println("[DESIGN] index=" + (index + 1) + " started");
                System.out.println("[3D VARIATION] buildingType = " + buildingType);
                System.out.println("Generation attempt: " + (attempt + 1));

                ArchitecturalConstraint constraint = new ArchitecturalConstraint(buildingType);
                System.out.println("[ARCH_CONSTRAINT] buildingType=" + buildingType + 
                    (constraint.getFloors() != null ? " floors=" + constraint.getFloors() : ""));

                String structuralConstraint = "";
                String structuralNegativePrompt = "";
                String baseSubject = "residential property";

                if ("single_floor".equals(buildingType)) {
                    structuralConstraint = "EXACTLY ONE-STOREY RESIDENTIAL HOUSE. GROUND FLOOR ONLY. SINGLE-STOREY ARCHITECTURE. " +
                        "NO UPPER FLOOR. NO FIRST FLOOR. NO SECOND FLOOR. NO DUPLEX. NO G+1. NO TWO-STOREY BUILDING. " +
                        "NO STAIRS LEADING TO AN UPPER RESIDENTIAL FLOOR. NO BALCONY THAT IMPLIES AN UPPER FLOOR. NO ROOMS ABOVE THE GROUND FLOOR. " +
                        "The roof must sit directly above the ground-floor walls. " +
                        "Architectural front elevation photograph of a genuine single-storey bungalow house. " +
                        "The building contains EXACTLY ONE HABITABLE LEVEL: the ground level. " +
                        "The entire house is a LOW HORIZONTAL SINGLE-LEVEL BUILDING. " +
                        "ONE continuous ground-floor facade only. " +
                        "ONE continuous roof structure directly above the ground-floor walls. " +
                        "The roof is the highest architectural element. " +
                        "The facade must terminate at the roof immediately after the ground-floor windows. " +
                        "All doors and windows are located on the SAME ground-floor level. " +
                        "The front elevation must visually read as one horizontal floor from left to right. " +
                        "The building must be wider than it is tall. " +
                        "There is NO architectural mass above the ground-floor roofline. " +
                        "The roofline must run continuously across the top of the house. " +
                        "The final image must look unmistakably like a one-storey Indian residential bungalow. " +
                        "wide horizontal composition, low-rise bungalow proportions, " +
                        "single continuous facade, broad ground-floor frontage, " +
                        "low building height, wide footprint, " +
                        "one roofline, one row of windows, " +
                        "one entrance level, " +
                        "symmetrical or mildly asymmetrical ground-floor elevation.";
                        
                    structuralNegativePrompt = "two-storey house, two story house, two-story house, G+1, G + 1, " +
                        "second floor, upper floor, upper level, first floor, " +
                        "double storey, double-storey, duplex, " +
                        "upper windows, second-floor windows, " +
                        "balcony, upper balcony, roof balcony, " +
                        "terrace, roof terrace, " +
                        "stairs, external staircase, " +
                        "mid-level slab, intermediate slab, " +
                        "upper projecting slab, cantilevered upper floor, " +
                        "stacked floors, stacked volumes, " +
                        "multi-level building, multi-storey building, " +
                        "vertical residential massing, " +
                        "two horizontal facade bands, " +
                        "three-level facade, " +
                        "apartment building";
                        
                    baseSubject = "genuine single-storey bungalow house";
                    
                    String originalFacade = facade;
                    String originalVariation = variationStyle;
                    
                    // Scrub multi-floor implying words from dynamic styles
                    String scrubRegex = "(?i)(second floor|first floor|upper floor|upper level|G\\\\+1|G \\\\+ 1|two storey|two-storey|double storey|duplex|balcony|upper balcony|terrace|roof terrace|staircase|vertical massing|stacked volume|projecting upper slab|cantilevered upper floor|multi-level|multi-storey|storey windows)";
                    facade = facade.replaceAll(scrubRegex, "clean ground-floor details");
                    facade = facade.replaceAll("(?i)\\\\bterrace\\\\b", "flat roof");
                    variationStyle = variationStyle.replaceAll(scrubRegex, "single storey");
                    
                    if (!facade.equals(originalFacade) || !variationStyle.equals(originalVariation)) {
                        System.out.println("[PROMPT_VALIDATION] conflictingTokensRemoved=true");
                    }
                } else if ("double_floor_duplex".equals(buildingType)) {
                    structuralConstraint = "Generate a double-storey house / duplex architecture. Clearly two residential levels. Ground floor + first floor. Appropriate staircase/access. Upper-floor rooms and windows visible.";
                    structuralNegativePrompt = "single storey, one floor, flat ground structure, three storey, G+2, multi-storey highrise, apartment block";
                    baseSubject = "double-storey duplex residential house, 30x40 plot";
                } else if ("villa".equals(buildingType)) {
                    structuralConstraint = "Generate a premium villa architecture. Must visibly read as a villa. Larger independent residential property. Villa-scale massing. Multiple architectural volumes. Do not simply generate a small generic house.";
                    structuralNegativePrompt = "small house, tiny home, compact house, budget house, single floor, apartment building, highrise, commercial building";
                    baseSubject = "spacious premium residential villa, large plot";
                } else if ("apartment".equals(buildingType)) {
                    structuralConstraint = "Generate a residential apartment building. Must visibly read as an apartment building. Multiple residential units and apartment-building massing. Multiple floors with repeated balconies. Do not generate a standalone single-family house.";
                    structuralNegativePrompt = "single family house, individual house, small plot, standalone house, villa, duplex, single storey, tiny house";
                    baseSubject = "multi-unit residential apartment building";
                } else if ("farmhouse".equals(buildingType)) {
                    structuralConstraint = "Generate a rural farmhouse architecture. Must visibly read as a farmhouse/rural residence. Rural and open-site context. Larger plot with open surroundings. Appropriate farmhouse architectural character. Do not generate a dense urban house.";
                    structuralNegativePrompt = "dense urban context, tight plot, zero setback, city house, apartment, multi-storey block, commercial";
                    baseSubject = "spacious rural farmhouse residence, large open landscape";
                } else {
                    structuralConstraint = "Generate a residential building.";
                    structuralNegativePrompt = "";
                    baseSubject = "residential property";
                }

                String roofStyle = roofStyleReq;
                if (roofStyle.equals("Auto")) {
                    if (variationStyle.contains("Traditional") || variationStyle.contains("Tile")) {
                        roofStyle = "Terracotta roof tiles";
                    } else if (variationStyle.contains("Modern") || variationStyle.contains("Contemporary")) {
                        roofStyle = "Flat or mixed roof";
                    } else {
                        roofStyle = isVillage ? "Sloped tiled roof" : "Flat modern roof";
                    }
                }

                String strictRules = "Photorealistic architectural visualization of a real Tamil Nadu " + baseSubject + ", east-facing, front elevation, realistic Indian construction proportions, practical residential architecture, natural daylight, realistic materials, realistic shadows, clean landscaping, high-quality architectural 3D render. " +
                    "MUST be an EXTERIOR FRONT or FRONT-3Q ARCHITECTURAL ELEVATION. " +
                    "NO interior view, NO bedrooms, NO kitchens, NO swimming pools, NO huge lawns. " +
                    "NOT an American suburban house, NOT a European style, NOT a Dubai villa, NOT a resort.";

                // Diversity: Camera Angles based strictly on index
                String[] cameraAngles = {
                    "Straight front elevation, dead center",               // Design 1
                    "Front-left three-quarter view, slight angle",         // Design 2
                    "Front-right three-quarter view, slight angle",        // Design 3
                    "Slightly wider front elevation, showing full context",// Design 4
                    "Slightly closer premium architectural elevation",     // Design 5
                    "Wide tropical front three-quarter view"               // Design 6
                };
                String cameraAngle = cameraAngles[index % cameraAngles.length];

                String prompt = structuralConstraint + " " + String.format("%s. Context: %s. Architectural Style: %s. Colors: %s. Facade: %s. Roof: %s. Entrance: %s. Compound Wall: %s. Gate: %s. Landscaping: %s. Camera: %s.",
                    strictRules, context, variationStyle, colorPalette, facade, roofStyle, entrance, compoundWall, gate, landscaping, cameraAngle);
                
                // Add entropy if it's a retry
                if (attempt > 0) {
                    prompt += " Make this heavily distinct from previous attempts. Change the massing geometry completely.";
                    if ("single_floor".equals(buildingType)) {
                        prompt += " EXTREMELY IMPORTANT: PREVIOUS ATTEMPT WAS REJECTED FOR HAVING MULTIPLE FLOORS. THIS MUST BE ABSOLUTELY SINGLE STOREY.";
                    }
                }

                // Check Cache first
                String imageUrl = null;
                System.out.println("[CACHE] enabled=" + cacheEnabled);
                
                String cacheKey = String.format("%s_%s_%s_%s_%s_%s_%d_%d", projectId, buildingType, variationStyle, roofStyle, budget, prompt.hashCode(), attempt, index);
                
                if (!cacheEnabled) {
                    System.out.println("[CACHE] BYPASSED");
                } else if (generationCache.containsKey(cacheKey)) {
                    imageUrl = generationCache.get(cacheKey);
                    System.out.println("[CACHE] HIT");
                } else {
                    System.out.println("[CACHE] MISS");
                }
                
                ValidationResult finalValidationResult = null;
                if (imageUrl == null) {
                    try {
                        generationSemaphore.acquire();
                        
                        if ("single_floor".equals(buildingType)) {
                            List<Map<String, Object>> candidates = new ArrayList<>();
                            Map<String, Object> bestCandidate = null;
                            
                            for (int candAttempt = 1; candAttempt <= 4; candAttempt++) {
                                Map<String, Object> genOptions = new HashMap<>();
                                int seed = Math.abs((prompt + index + attempt + candAttempt + System.currentTimeMillis()).hashCode());
                                genOptions.put("seed", seed);

                                if (!structuralNegativePrompt.isEmpty()) {
                                    genOptions.put("negative_prompt", structuralNegativePrompt);
                                }
                                genOptions.put("architecturalConstraint", constraint);

                                String candUrl = null;
                                ValidationResult valResult = null;
                                
                                try {
                                    System.out.println("[IMAGE_PROMPT]");
                                    System.out.println("design_id=" + (index + 1));
                                    System.out.println("floor_count=" + buildingType);
                                    System.out.println("prompt=" + prompt);
                                    
                                    candUrl = generateWithRateLimitRetry(prompt, genOptions, index, candAttempt);
                                    if (candUrl == null || candUrl.isEmpty()) {
                                        System.out.println("[CANDIDATE] design=" + (index + 1) + " attempt=" + candAttempt + " returned empty image");
                                        continue;
                                    }
                                    valResult = imageValidator.validate(candUrl, constraint).get();
                                } catch (Exception candEx) {
                                    String candErrorMsg = candEx.getMessage();
                                    if (candEx.getCause() != null && candEx.getCause().getMessage() != null) {
                                        candErrorMsg = candEx.getCause().getMessage();
                                    }
                                    
                                    if (candErrorMsg != null && candErrorMsg.contains("PROVIDER_RATE_LIMIT_EXHAUSTED")) {
                                        // Immediately fail the entire design slot. Do NOT classify as INVALID.
                                        throw new RuntimeException("PROVIDER_RATE_LIMIT_EXHAUSTED");
                                    }
                                    if (candErrorMsg != null && candErrorMsg.contains("PROVIDER_CREDITS_EXHAUSTED")) {
                                        throw new RuntimeException("PROVIDER_CREDITS_EXHAUSTED");
                                    }
                                    
                                    System.err.println("[CANDIDATE] design=" + (index + 1) + " attempt=" + candAttempt + " failed definitively: " + candErrorMsg);
                                    // Other errors can just skip this candidate or fail the slot
                                    throw new RuntimeException("Candidate " + candAttempt + " failed definitively: " + candErrorMsg);
                                }

                                System.out.println("[CANDIDATE] design=" + (index + 1) + " attempt=" + candAttempt + " completed. Validation status=" + valResult.getStatus() + " seed=" + seed);
                                
                                Map<String, Object> cand = new HashMap<>();
                                cand.put("imageUrl", candUrl);
                                cand.put("valResult", valResult);
                                cand.put("attempt", candAttempt);
                                cand.put("seed", seed);
                                candidates.add(cand);
                                
                                try {
                                    String b64 = candUrl.replaceFirst("^data:image/[^;]+;base64,", "");
                                    java.nio.file.Files.write(
                                        java.nio.file.Paths.get("/app/data/candidate_" + candAttempt + ".jpg"), 
                                        java.util.Base64.getDecoder().decode(b64)
                                    );
                                    System.out.println("[CANDIDATE_STRATEGY] Saved candidate " + candAttempt + " to /app/data/candidate_" + candAttempt + ".jpg");
                                } catch (Exception e) {}
                                
                                if (valResult.getStatus() == ValidationResult.Status.VALID) {
                                    bestCandidate = cand;
                                    System.out.println("[CANDIDATE_STRATEGY] Selected VALID candidate from attempt " + candAttempt);
                                    break;
                                }
                            }
                            
                            if (bestCandidate == null && !candidates.isEmpty()) {
                                for (Map<String, Object> cand : candidates) {
                                    ValidationResult vr = (ValidationResult) cand.get("valResult");
                                    if (vr.getStatus() == ValidationResult.Status.UNVERIFIED) {
                                        bestCandidate = cand;
                                        System.out.println("[CANDIDATE_STRATEGY] Selected UNVERIFIED candidate from attempt " + cand.get("attempt"));
                                        break;
                                    }
                                }
                            }
                            
                            // If all candidates are INVALID, DO NOT silently select an INVALID image.
                            // The user said: "if all 4 are INVALID, DO NOT return an INVALID image as if it were valid"
                            if (bestCandidate == null && !candidates.isEmpty()) {
                                bestCandidate = candidates.get(candidates.size() - 1);
                                System.out.println("[CANDIDATE_STRATEGY] ALL CANDIDATES INVALID. Selecting last candidate to explicitly fail.");
                            }
                            
                            if (bestCandidate == null) {
                                throw new RuntimeException("All candidate generation attempts failed to return an image");
                            }
                            
                            imageUrl = (String) bestCandidate.get("imageUrl");
                            finalValidationResult = (ValidationResult) bestCandidate.get("valResult");
                            
                            if (finalValidationResult.getStatus() == ValidationResult.Status.INVALID) {
                                throw new RuntimeException("Architectural validation failed: " + finalValidationResult.getReason());
                            }
                        } else {
                            Map<String, Object> genOptions = new HashMap<>();
                            genOptions.put("seed", Math.abs((prompt + index + attempt).hashCode()));

                            if (!structuralNegativePrompt.isEmpty()) {
                                genOptions.put("negative_prompt", structuralNegativePrompt);
                            }

                            genOptions.put("architecturalConstraint", constraint);

                            System.out.println("[IMAGE_PROMPT]");
                            System.out.println("design_id=" + (index + 1));
                            System.out.println("floor_count=" + buildingType);
                            System.out.println("prompt=" + prompt);

                            imageUrl = generateWithRateLimitRetry(prompt, genOptions, index, 1);
                            
                            if (imageUrl == null || imageUrl.isEmpty()) {
                                throw new RuntimeException("Empty image URL returned");
                            }

                            finalValidationResult = imageValidator.validate(imageUrl, constraint).get();
                            System.out.println("[IMAGE_VALIDATION] status=" + finalValidationResult.getStatus());
                            System.out.println("[IMAGE_VALIDATION] reason=" + finalValidationResult.getReason());
                            
                            if (finalValidationResult.getStatus() == ValidationResult.Status.INVALID) {
                                throw new RuntimeException("Architectural validation failed: " + finalValidationResult.getReason());
                            }
                        }
                        
                        if (cacheEnabled) {
                            generationCache.put(cacheKey, imageUrl);
                        }
                    } finally {
                        generationSemaphore.release();
                    }
                }
                
                Map<String, Object> design = new HashMap<>();
                design.put("id", "design_" + UUID.randomUUID().toString());
                design.put("projectId", projectId);
                design.put("designNumber", index + 1);
                design.put("title", variationStyle + " " + buildingType);
                design.put("context", context);
                design.put("buildingType", buildingType);
                design.put("architecturalStyle", variationStyle);
                design.put("budget", budget);
                design.put("roofStyle", roofStyle);
                String[] colors = colorPalette.split("\\+");
                design.put("primaryColor", colors[0].trim());
                design.put("accentColor", colors.length > 1 ? colors[1].trim() : colors[0].trim());
                design.put("facadeMaterials", List.of("Concrete", "Paint", isVillage ? "Terracotta" : "Glass"));
                design.put("facadeDetails", facade);
                design.put("entranceDesign", entrance);
                design.put("windowStyle", isVillage ? "Traditional Framed Windows" : "Large Glass Windows");
                design.put("balconyDesign", "single_floor".equals(buildingType) ? "Strictly no balcony" : "Realistic modern balcony");
                design.put("compoundWall", compoundWall);
                design.put("gateDesign", gate);
                design.put("landscaping", landscaping);
                design.put("lighting", "Realistic daylight");
                design.put("imageUrl", imageUrl);
                design.put("generationPrompt", prompt);
                design.put("geometryValidationStatus", finalValidationResult != null ? finalValidationResult.getStatus().name() : "UNVERIFIED");
                design.put("status", "Completed");
                design.put("isFavorite", false);
                design.put("isSelected", false);
                design.put("createdAt", Instant.now().toString());
                System.out.println("[DESIGN] index=" + (index + 1) + " completed");
                return design;
            } catch (Exception e) {
                attempt++;
                String errorMsg = e.getMessage();
                if (e.getCause() != null && e.getCause().getMessage() != null) {
                    errorMsg = e.getCause().getMessage();
                }
                
                if (attempt >= maxRetries) {
                    Map<String, Object> err = new HashMap<>();
                    err.put("id", "design_err_" + UUID.randomUUID().toString());
                    err.put("designNumber", index + 1);
                    err.put("status", "Failed");
                    err.put("provider", "qwen");
                    
                    if (errorMsg != null && errorMsg.contains("PROVIDER_RATE_LIMIT_EXHAUSTED")) {
                        System.out.println("[DESIGN] index=" + (index + 1) + " provider_failed");
                        err.put("code", "PROVIDER_RATE_LIMITED");
                        err.put("message", "Design " + (index + 1) + ": AI provider rate limited");
                        err.put("error", "Design " + (index + 1) + ": AI provider rate limited");
                        err.put("geometryValidationStatus", "UNVERIFIED"); // NEVER classify as INVALID
                    } else if (errorMsg != null && errorMsg.contains("PROVIDER_CREDITS_EXHAUSTED")) {
                        System.out.println("[DESIGN] index=" + (index + 1) + " provider_credits_exhausted");
                        err.put("code", "PROVIDER_CREDITS_EXHAUSTED");
                        err.put("message", "Design " + (index + 1) + ": AI provider credits exhausted");
                        err.put("error", "Design " + (index + 1) + ": AI provider credits exhausted");
                        err.put("geometryValidationStatus", "UNVERIFIED");
                    } else if (errorMsg != null && errorMsg.contains("Architectural validation failed")) {
                        System.err.println("[SERVICE] Generation attempt " + attempt + " failed for design " + index + ": " + errorMsg);
                        err.put("code", "VALIDATION_ERROR");
                        err.put("message", "Geometry validation failed for all attempts.");
                        err.put("error", errorMsg);
                        err.put("geometryValidationStatus", "INVALID");
                    } else if (errorMsg != null && (errorMsg.contains("401") || errorMsg.contains("Unauthorized") || errorMsg.contains("InvalidApiKey"))) {
                        System.err.println("[SERVICE] Generation attempt " + attempt + " failed for design " + index + ": " + errorMsg);
                        err.put("code", "PROVIDER_AUTH_ERROR");
                        err.put("message", "Image provider authentication failed");
                        err.put("error", "Image provider authentication failed");
                    } else if (errorMsg != null && (errorMsg.contains("400") || errorMsg.contains("Bad Request"))) {
                        System.err.println("[SERVICE] Generation attempt " + attempt + " failed for design " + index + ": " + errorMsg);
                        err.put("code", "PROVIDER_BAD_REQUEST");
                        err.put("message", "Image generation request was rejected by provider");
                        err.put("error", "Image generation request was rejected by provider");
                    } else {
                        System.err.println("[SERVICE] Generation attempt " + attempt + " failed for design " + index + ": " + errorMsg);
                        err.put("code", "PROVIDER_INTERNAL_ERROR");
                        err.put("message", "Image generation failed internally");
                        err.put("error", errorMsg);
                    }
                    
                    System.out.println("[DESIGN] index=" + (index + 1) + " completed (failed)");
                    return err;
                }
            }
        }
        return null;
    }

    public Map<String, Object> regenerateDesign(Map<String, Object> existingDesign, String refinementPrompt) {
        String basePrompt = (String) existingDesign.get("generationPrompt");
        if (basePrompt == null) {
            basePrompt = "Professional photorealistic architectural exterior elevation of a house in India.";
        }
        String prompt = basePrompt;
        
        if (refinementPrompt != null && !refinementPrompt.trim().isEmpty()) {
            prompt += " Refinements to apply: " + refinementPrompt + ". Ensure these changes are clearly visible and completely alter the visual from the previous version.";
        } else {
            prompt += " Generate a completely different and unique visual architectural variation of the exact same concept. Change the camera angle slightly.";
        }

        try {
            String imageUrl = null;
            if (generationCache.containsKey(prompt)) {
                imageUrl = generationCache.get(prompt);
            } else {
                try {
                    generationSemaphore.acquire();
                    imageUrl = imageGenerationProvider.generateDesign(prompt, new HashMap<>()).get();
                    if (imageUrl != null) {
                        generationCache.put(prompt, imageUrl);
                    }
                } finally {
                    generationSemaphore.release();
                }
            }
            
            Map<String, Object> updated = new HashMap<>(existingDesign);
            updated.put("imageUrl", imageUrl);
            updated.put("generationPrompt", prompt);
            
            // Adjust metadata if prompt specifically mentions it
            if (refinementPrompt != null) {
                String p = refinementPrompt.toLowerCase();
                if (p.contains("cream")) updated.put("primaryColor", "Cream");
                if (p.contains("brown")) updated.put("accentColor", "Brown");
                if (p.contains("white")) updated.put("primaryColor", "White");
                if (p.contains("tile")) updated.put("roofStyle", "Traditional Tile Roof");
                if (p.contains("flat roof")) updated.put("roofStyle", "Flat Roof");
                if (p.contains("stone cladding")) updated.put("facadeDetails", "Stone Cladding");
                updated.put("status", "Completed");
                updated.put("error", null);
            }

            return updated;
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>(existingDesign);
            err.put("status", "Failed");
            err.put("error", e.getMessage() != null ? e.getMessage() : "Unknown regeneration error");
            return err;
        }
    }
}
