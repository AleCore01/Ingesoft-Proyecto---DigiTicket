package com.digiticket.repository.event;

import com.digiticket.domain.event.EventCategory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class EventCategoryRepositoryTest {

    @Autowired
    EventCategoryRepository repo;

    @Test
    void save_and_findById() {
        EventCategory c = EventCategory.builder()
                .name("Rock")
                .build();

        EventCategory saved = repo.save(c);

        assertThat(saved.getId()).isNotNull();
        assertThat(repo.findById(saved.getId())).isPresent();
    }

    @Test
    void findAll_returns_items() {
        repo.save(EventCategory.builder().name("Pop").build());
        repo.save(EventCategory.builder().name("Jazz").build());

        List<EventCategory> all = repo.findAll();

        assertThat(all).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void deleteById_removes_row() {
        EventCategory c = repo.save(EventCategory.builder().name("Indie").build());
        Integer id = c.getId();

        repo.deleteById(id);

        assertThat(repo.findById(id)).isNotPresent();
    }
}
