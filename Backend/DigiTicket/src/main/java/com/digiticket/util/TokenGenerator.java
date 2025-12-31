package com.digiticket.util;

import java.security.SecureRandom;

public class TokenGenerator {
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    private TokenGenerator() {}

    public static String generateAlphanumeric(int length) {
        StringBuilder token = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(ALPHANUMERIC.length());
            token.append(ALPHANUMERIC.charAt(index));
        }
        return token.toString();
    }
}
