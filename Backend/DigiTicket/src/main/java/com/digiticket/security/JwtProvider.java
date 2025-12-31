package com.digiticket.security;

public interface JwtProvider {
    String generateToken(Integer userId, String role);
}
