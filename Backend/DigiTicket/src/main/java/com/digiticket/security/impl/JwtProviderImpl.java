package com.digiticket.security.impl;

import com.digiticket.security.JwtProvider;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtProviderImpl implements JwtProvider {

    private final SecretKey key;
    private final long ttlMillis; // p.ej. 900000 = 15 min

    public JwtProviderImpl(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.ttlMillis:900000}") long ttlMillis) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMillis = ttlMillis;
    }

    @Override
    public String generateToken(Integer userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))   // sub
                .claim("role", role)               // autorización
                .issuedAt(Date.from(now))          // iat
                .expiration(Date.from(now.plusMillis(ttlMillis))) // exp
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }
}
