package com.archflow.server.provider;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Primary
@Component
public class ProviderRouter implements ImageGenerationProvider {

    @Value("${PRIMARY_IMAGE_PROVIDER:qwen}")
    private String primaryProviderId;

    @Value("${FALLBACK_IMAGE_PROVIDER:}")
    private String fallbackProviderId;

    private Map<String, ImageGenerationProvider> providers;

    @Autowired
    public ProviderRouter(List<ImageGenerationProvider> providerList) {
        // Exclude the router itself to prevent infinite loops
        this.providers = providerList.stream()
                .filter(p -> !(p instanceof ProviderRouter))
                .collect(Collectors.toMap(ImageGenerationProvider::getProviderId, p -> p));
    }

    @PostConstruct
    public void init() {
        System.out.println("[IMAGE_PROVIDER] Configured Primary: " + primaryProviderId);
        System.out.println("[IMAGE_PROVIDER] Configured Fallback: " + fallbackProviderId);
        System.out.println("[IMAGE_PROVIDER] Available Providers: " + providers.keySet());
    }

    @Override
    public String getProviderId() {
        return "router";
    }

    @Override
    public boolean isConfigured() {
        ImageGenerationProvider primary = providers.get(primaryProviderId);
        if (primary != null && primary.isConfigured()) {
            return true;
        }
        ImageGenerationProvider fallback = providers.get(fallbackProviderId);
        return fallback != null && fallback.isConfigured();
    }

    @Override
    public CompletableFuture<String> generateDesign(String prompt, Map<String, Object> options) {
        ImageGenerationProvider primary = providers.get(primaryProviderId);
        
        if (primary == null) {
            System.err.println("[IMAGE_PROVIDER] Primary provider '" + primaryProviderId + "' not found.");
            return attemptFallback(prompt, options, "Primary provider not configured");
        }

        System.out.println("[IMAGE_PROVIDER] Primary provider: " + primaryProviderId);

        return primary.generateDesign(prompt, options).handle((result, ex) -> {
            if (ex != null) {
                // Determine safe error string
                String safeError = ex.getMessage() != null ? ex.getMessage() : ex.toString();
                if (ex.getCause() != null && ex.getCause().getMessage() != null) {
                    safeError = ex.getCause().getMessage();
                }
                
                System.err.println("[IMAGE_PROVIDER] Primary provider failed: " + safeError);
                
                return attemptFallbackSync(prompt, options, safeError);
            }
            return result;
        });
    }

    private CompletableFuture<String> attemptFallback(String prompt, Map<String, Object> options, String reason) {
        return CompletableFuture.supplyAsync(() -> attemptFallbackSync(prompt, options, reason));
    }

    private String attemptFallbackSync(String prompt, Map<String, Object> options, String reason) {
        if (fallbackProviderId == null || fallbackProviderId.trim().isEmpty()) {
            System.err.println("[IMAGE_PROVIDER] No fallback provider configured.");
            throw new RuntimeException("Image generation is temporarily unavailable because all configured AI providers are unavailable.");
        }

        if (fallbackProviderId.equals(primaryProviderId)) {
            System.err.println("[IMAGE_PROVIDER] Fallback provider is identical to primary provider. Skipping fallback.");
            throw new RuntimeException("Image generation is temporarily unavailable because all configured AI providers are unavailable.");
        }

        ImageGenerationProvider fallback = providers.get(fallbackProviderId);
        if (fallback == null) {
            System.err.println("[IMAGE_PROVIDER] Fallback provider '" + fallbackProviderId + "' not found.");
            throw new RuntimeException("Image generation is temporarily unavailable because all configured AI providers are unavailable.");
        }

        System.out.println("[IMAGE_PROVIDER] Attempting fallback provider: " + fallbackProviderId);

        try {
            String result = fallback.generateDesign(prompt, options).join();
            System.out.println("[IMAGE_PROVIDER] Fallback provider " + fallbackProviderId + " succeeded");
            return result;
        } catch (Exception fallbackEx) {
            String safeError = fallbackEx.getMessage() != null ? fallbackEx.getMessage() : fallbackEx.toString();
            if (fallbackEx.getCause() != null && fallbackEx.getCause().getMessage() != null) {
                safeError = fallbackEx.getCause().getMessage();
            }
            System.err.println("[IMAGE_PROVIDER] Fallback provider " + fallbackProviderId + " failed: " + safeError);
            System.err.println("[IMAGE_PROVIDER] All configured image providers failed");
            throw new RuntimeException("Image generation is temporarily unavailable because all configured AI providers are unavailable.");
        }
    }
}
