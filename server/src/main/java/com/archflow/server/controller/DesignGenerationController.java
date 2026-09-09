package com.archflow.server.controller;

import com.archflow.server.provider.ImageGenerationProvider;
import com.archflow.server.service.DesignGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/designs")
public class DesignGenerationController {

    @Autowired
    private DesignGenerationService designGenerationService;

    @Autowired
    private ImageGenerationProvider imageGenerationProvider;

    @GetMapping("/generate/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "service", "design-generation",
            "status", "ready"
        ));
    }

    @PostMapping("/generate/test")
    public ResponseEntity<?> testSingleGeneration(@RequestBody Map<String, Object> requestBody) {
        try {
            System.out.println("[TEST_GENERATION] Request received");
            String prompt = (String) requestBody.getOrDefault("prompt", "Professional photorealistic architectural exterior elevation.");
            Map<String, Object> options = new HashMap<>();
            options.put("seed", Math.abs(prompt.hashCode()));
            
            if (!imageGenerationProvider.isConfigured()) {
                return ResponseEntity.status(503).body(Map.of("success", false, "error", "API Key not configured."));
            }
            
            String imageUrl = imageGenerationProvider.generateDesign(prompt, options).get();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "imageUrl", imageUrl,
                "message", "Provider test succeeded."
            ));
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorMsg = e.getCause().getMessage();
            }
            return ResponseEntity.status(500).body(Map.of("success", false, "error", errorMsg));
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateDesigns(@RequestBody Map<String, Object> requestBody) {
        try {
            System.out.println("[DESIGN_GENERATION] Request received");
            
            if (requestBody == null || !requestBody.containsKey("requirements")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid request body",
                    "code", "INVALID_REQUEST"
                ));
            }

            Map<String, Object> projectRequirements = (Map<String, Object>) requestBody.get("requirements");
            
            System.out.println("[DESIGN_GENERATION] Project ID: " + projectRequirements.get("projectId"));
            System.out.println("[DESIGN_GENERATION] Context: " + projectRequirements.get("context"));
            System.out.println("[DESIGN_GENERATION] Building Type: " + projectRequirements.get("buildingType"));
            
            int count = requestBody.containsKey("count") ? (Integer) requestBody.get("count") : 6;
            System.out.println("[GENERATION] requested=" + count);

            List<Map<String, Object>> variations = designGenerationService.generateVariations(projectRequirements, count);
            
            System.out.println("[GENERATION] completed=" + variations.size());
            return ResponseEntity.ok(variations);
        } catch (Exception e) {
            System.err.println("[DESIGN_GENERATION] Generation failed: " + e.getMessage());
            
            if (e.getMessage() != null && e.getMessage().contains("QWEN_IMAGE_API_KEY is not set")) {
                return ResponseEntity.status(503).body(Map.of(
                    "success", false,
                    "error", "AI generation provider is not configured",
                    "code", "AI_PROVIDER_NOT_CONFIGURED",
                    "details", e.getMessage()
                ));
            }
            if (e.getMessage() != null && (e.getMessage().contains("HTTP Error 401") || e.getMessage().contains("InvalidApiKey"))) {
                return ResponseEntity.status(503).body(Map.of(
                    "success", false,
                    "error", "AI generation provider authentication failed. Invalid API Key.",
                    "code", "PROVIDER_AUTH_ERROR",
                    "details", e.getMessage()
                ));
            }
            if (e.getMessage() != null && e.getMessage().contains("HTTP Error 400")) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Image generation request was rejected by provider",
                    "code", "PROVIDER_BAD_REQUEST",
                    "details", e.getMessage()
                ));
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error during generation",
                "code", "INTERNAL_ERROR",
                "details", e.getMessage()
            ));
        }
    }

    @PostMapping("/regenerate")
    public ResponseEntity<?> regenerateDesign(@RequestBody Map<String, Object> requestBody) {
        try {
            System.out.println("[DESIGN_GENERATION] Regeneration request received");
            if (requestBody == null || !requestBody.containsKey("design")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid request body",
                    "code", "INVALID_REQUEST"
                ));
            }
            
            Map<String, Object> existingDesign = (Map<String, Object>) requestBody.get("design");
            String refinementPrompt = (String) requestBody.get("prompt");

            Map<String, Object> updatedDesign = designGenerationService.regenerateDesign(existingDesign, refinementPrompt);
            return ResponseEntity.ok(updatedDesign);
        } catch (Exception e) {
            System.err.println("[DESIGN_GENERATION] Regeneration failed: " + e.getMessage());
            
            if (e.getMessage() != null && e.getMessage().contains("QWEN_IMAGE_API_KEY is not set")) {
                return ResponseEntity.status(503).body(Map.of(
                    "success", false,
                    "error", "AI generation provider is not configured",
                    "code", "AI_PROVIDER_NOT_CONFIGURED",
                    "details", e.getMessage()
                ));
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error during regeneration",
                "code", "INTERNAL_ERROR",
                "details", e.getMessage()
            ));
        }
    }
}
