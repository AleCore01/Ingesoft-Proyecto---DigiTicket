package com.digiticket.repository.order;

import com.digiticket.domain.order.IdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey,Integer> {
    Optional<IdempotencyKey> findByKeyAndUserId(String key, Integer userId);

    Optional<IdempotencyKey> findByKey(String key);
}
