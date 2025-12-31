package com.digiticket.repository.cart;

import com.digiticket.domain.cart.Cart;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class CartRepositoryTest {

    @Autowired
    CartRepository repo;

    @Autowired
    TestEntityManager em;

    private Cart cart(Integer userId) {
        Cart c = new Cart();
        c.setUserId(userId);   // tu campo real
        return c;
    }

    @Test
    void save_and_findById() {
        Cart c = cart(123);
        Cart saved = repo.save(c);

        assertThat(saved.getId()).isNotNull();
        assertThat(repo.findById(saved.getId())).isPresent();
    }

    @Test
    void findAll_returns_items() {
        repo.save(cart(111));
        repo.save(cart(222));

        var all = repo.findAll();

        assertThat(all).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void deleteById_removes_row() {
        Cart c = repo.save(cart(999));
        Long id = c.getId();

        repo.deleteById(id);

        assertThat(repo.findById(id)).isNotPresent();
    }

    @Test
    void findByUserId_returns_cart() {
        Cart c = cart(321);
        em.persistAndFlush(c);

        var found = repo.findByUserId(321);

        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(321);
    }
}
