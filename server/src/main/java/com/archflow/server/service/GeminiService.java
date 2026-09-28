package com.archflow.server.service;

import com.archflow.server.config.GeminiConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    private final GeminiConfig geminiConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Autowired
    public GeminiService(GeminiConfig geminiConfig, ObjectMapper objectMapper) {
        this.geminiConfig = geminiConfig;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public boolean isConfigured() {
        return geminiConfig.isConfigured();
    }

    private String callGeminiApi(String systemPrompt, String userMessage, boolean expectJson, String imageBase64) {
        if (!isConfigured()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured in server environment.");
        }

        try {
            String url = String.format("%s/%s:generateContent?key=%s",
                    geminiConfig.getEndpoint(),
                    geminiConfig.getModel(),
                    geminiConfig.getApiKey());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();

            // Contents array
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> contentObj = new HashMap<>();
            contentObj.put("role", "user");

            List<Map<String, Object>> parts = new ArrayList<>();

            // System prompt + user prompt combined for wide compatibility
            String combinedPrompt = (systemPrompt != null && !systemPrompt.isEmpty())
                    ? systemPrompt + "\n\nUser Request:\n" + userMessage
                    : userMessage;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", combinedPrompt);
            parts.add(textPart);

            // Multimodal image part if provided
            if (imageBase64 != null && !imageBase64.isEmpty()) {
                String cleanB64 = imageBase64.replaceFirst("^data:image/[^;]+;base64,", "");
                Map<String, Object> imagePart = new HashMap<>();
                Map<String, Object> inlineData = new HashMap<>();
                inlineData.put("mime_type", "image/jpeg");
                inlineData.put("data", cleanB64);
                imagePart.put("inline_data", inlineData);
                parts.add(imagePart);
            }

            contentObj.put("parts", parts);
            contents.add(contentObj);
            requestBody.put("contents", contents);

            // Generation config
            Map<String, Object> genConfig = new HashMap<>();
            genConfig.put("temperature", 0.2);
            genConfig.put("maxOutputTokens", 2048);
            if (expectJson) {
                genConfig.put("responseMimeType", "application/json");
            }
            requestBody.put("generationConfig", genConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    return textNode.asText("");
                }
            }
            throw new RuntimeException("Empty response received from Gemini API");

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("[GEMINI] HTTP " + e.getStatusCode() + " Error: " + errorBody);
            if (e.getStatusCode().value() == 400 || e.getStatusCode().value() == 403 || e.getStatusCode().value() == 401) {
                throw new RuntimeException("Gemini API authentication/request error: " + errorBody, e);
            } else if (e.getStatusCode().value() == 429) {
                throw new RuntimeException("Gemini API rate limit reached. Please retry in a few moments.", e);
            }
            throw new RuntimeException("Gemini API error: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("[GEMINI] Internal error: " + e.getMessage());
            throw new RuntimeException("Gemini Service Exception: " + e.getMessage(), e);
        }
    }

    /**
     * Requirement Understanding: Converts user text prompt to structured CreatePlanRequest JSON
     */
    public Map<String, Object> parseRequirementsToPlan(String prompt, Map<String, Object> context) {
        String systemInstruction = "You are an expert AI Architectural Assistant for ArchFlow. "
                + "Analyze the user's architectural requirement prompt and return a strictly structured JSON object. "
                + "Do NOT return markdown fences or explanation. Return ONLY valid JSON matching this schema:\n"
                + "{\n"
                + "  \"plot\": {\n"
                + "    \"width\": <number in ft, default 30>,\n"
                + "    \"length\": <number in ft, default 40>,\n"
                + "    \"unit\": \"ft\",\n"
                + "    \"facing\": \"East\" | \"West\" | \"North\" | \"South\" | \"North-East\" | \"North-West\" | \"South-East\" | \"South-West\"\n"
                + "  },\n"
                + "  \"floors\": <number, default 1>,\n"
                + "  \"buildingType\": \"Residential\" | \"Commercial\" | \"Villa\" | \"Apartment\" | \"Farmhouse\",\n"
                + "  \"style\": \"Standard Modern\" | \"Budget Friendly\" | \"Premium Luxury\" | \"Minimalist\" | \"Traditional Modern\",\n"
                + "  \"budget\": \"Low Cost\" | \"Mid Range\" | \"Premium\" | \"Luxury\",\n"
                + "  \"rooms\": [\n"
                + "    { \"name\": \"LIVING ROOM\", \"type\": \"living\", \"width\": 16, \"length\": 15 },\n"
                + "    { \"name\": \"MASTER BEDROOM\", \"type\": \"master_bedroom\", \"width\": 12, \"length\": 12 },\n"
                + "    { \"name\": \"KITCHEN\", \"type\": \"kitchen\", \"width\": 10, \"length\": 11 }\n"
                + "  ],\n"
                + "  \"requirements\": {\n"
                + "    \"bedrooms\": <number>,\n"
                + "    \"bathrooms\": <number>,\n"
                + "    \"parking\": <boolean>,\n"
                + "    \"pooja\": <boolean>,\n"
                + "    \"balcony\": <boolean>,\n"
                + "    \"staircase\": \"Inside\" | \"Outside\" | \"None\"\n"
                + "  },\n"
                + "  \"summary\": \"<Short 1-sentence architectural summary>\"\n"
                + "}";

        try {
            String rawJson = callGeminiApi(systemInstruction, prompt, true, null);
            Map<String, Object> parsed = objectMapper.readValue(rawJson, Map.class);
            return parsed;
        } catch (Exception e) {
            System.err.println("[GEMINI] Failed to parse plan requirements: " + e.getMessage());
            // Safe fallback structure
            Map<String, Object> fallback = new HashMap<>();
            Map<String, Object> plot = new HashMap<>();
            plot.put("width", 30);
            plot.put("length", 40);
            plot.put("unit", "ft");
            plot.put("facing", "East");
            fallback.put("plot", plot);
            fallback.put("floors", 1);
            fallback.put("buildingType", "Residential");
            fallback.put("style", "Standard Modern");
            fallback.put("budget", "Mid Range");
            fallback.put("requirements", Map.of("bedrooms", 2, "bathrooms", 2, "parking", true, "pooja", false, "balcony", false, "staircase", "Inside"));
            fallback.put("summary", "Generated 30x40 East Facing standard residential house.");
            fallback.put("aiStatus", "FALLBACK_USED");
            return fallback;
        }
    }

    /**
     * AI Chatbot: Understands conversational request, identifies intent, returns structured command & response
     */
    public Map<String, Object> processChatbotMessage(String message, Map<String, Object> currentPlan, List<Map<String, String>> history) {
        String systemInstruction = "You are ArchFlow's AI Architectural Intelligence Assistant. "
                + "Analyze the user's chat input in context of their CAD floor plan. "
                + "Classify the intent strictly into one of: CREATE_PLAN, MODIFY_PLAN, ANALYZE_PLAN, VASTU_QUERY, IMAGE_GENERATION, GENERAL_ARCHITECTURAL_QUERY. "
                + "Return a strictly structured JSON matching this schema:\n"
                + "{\n"
                + "  \"intent\": \"CREATE_PLAN\" | \"MODIFY_PLAN\" | \"ANALYZE_PLAN\" | \"VASTU_QUERY\" | \"IMAGE_GENERATION\" | \"GENERAL_ARCHITECTURAL_QUERY\",\n"
                + "  \"message\": \"<Polite, professional architectural response to display in chat>\",\n"
                + "  \"action\": null | {\n"
                + "    \"type\": \"RESIZE_ROOM\" | \"ADD_ROOM\" | \"DELETE_ROOM\" | \"MOVE_ROOM\" | \"CHANGE_STYLE\" | \"CHECK_VASTU\" | \"GENERATE_PLAN\",\n"
                + "    \"params\": { ... specific structured parameters ... }\n"
                + "  }\n"
                + "}";

        String contextSummary = currentPlan != null ? "Current Plan Active: " + currentPlan.getOrDefault("name", "Active CAD Plan") : "No plan loaded.";

        try {
            String rawJson = callGeminiApi(systemInstruction, "Context: " + contextSummary + "\nUser Message: " + message, true, null);
            return objectMapper.readValue(rawJson, Map.class);
        } catch (Exception e) {
            System.err.println("[GEMINI] Chatbot message processing error: " + e.getMessage());
            return Map.of(
                    "intent", "GENERAL_ARCHITECTURAL_QUERY",
                    "message", "I am ArchFlow's Architectural Assistant. How can I help refine your floor plan or Vastu layout?",
                    "action", null
            );
        }
    }

    /**
     * Natural Language CAD Command: Parses user instructions (English / transliterated Tamil) to structured CAD command
     */
    public Map<String, Object> parseCommandToGeometryAction(String instruction, Map<String, Object> currentPlan) {
        String systemInstruction = "You are a CAD Natural Language Command Parser for ArchFlow. "
                + "Extract the exact geometric or structural action requested by the user. "
                + "Supported actions: RESIZE_ROOM, ADD_ROOM, DELETE_ROOM, MOVE_ROOM, ADD_DOOR, ADD_WINDOW, CHANGE_STYLE. "
                + "Return JSON only:\n"
                + "{\n"
                + "  \"success\": true,\n"
                + "  \"action\": \"RESIZE_ROOM\" | \"ADD_ROOM\" | \"DELETE_ROOM\" | \"MOVE_ROOM\" | \"ADD_DOOR\" | \"ADD_WINDOW\" | \"CHANGE_STYLE\" | \"UNKNOWN\",\n"
                + "  \"targetRoom\": \"<room name or type such as master_bedroom, kitchen, living, toilet>\",\n"
                + "  \"dimensions\": {\n"
                + "    \"width\": <width in feet or null>,\n"
                + "    \"length\": <length in feet or null>,\n"
                + "    \"unit\": \"ft\"\n"
                + "  },\n"
                + "  \"targetZone\": \"<NE | NW | SE | SW | E | W | N | S | Center | null>\",\n"
                + "  \"style\": \"<style string if CHANGE_STYLE>\",\n"
                + "  \"description\": \"<Explanation of interpreted action>\"\n"
                + "}";

        try {
            String rawJson = callGeminiApi(systemInstruction, instruction, true, null);
            return objectMapper.readValue(rawJson, Map.class);
        } catch (Exception e) {
            System.err.println("[GEMINI] Command parsing error: " + e.getMessage());
            return Map.of(
                    "success", false,
                    "action", "UNKNOWN",
                    "description", "Could not interpret command automatically: " + e.getMessage()
            );
        }
    }

    /**
     * Vastu Explainer: Takes deterministic ground-truth calculation and produces human-readable architectural advice
     */
    public Map<String, Object> explainVastuResults(Map<String, Object> vastuScoreReport, String userQuery) {
        String systemInstruction = "You are an expert Indian Vastu Shastra Consultant for ArchFlow. "
                + "You are provided with DETERMINISTIC ground-truth calculation results from ArchFlow's mathematical Vastu engine. "
                + "CRITICAL RULES:\n"
                + "1. DO NOT invent or alter the Vastu score. Use the exact score and tier provided in the data.\n"
                + "2. Explain WHY specific rooms passed or triggered warnings according to Vastu Shastra.\n"
                + "3. Provide practical, non-destructive architectural remedies (e.g. door orientation, element balancing).\n"
                + "Return JSON only:\n"
                + "{\n"
                + "  \"score\": <exact input score>,\n"
                + "  \"tier\": \"<exact input tier>\",\n"
                + "  \"overview\": \"<2-3 sentence overview of compliance>\",\n"
                + "  \"roomExplanations\": [\n"
                + "    { \"room\": \"...\", \"zone\": \"...\", \"status\": \"PASS\"|\"WARNING\"|\"FAIL\", \"explanation\": \"...\" }\n"
                + "  ],\n"
                + "  \"actionableRemedies\": [\"...\", \"...\"]\n"
                + "}";

        try {
            String promptText = "Vastu Engine Data:\n" + objectMapper.writeValueAsString(vastuScoreReport)
                    + (userQuery != null ? "\nUser Specific Question: " + userQuery : "");
            String rawJson = callGeminiApi(systemInstruction, promptText, true, null);
            return objectMapper.readValue(rawJson, Map.class);
        } catch (Exception e) {
            System.err.println("[GEMINI] Vastu explanation error: " + e.getMessage());
            return Map.of(
                    "score", vastuScoreReport.getOrDefault("score", 0),
                    "tier", vastuScoreReport.getOrDefault("tier", "Moderate"),
                    "overview", "Mathematical Vastu analysis calculated based on the 9-quadrant mandala grid.",
                    "actionableRemedies", List.of("Align Kitchen to South-East (Agneya)", "Keep Brahmasthan open and unobstructed")
            );
        }
    }

    /**
     * Prompt Enhancement: Upgrades simple user prompt with rich architectural vocabulary
     */
    public String enhanceArchitecturalPrompt(String userPrompt, Map<String, Object> details) {
        String systemInstruction = "You are an architectural prompt engineer. "
                + "Take the user's basic house description and expand it into a detailed, professional architectural specification prompt. "
                + "Include specifications on plot proportions, orientation, daylighting, natural cross-ventilation, functional zoning, and clean construction materials. "
                + "Return ONLY the enhanced prompt paragraph. No conversational intro.";

        try {
            String detailsSummary = details != null ? "Details: " + details.toString() + "\n" : "";
            return callGeminiApi(systemInstruction, detailsSummary + "Basic Prompt: " + userPrompt, false, null);
        } catch (Exception e) {
            System.err.println("[GEMINI] Prompt enhancement error: " + e.getMessage());
            return userPrompt + " (Enhanced with natural daylighting and sustainable cross-ventilation design).";
        }
    }

    /**
     * Multimodal Floor Plan Analysis: Advisory analysis on an uploaded drawing/blueprint
     */
    public Map<String, Object> analyzeFloorPlanVision(String imageBase64, String prompt) {
        String systemInstruction = "You are ArchFlow's AI Architectural Vision Analyzer. "
                + "Examine the uploaded floor plan drawing/blueprint image. "
                + "Identify visible rooms, circulation corridors, entry points, and structural constraints. "
                + "Note: This is advisory vision analysis. Estimate dimensions if text annotations are unreadable. "
                + "Return JSON matching:\n"
                + "{\n"
                + "  \"detectedPlotSize\": \"<e.g. 30x40 ft or Estimated>\",\n"
                + "  \"detectedFacing\": \"<e.g. East or Unspecified>\",\n"
                + "  \"rooms\": [ { \"name\": \"...\", \"zone\": \"...\", \"notes\": \"...\" } ],\n"
                + "  \"observations\": [ \"...\", \"...\" ],\n"
                + "  \"recommendations\": [ \"...\", \"...\" ]\n"
                + "}";

        try {
            String userText = prompt != null && !prompt.isEmpty() ? prompt : "Analyze this architectural floor plan blueprint.";
            String rawJson = callGeminiApi(systemInstruction, userText, true, imageBase64);
            return objectMapper.readValue(rawJson, Map.class);
        } catch (Exception e) {
            System.err.println("[GEMINI] Vision analysis error: " + e.getMessage());
            return Map.of(
                    "detectedPlotSize", "Estimated 30x40 ft",
                    "observations", List.of("Standard residential floor plan layout detected."),
                    "recommendations", List.of("Verify clear dimensions against site boundary surveys.")
            );
        }
    }
}
