package com.digiticket.service.user;

import com.digiticket.domain.user.User;

import java.util.Optional;

public interface UserService {
    boolean emailExists(String email);
    Optional<User> findByEmail(String email);
    User save(User user);
}

