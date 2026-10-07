package com.archflow.server.controller;

import com.archflow.server.dto.UserRequest;
import com.archflow.server.dto.UserResponse;
import com.archflow.server.model.User;
import com.archflow.server.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(toResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        // Encode password before saving
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Normal users are always created with USER role
        user.setRole("USER");

        return ResponseEntity.ok(
                toResponse(userRepository.save(user))
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
            @PathVariable String id,
            @RequestBody UserRequest request) {

        return userRepository.findById(id).map(user -> {

            user.setName(request.getName());
            user.setEmail(request.getEmail());

            if (request.getPassword() != null
                    && !request.getPassword().isBlank()) {

                user.setPassword(
                        passwordEncoder.encode(request.getPassword())
                );
            }

            return ResponseEntity.ok(
                    toResponse(userRepository.save(user))
            );

        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {

        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}