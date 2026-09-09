package com.archflow.server.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class QwenImageProvider implements ImageGenerationProvider {

    @Value("${QWEN_IMAGE_ENDPOINT:https://router.huggingface.co/nscale/v1/images/generations}")
    private String endpoint;

    @Value("${QWEN_IMAGE_API_KEY:${DASHSCOPE_API_KEY:}}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void init() {
        System.out.println("[QwenImageProvider] Qwen image provider configured: " + isConfigured());
        System.out.println("[QwenImageProvider] Endpoint: " + endpoint);
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public String getProviderId() {
        return "qwen";
    }

    @Override
    public CompletableFuture<String> generateDesign(String prompt, Map<String, Object> options) {
        return CompletableFuture.supplyAsync(() -> {
            if (!isConfigured()) {
                throw new RuntimeException("QWEN_IMAGE_API_KEY is not configured. Please set your API key to generate images.");
            }

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + apiKey);

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("inputs", prompt); // Fallback for raw hf-inference
                requestBody.put("prompt", prompt); // OpenAI format
                requestBody.put("model", "black-forest-labs/FLUX.1-schnell"); // OpenAI format
                
                String buildingType = "";
                if (options != null && options.containsKey("architecturalConstraint")) {
                    Object constraintObj = options.get("architecturalConstraint");
                    if (constraintObj instanceof com.archflow.server.service.ArchitecturalConstraint) {
                        buildingType = ((com.archflow.server.service.ArchitecturalConstraint) constraintObj).getBuildingType();
                    }
                } else if (options != null && options.containsKey("buildingType")) {
                    buildingType = String.valueOf(options.get("buildingType"));
                }
                
                Map<String, Object> parameters = new HashMap<>();
                if (options != null) {
                    for (Map.Entry<String, Object> entry : options.entrySet()) {
                        if (!"architecturalConstraint".equals(entry.getKey())) {
                            parameters.put(entry.getKey(), entry.getValue());
                        }
                    }
                }
                
                Integer floors = null;
                Integer maxStoreys = null;
                if (options != null && options.containsKey("architecturalConstraint")) {
                    Object constraintObj = options.get("architecturalConstraint");
                    if (constraintObj instanceof com.archflow.server.service.ArchitecturalConstraint) {
                        floors = ((com.archflow.server.service.ArchitecturalConstraint) constraintObj).getFloors();
                        maxStoreys = ((com.archflow.server.service.ArchitecturalConstraint) constraintObj).getMaxStoreys();
                    }
                }
                
                System.out.println("[ARCH-CONSTRAINT]");
                System.out.println("buildingType=" + buildingType);
                System.out.println("floors=" + (floors != null ? floors : "null"));
                System.out.println("maxStoreys=" + (maxStoreys != null ? maxStoreys : "null"));
                
                if ("single_floor".equalsIgnoreCase(buildingType)) {
                    parameters.put("width", 1024);
                    parameters.put("height", 576);
                    requestBody.put("width", 1024);
                    requestBody.put("height", 576);
                    requestBody.put("size", "1024x576");
                }

                String negativePromptStr = "";
                if (options != null && options.containsKey("negative_prompt")) {
                    negativePromptStr = String.valueOf(options.get("negative_prompt"));
                    parameters.put("negative_prompt", negativePromptStr);
                }
                
                if (!parameters.isEmpty()) {
                    requestBody.put("parameters", parameters);
                }

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                
                System.out.println("[IMAGE-GENERATION]");
                System.out.println("width=" + (requestBody.containsKey("width") ? requestBody.get("width") : "default"));
                System.out.println("height=" + (requestBody.containsKey("height") ? requestBody.get("height") : "default"));
                System.out.println("model=" + requestBody.get("model"));
                System.out.println("finalPrompt=" + requestBody.get("inputs"));
                System.out.println("negativePrompt=" + negativePromptStr);

                System.out.println("[HF_CONFIG] token_present=" + (apiKey != null && !apiKey.trim().isEmpty()));
                System.out.println("[HF_CONFIG] token_length=" + (apiKey != null ? apiKey.length() : 0));
                System.out.println("[HF_CONFIG] model=" + requestBody.get("model"));
                System.out.println("[HF_CONFIG] endpoint=" + endpoint);
                System.out.println("[HF_PROVIDER] model=" + requestBody.get("model"));
                
                System.out.println("[HF] Starting generation request...");
                System.out.println("[HF] Endpoint: " + endpoint);

                ResponseEntity<byte[]> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, byte[].class);
                
                System.out.println("[HF] Response Status: " + response.getStatusCode());
                if (response.getHeaders().getContentType() != null) {
                    System.out.println("[HF] Response Content-Type: " + response.getHeaders().getContentType().toString());
                }

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    MediaType contentType = response.getHeaders().getContentType();
                    if (contentType != null && contentType.toString().startsWith("image/")) {
                        byte[] imageBytes = response.getBody();
                        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
                        return "data:" + contentType.toString() + ";base64," + base64Image;
                    } else if (contentType != null && contentType.toString().contains("json")) {
                        try {
                            String jsonResponse = new String(response.getBody());
                            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(jsonResponse);
                            if (rootNode.has("data") && rootNode.get("data").isArray() && rootNode.get("data").size() > 0) {
                                com.fasterxml.jackson.databind.JsonNode dataNode = rootNode.get("data").get(0);
                                if (dataNode.has("b64_json")) {
                                    return "data:image/jpeg;base64," + dataNode.get("b64_json").asText();
                                }
                            }
                            throw new RuntimeException("Hugging Face API returned unhandled JSON format: " + jsonResponse);
                        } catch (Exception e) {
                            throw new RuntimeException("Failed to parse JSON response from Hugging Face API", e);
                        }
                    } else {
                        // Fallback assuming jpeg if missing content-type but status 200
                        byte[] imageBytes = response.getBody();
                        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
                        return "data:image/jpeg;base64," + base64Image;
                    }
                }
                throw new RuntimeException("Failed to get image bytes from Hugging Face API. Status: " + response.getStatusCode());
            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                String errorBody = e.getResponseBodyAsString();
                System.err.println("[HF] HTTP Error: " + e.getStatusCode() + " Body: " + errorBody);
                
                if (e.getStatusCode().value() == 503) {
                    throw new RuntimeException("Model is currently loading on Hugging Face. Please retry in a few seconds.", e);
                } else if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                    throw new RuntimeException("Provider HTTP Error " + e.getStatusCode() + " UNAUTHORIZED: " + errorBody, e);
                } else if (e.getStatusCode().value() == 429) {
                    throw new RuntimeException("Hugging Face API rate limit exceeded.", e);
                } else if (e.getStatusCode().value() == 404) {
                    throw new RuntimeException("Hugging Face Model/Endpoint not found (404). Verify HF_IMAGE_MODEL is correct.", e);
                }
                
                throw new RuntimeException("Hugging Face API Error " + e.getStatusCode() + ": " + errorBody, e);
            } catch (Exception e) {
                System.err.println("[HF] Internal I/O Error calling API: " + e.getMessage());
                throw new RuntimeException("Image generation failed internally: " + e.getMessage(), e);
            }
        });
    }
}
