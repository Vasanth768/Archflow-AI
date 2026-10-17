package com.archflow.server.provider;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class LocalImageGenerationProvider implements ImageGenerationProvider {

    @Value("${LOCAL_IMAGE_API_URL:http://archflow-ai:8000/generate}")
    private String endpoint;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000);
        factory.setReadTimeout(120000);
        return new RestTemplate(factory);
    }

    @Override
    public boolean isConfigured() {
        // Local AI service is a 2D CAD floor plan engine, not a configured 3D architectural exterior elevation provider.
        return false;
    }

    @Override
    public String getProviderId() {
        return "local";
    }

    @Override
    public CompletableFuture<String> generateDesign(String prompt, Map<String, Object> options) {
        return CompletableFuture.supplyAsync(() -> {
            if (!isConfigured()) {
                throw new IllegalStateException("Local image provider is not configured as a 3D architectural exterior provider.");
            }
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
                if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                    throw new RuntimeException("FALLBACK_AUTH_ERROR: Local fallback authentication failed.", e);
                }
                if (e.getStatusCode().value() == 429) {
                    throw new RuntimeException("FALLBACK_RATE_LIMITED: Local fallback rate limited.", e);
                }
                if (e.getStatusCode().value() == 503) {
                    throw new RuntimeException("FALLBACK_TEMPORARILY_UNAVAILABLE: Local AI model is currently loading or not ready.", e);
                }
                throw new RuntimeException("FALLBACK_PROVIDER_ERROR: Local AI Error " + e.getStatusCode() + ": " + errorBody, e);
            } catch (org.springframework.web.client.ResourceAccessException e) {
                if (e.getCause() instanceof java.net.SocketTimeoutException || e.getMessage() != null && e.getMessage().contains("timed out")) {
                    throw new RuntimeException("FALLBACK_TIMEOUT: Local fallback timed out.", e);
                }
                throw new RuntimeException("FALLBACK_ERROR: Local Image generation failed: Is the ai-service running? " + e.getMessage(), e);
            } catch (Exception e) {
                System.err.println("[LOCAL-AI] Internal I/O Error calling local API: " + e.getMessage());
                throw new RuntimeException("FALLBACK_ERROR: Local Image generation failed: Is the ai-service running? " + e.getMessage(), e);
            }
        });
    }
}
