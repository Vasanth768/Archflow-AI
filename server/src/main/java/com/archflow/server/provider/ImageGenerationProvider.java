package com.archflow.server.provider;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface ImageGenerationProvider {
    /**
     * Generates an image based on the provided prompt and options.
     * @param prompt The prompt string detailing the architectural generation.
     * @param options Additional options like size, model configuration.
     * @return CompletableFuture resolving to the generated image URL or base64 string.
     */
    CompletableFuture<String> generateDesign(String prompt, Map<String, Object> options);

    /**
     * Checks if the provider is properly configured (e.g. API keys are set).
     * @return true if configured, false otherwise.
     */
    default boolean isConfigured() {
        return true;
    }

    /**
     * Unique identifier for this provider (e.g. "qwen", "local").
     * @return the provider ID string.
     */
    String getProviderId();
}
