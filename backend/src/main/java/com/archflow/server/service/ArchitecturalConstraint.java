package com.archflow.server.service;

public class ArchitecturalConstraint {
    private String buildingType;
    private Integer floors;
    private Integer maxStoreys;
    private Boolean upperFloorAllowed;
    private Boolean upperFloorWindowsAllowed;
    private Boolean upperFloorBalconyAllowed;
    private Boolean upperFloorRoomsAllowed;
    private Boolean duplexAllowed;

    public ArchitecturalConstraint(String buildingType) {
        this.buildingType = buildingType;
        if ("single_floor".equals(buildingType)) {
            this.floors = 1;
            this.maxStoreys = 1;
            this.upperFloorAllowed = false;
            this.upperFloorWindowsAllowed = false;
            this.upperFloorBalconyAllowed = false;
            this.upperFloorRoomsAllowed = false;
            this.duplexAllowed = false;
        } else if ("double_floor_duplex".equals(buildingType)) {
            this.floors = 2;
            this.maxStoreys = 2;
            this.upperFloorAllowed = true;
            this.upperFloorWindowsAllowed = true;
            this.upperFloorBalconyAllowed = true;
            this.upperFloorRoomsAllowed = true;
            this.duplexAllowed = true;
        }
    }

    public String getBuildingType() { return buildingType; }
    public Integer getFloors() { return floors; }
    public Integer getMaxStoreys() { return maxStoreys; }
    public Boolean getUpperFloorAllowed() { return upperFloorAllowed; }
    public Boolean getUpperFloorWindowsAllowed() { return upperFloorWindowsAllowed; }
    public Boolean getUpperFloorBalconyAllowed() { return upperFloorBalconyAllowed; }
    public Boolean getUpperFloorRoomsAllowed() { return upperFloorRoomsAllowed; }
    public Boolean getDuplexAllowed() { return duplexAllowed; }
}
