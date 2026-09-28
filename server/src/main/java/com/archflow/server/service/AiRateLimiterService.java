package com.archflow.server.service;

import com.archflow.server.config.GeminiConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AiRateLimiterService {

    private final GeminiConfig geminiConfig;
    private final ConcurrentHashMap<String, RateTracker> userLimitMap = new ConcurrentHashMap<>();

    @Autowired
    public AiRateLimiterService(GeminiConfig geminiConfig) {
        this.geminiConfig = geminiConfig;
    }

    public static class RateTracker {
        long windowStartMs;
        AtomicInteger count;

        public RateTracker(long windowStartMs) {
            this.windowStartMs = windowStartMs;
            this.count = new AtomicInteger(0);
        }
    }

    public synchronized boolean allowRequest(String clientIdentifier) {
        String key = clientIdentifier != null && !clientIdentifier.trim().isEmpty() ? clientIdentifier : "anonymous";
        long now = System.currentTimeMillis();
        int maxLimit = geminiConfig.getRateLimitPerMinute();

        RateTracker tracker = userLimitMap.computeIfAbsent(key, k -> new RateTracker(now));

        // 1-minute sliding window reset
        if (now - tracker.windowStartMs > 60000) {
            tracker.windowStartMs = now;
            tracker.count.set(0);
        }

        if (tracker.count.get() >= maxLimit) {
            System.err.println("[RATE_LIMITER] Limit exceeded for client: " + key + " (Limit: " + maxLimit + "/min)");
            return false;
        }

        tracker.count.incrementAndGet();
        return true;
    }

    public int getRemainingQuota(String clientIdentifier) {
        String key = clientIdentifier != null && !clientIdentifier.trim().isEmpty() ? clientIdentifier : "anonymous";
        RateTracker tracker = userLimitMap.get(key);
        if (tracker == null) return geminiConfig.getRateLimitPerMinute();
        long now = System.currentTimeMillis();
        if (now - tracker.windowStartMs > 60000) return geminiConfig.getRateLimitPerMinute();
        return Math.max(0, geminiConfig.getRateLimitPerMinute() - tracker.count.get());
    }
}
