package com.archflow.server.controller;

import com.archflow.server.service.AiRateLimiterService;
import com.archflow.server.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/gemini")
public class GeminiController {

    private final GeminiService geminiService;
    private final AiRateLimiterService rateLimiterService;

    @Autowired
    public GeminiController(GeminiService geminiService, AiRateLimiterService rateLimiterService) {
        this.geminiService = geminiService;
        this.rateLimiterService = rateLimiterService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(@RequestParam(value = "userId", required = false) String userId) {
        return ResponseEntity.ok(Map.of(
                "configured", geminiService.isConfigured(),
                "provider", "Google Gemini",
                "remainingQuota", rateLimiterService.getRemainingQuota(userId)
        ));
    }

    @PostMapping("/parse-plan")
    public ResponseEntity<?> parseRequirementsToPlan(@RequestBody Map<String, Object> requestBody,
                                                     @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!rateLimiterService.allowRequest(userId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Rate limit exceeded. Please wait a minute before sending more requests."));
        }

        String prompt = (String) requestBody.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
        }

        Map<String, Object> context = (Map<String, Object>) requestBody.getOrDefault("context", Collections.emptyMap());
        Map<String, Object> result = geminiService.parseRequirementsToPlan(prompt, context);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> requestBody,
                                  @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!rateLimiterService.allowRequest(userId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Rate limit exceeded."));
        }

        String message = (String) requestBody.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        Map<String, Object> currentPlan = (Map<String, Object>) requestBody.get("currentPlan");
        List<Map<String, String>> history = (List<Map<String, String>>) requestBody.getOrDefault("history", Collections.emptyList());

        Map<String, Object> response = geminiService.processChatbotMessage(message, currentPlan, history);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/command")
    public ResponseEntity<?> parseCommand(@RequestBody Map<String, Object> requestBody,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!rateLimiterService.allowRequest(userId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Rate limit exceeded."));
        }

        String instruction = (String) requestBody.get("instruction");
        if (instruction == null || instruction.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Instruction is required"));
        }

        Map<String, Object> currentPlan = (Map<String, Object>) requestBody.get("currentPlan");
        Map<String, Object> action = geminiService.parseCommandToGeometryAction(instruction, currentPlan);
        return ResponseEntity.ok(action);
    }

    @PostMapping("/vastu-explain")
    public ResponseEntity<?> explainVastu(@RequestBody Map<String, Object> requestBody,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!rateLimiterService.allowRequest(userId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Rate limit exceeded."));
        }

        Map<String, Object> report = (Map<String, Object>) requestBody.get("report");
        if (report == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vastu report object is required"));
        }

        String userQuery = (String) requestBody.get("userQuery");
        Map<String, Object> explanation = geminiService.explainVastuResults(report, userQuery);
        return ResponseEntity.ok(explanation);
    }

    @PostMapping("/enhance-prompt")
    public ResponseEntity<?> enhancePrompt(@RequestBody Map<String, Object> requestBody,
                                           @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!rateLimiterService.allowRequest(userId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Rate limit exceeded."));
        }

        String prompt = (String) requestBody.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
        }

        Map<String, Object> details = (Map<String, Object>) requestBody.get("details");
        String enhanced = geminiService.enhanceArchitecturalPrompt(prompt, details);
        return ResponseEntity.ok(Map.of("enhancedPrompt", enhanced));
    }

    @PostMapping("/vision-analyze")
    public ResponseEntity<?> visionAnalyze(@RequestBody Map<String, Object> requestBody,
                                           @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!rateLimiterService.allowRequest(userId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Rate limit exceeded."));
        }

        String imageBase64 = (String) requestBody.get("image");
        if (imageBase64 == null || imageBase64.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image base64 data is required"));
        }

        String prompt = (String) requestBody.get("prompt");
        Map<String, Object> visionResult = geminiService.analyzeFloorPlanVision(imageBase64, prompt);
        return ResponseEntity.ok(visionResult);
    }
}
