package com.archflow.server.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class LocalImageGenerationProvider implements ImageGenerationProvider {

    @Value("${LOCAL_IMAGE_API_URL:http://archflow-ai:8000/generate}")
    private String endpoint;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public String getProviderId() {
        return "local";
    }

    @Override
    public CompletableFuture<String> generateDesign(String prompt, Map<String, Object> options) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("prompt", prompt);
                if (options != null && !options.isEmpty()) {
                    requestBody.put("parameters", options);
                }

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                
                System.out.println("[LOCAL-AI] Starting local generation request...");
                System.out.println("[LOCAL-AI] Endpoint: " + endpoint);

                ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, Map.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> body = response.getBody();
                    if (body.containsKey("images") && body.get("images") instanceof java.util.List) {
                        java.util.List<?> images = (java.util.List<?>) body.get("images");
                        if (!images.isEmpty()) {
                            String base64Image = (String) images.get(0);
                            return "data:image/jpeg;base64," + base64Image;
                        }
                    }
                }
                throw new RuntimeException("Failed to extract image from local AI provider. Status: " + response.getStatusCode());
            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                String errorBody = e.getResponseBodyAsString();
                System.err.println("[LOCAL-AI] HTTP Error: " + e.getStatusCode() + " Body: " + errorBody);
                if (e.getStatusCode().value() == 503) {
                    throw new RuntimeException("Local AI model is currently loading or not ready.", e);
                }
                throw new RuntimeException("Local AI Error " + e.getStatusCode() + ": " + errorBody, e);
            } catch (Exception e) {
                System.err.println("[LOCAL-AI] Internal I/O Error calling local API: " + e.getMessage());
                throw new RuntimeException("Local Image generation failed: Is the ai-service running? " + e.getMessage(), e);
            }
        });
    }
}
