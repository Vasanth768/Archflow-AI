package com.archflow.server.service;

import org.springframework.stereotype.Component;
import java.util.concurrent.CompletableFuture;

@Component
public class StubArchitecturalValidator implements ArchitecturalImageValidator {
    @Override
    public CompletableFuture<ValidationResult> validate(String imageUrl, ArchitecturalConstraint constraint) {
        return CompletableFuture.supplyAsync(() -> {
            System.out.println("[IMAGE_VALIDATION] status=UNVERIFIED");
            System.out.println("[IMAGE_VALIDATION] reason=No vision validator configured");
            return new ValidationResult(ValidationResult.Status.UNVERIFIED, "unknown", null, "No vision validator configured");
        });
    }
}
