package com.archflow.server.service;

import java.util.concurrent.CompletableFuture;

public interface ArchitecturalImageValidator {
    /**
     * Validates whether the generated image adheres to the architectural constraint.
     * @param imageUrl The base64 or URL of the generated image.
     * @param constraint The architectural constraint.
     * @return ValidationResult indicating VALID, INVALID, or UNVERIFIED.
     */
    CompletableFuture<ValidationResult> validate(String imageUrl, ArchitecturalConstraint constraint);
}
