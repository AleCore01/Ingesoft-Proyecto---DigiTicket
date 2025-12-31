package com.digiticket.dto.auth;

public record LoginResponse(
        String token,
        Integer id,
        String role,
        String name) {}