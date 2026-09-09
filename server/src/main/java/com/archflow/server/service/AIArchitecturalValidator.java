package com.archflow.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
@Primary
public class AIArchitecturalValidator implements ArchitecturalImageValidator {

    @Value("${LOCAL_IMAGE_API_URL:http://archflow-ai:8000/generate}")
    private String localImageApiUrl;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AIArchitecturalValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public CompletableFuture<ValidationResult> validate(String imageUrl, ArchitecturalConstraint constraint) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Ensure imageUrl is a base64 string
                String base64Image = imageUrl;
                if (base64Image.startsWith("data:image")) {
                    base64Image = base64Image.replaceFirst("^data:image/[^;]+;base64,", "");
                }

                // AI Service validation endpoint is assumed to be /validate 
                // We derive it from LOCAL_IMAGE_API_URL replacing /generate with /validate
                String validateUrl = localImageApiUrl.replace("/generate", "/validate");

                Map<String, String> payload = new HashMap<>();
                payload.put("image_b64", base64Image);
                payload.put("buildingType", constraint.getBuildingType());

                String requestBody = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(validateUrl))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(60))
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode rootNode = objectMapper.readTree(response.body());
                    String statusStr = rootNode.has("status") ? rootNode.get("status").asText() : "UNVERIFIED";
                    String reason = rootNode.has("reason") ? rootNode.get("reason").asText() : "Unknown reason";
                    String rawVqa = rootNode.has("raw_vqa_output") ? rootNode.get("raw_vqa_output").asText() : null;

                    ValidationResult.Status status;
                    try {
                        status = ValidationResult.Status.valueOf(statusStr);
                    } catch (IllegalArgumentException e) {
                        status = ValidationResult.Status.UNVERIFIED;
                    }

                    ValidationResult result = new ValidationResult(status, constraint.getBuildingType(), null, reason);
                    result.setRawApiResponse(rawVqa);
                    return result;
                } else {
                    System.err.println("[AIArchitecturalValidator] Validation failed with status: " + response.statusCode() + " body: " + response.body());
                    return new ValidationResult(ValidationResult.Status.UNVERIFIED, constraint.getBuildingType(), null, "Validator API returned status " + response.statusCode());
                }

            } catch (Exception e) {
                System.err.println("[AIArchitecturalValidator] Exception during validation: " + e.getMessage());
                return new ValidationResult(ValidationResult.Status.UNVERIFIED, constraint.getBuildingType(), null, "Validator Exception: " + e.getMessage());
            }
        });
    }
}
