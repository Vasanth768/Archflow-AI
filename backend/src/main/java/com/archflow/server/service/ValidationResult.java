package com.archflow.server.service;

public class ValidationResult {
    public enum Status {
        VALID, INVALID, UNVERIFIED
    }

    private Status status;
    private String detectedBuildingType;
    private Integer detectedFloorCount;
    private String reason;
    private String rawApiResponse;

    public ValidationResult(Status status, String detectedBuildingType, Integer detectedFloorCount, String reason) {
        this.status = status;
        this.detectedBuildingType = detectedBuildingType;
        this.detectedFloorCount = detectedFloorCount;
        this.reason = reason;
    }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getDetectedBuildingType() { return detectedBuildingType; }
    public void setDetectedBuildingType(String detectedBuildingType) { this.detectedBuildingType = detectedBuildingType; }

    public Integer getDetectedFloorCount() { return detectedFloorCount; }
    public void setDetectedFloorCount(Integer detectedFloorCount) { this.detectedFloorCount = detectedFloorCount; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getRawApiResponse() { return rawApiResponse; }
    public void setRawApiResponse(String rawApiResponse) { this.rawApiResponse = rawApiResponse; }
}
