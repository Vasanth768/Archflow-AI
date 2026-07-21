package com.archflow.server.controller;

import com.archflow.server.model.Project;
import com.archflow.server.repository.ProjectRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // GET: Retrieve all projects formatted as clean JSON
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllProjects() {
        List<Project> dbProjects = projectRepository.findAll();
        
        List<Map<String, Object>> response = dbProjects.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("client", p.getClient());
            map.put("type", p.getType());
            map.put("location", p.getLocation());
            map.put("width", p.getWidth());
            map.put("length", p.getLength());
            map.put("area", p.getArea());
            map.put("facing", p.getFacing());
            map.put("corner", p.getCorner());
            map.put("road", p.getRoad());
            map.put("floors", p.getFloors());
            map.put("bedrooms", p.getBedrooms());
            map.put("bathrooms", p.getBathrooms());
            map.put("kitchen", p.getKitchen());
            map.put("pooja", p.getPooja());
            map.put("parking", p.getParking());
            map.put("balcony", p.getBalcony());
            map.put("style", p.getStyle());
            map.put("budget", p.getBudget());
            map.put("prompt", p.getPrompt());
            map.put("createdAt", p.getCreatedAt());
            map.put("lastUpdated", p.getLastUpdated());
            map.put("status", p.getStatus());
            map.put("selectedStyle", p.getSelectedStyle());

            // Deserialize CLOB JSON strings back into objects/arrays
            try {
                if (p.getMaterials() != null) {
                    map.put("materials", objectMapper.readValue(p.getMaterials(), Map.class));
                } else {
                    map.put("materials", Collections.emptyMap());
                }
            } catch (Exception e) {
                map.put("materials", Collections.emptyMap());
            }

            try {
                if (p.getRooms() != null) {
                    map.put("rooms", objectMapper.readValue(p.getRooms(), List.class));
                } else {
                    map.put("rooms", Collections.emptyList());
                }
            } catch (Exception e) {
                map.put("rooms", Collections.emptyList());
            }

            try {
                if (p.getVariations() != null) {
                    map.put("variations", objectMapper.readValue(p.getVariations(), List.class));
                } else {
                    map.put("variations", Collections.emptyList());
                }
            } catch (Exception e) {
                map.put("variations", Collections.emptyList());
            }

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // POST: Synchronize and persist full project list state
    @PostMapping
    public ResponseEntity<String> saveProjects(@RequestBody List<Map<String, Object>> incomingProjects) {
        // Collect all IDs that must be kept
        Set<String> incomingIds = incomingProjects.stream()
                .map(p -> (String) p.get("id"))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Delete from database any project not present in incoming list
        List<Project> existing = projectRepository.findAll();
        for (Project p : existing) {
            if (!incomingIds.contains(p.getId())) {
                projectRepository.delete(p);
            }
        }

        // Map and save each incoming project
        for (Map<String, Object> map : incomingProjects) {
            String id = (String) map.get("id");
            if (id == null) continue;

            Project p = projectRepository.findById(id).orElse(new Project());
            p.setId(id);
            p.setName((String) map.get("name"));
            p.setClient((String) map.get("client"));
            p.setType((String) map.get("type"));
            p.setLocation((String) map.get("location"));
            
            p.setWidth((Integer) map.get("width"));
            p.setLength((Integer) map.get("length"));
            p.setArea((Integer) map.get("area"));
            p.setFacing((String) map.get("facing"));
            p.setCorner((Boolean) map.get("corner"));
            p.setRoad((String) map.get("road"));
            
            p.setFloors((Integer) map.get("floors"));
            p.setBedrooms((Integer) map.get("bedrooms"));
            p.setBathrooms((Integer) map.get("bathrooms"));
            p.setKitchen((Integer) map.get("kitchen"));
            p.setPooja((Boolean) map.get("pooja"));
            p.setParking((Boolean) map.get("parking"));
            p.setBalcony((Boolean) map.get("balcony"));
            
            p.setStyle((String) map.get("style"));
            p.setBudget((String) map.get("budget"));
            p.setPrompt((String) map.get("prompt"));
            
            p.setCreatedAt((String) map.get("createdAt"));
            p.setLastUpdated((String) map.get("lastUpdated"));
            p.setStatus((String) map.get("status"));
            p.setSelectedStyle((String) map.get("selectedStyle"));

            // Serialize objects/arrays to JSON strings
            try {
                p.setMaterials(objectMapper.writeValueAsString(map.get("materials")));
            } catch (Exception e) {
                p.setMaterials("{}");
            }

            try {
                p.setRooms(objectMapper.writeValueAsString(map.get("rooms")));
            } catch (Exception e) {
                p.setRooms("[]");
            }

            try {
                p.setVariations(objectMapper.writeValueAsString(map.get("variations")));
            } catch (Exception e) {
                p.setVariations("[]");
            }

            projectRepository.save(p);
        }

        return ResponseEntity.ok("Successfully synced and persisted projects database state.");
    }
}
