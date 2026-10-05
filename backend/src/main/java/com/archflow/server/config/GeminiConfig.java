package com.archflow.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    @Value("${GEMINI_MODEL:gemini-1.5-flash}")
    private String model;

    @Value("${GEMINI_ENDPOINT:https://generativelanguage.googleapis.com/v1beta/models}")
    private String endpoint;

    @Value("${AI_RATE_LIMIT_PER_MINUTE:30}")
    private int rateLimitPerMinute;

    public String getApiKey() {
        return apiKey != null ? apiKey.trim() : "";
    }

    public String getModel() {
        return model != null && !model.trim().isEmpty() ? model.trim() : "gemini-1.5-flash";
    }

    public String getEndpoint() {
        return endpoint;
    }

    public int getRateLimitPerMinute() {
        return rateLimitPerMinute;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }
}
