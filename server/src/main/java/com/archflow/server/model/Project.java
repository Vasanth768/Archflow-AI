package com.archflow.server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    private String id;
    
    private String name;
    private String client;
    private String type;
    private String location;
    
    private Integer width;
    private Integer length;
    private Integer area;
    private String facing;
    private Boolean corner;
    private String road;
    
    private Integer floors;
    private Integer bedrooms;
    private Integer bathrooms;
    private Integer kitchen;
    private Boolean pooja;
    private Boolean parking;
    private Boolean balcony;
    
    private String style;
    private String budget;
    
    @Column(columnDefinition = "CLOB")
    private String prompt;
    
    private String createdAt;
    private String lastUpdated;
    private String status;
    private String selectedStyle;
    
    @Column(columnDefinition = "CLOB")
    private String materials; // Serialized JSON string
    
    @Column(columnDefinition = "CLOB")
    private String rooms; // Serialized JSON string
    
    @Column(columnDefinition = "CLOB")
    private String variations; // Serialized JSON string

    // Constructors
    public Project() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getLength() { return length; }
    public void setLength(Integer length) { this.length = length; }

    public Integer getArea() { return area; }
    public void setArea(Integer area) { this.area = area; }

    public String getFacing() { return facing; }
    public void setFacing(String facing) { this.facing = facing; }

    public Boolean getCorner() { return corner; }
    public void setCorner(Boolean corner) { this.corner = corner; }

    public String getRoad() { return road; }
    public void setRoad(String road) { this.road = road; }

    public Integer getFloors() { return floors; }
    public void setFloors(Integer floors) { this.floors = floors; }

    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }

    public Integer getBathrooms() { return bathrooms; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }

    public Integer getKitchen() { return kitchen; }
    public void setKitchen(Integer kitchen) { this.kitchen = kitchen; }

    public Boolean getPooja() { return pooja; }
    public void setPooja(Boolean pooja) { this.pooja = pooja; }

    public Boolean getParking() { return parking; }
    public void setParking(Boolean parking) { this.parking = parking; }

    public Boolean getBalcony() { return balcony; }
    public void setBalcony(Boolean balcony) { this.balcony = balcony; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSelectedStyle() { return selectedStyle; }
    public void setSelectedStyle(String selectedStyle) { this.selectedStyle = selectedStyle; }

    public String getMaterials() { return materials; }
    public void setMaterials(String materials) { this.materials = materials; }

    public String getRooms() { return rooms; }
    public void setRooms(String rooms) { this.rooms = rooms; }

    public String getVariations() { return variations; }
    public void setVariations(String variations) { this.variations = variations; }
}
