package com.digiticket.dto.auth;

public record ClientRegisterResponse(
        String toke,
        Integer id,
        String role,
        String name) {}
