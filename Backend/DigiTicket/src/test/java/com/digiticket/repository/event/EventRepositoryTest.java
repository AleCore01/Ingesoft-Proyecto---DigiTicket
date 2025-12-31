package com.digiticket.repository.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventCategory;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class EventRepositoryTest {

    @Autowired
    EventRepository repo;

    @Autowired
    TestEntityManager em;

    Administrator adm;
    Location loc;
    EventCategory cat;

    @BeforeEach
    void setUp() {
        adm = admin();
        loc = location();
        cat = category("Conciertos");
        em.flush();
    }

    private User userAdmin() {
        var u = new User();
        u.setFirstName("Ana");
        u.setLastName("Admin");
        u.setEmail("admin@acme.com");
        u.setPassword("$2a$10$hashdummy");
        u.setDocumentType(DocumentType.DNI);
        u.setDocumentNumber("12345678");
        u.setTermsAccepted(true);
        u.setStatus(UserStatus.ACTIVE);
        u.setRoleUser(RoleUser.ADMIN);
        return em.persist(u);
    }

    private Administrator admin() {
        var u = userAdmin();
        var a = new Administrator();
        a.setUser(u);
        a.setRole(RoleAdmin.ADMIN);
        return em.persist(a);
    }

    private Location location() {
        var l = Location.builder()
                .name("Coliseo")
                .contactEmail("coliseo@acme.com")
                .address("Av. 123")
                .city("Lima")
                .district("Miraflores")
                .capacity(5000)
                .build();
        return em.persist(l);
    }

    private EventCategory category(String name) {
        var c = EventCategory.builder()
                .name(name)
                .build();
        return em.persist(c);
    }

    private Event event(String title, EventStatus status, LocalDateTime startsAt) {
        var e = Event.builder()
                .title(title)
                .description("desc")
                .startsAt(startsAt)
                .salesStartAt(startsAt.minusDays(5))
                .durationMin(90)
                .location(loc)
                .eventCategory(cat)
                .administrator(adm)
                .status(status)
                .build();
        return em.persist(e);
    }

    @Test
    void save_and_findById() {
        Event e = event("Rock Fest", EventStatus.DRAFT, LocalDateTime.now().plusDays(10));
        em.flush();

        assertThat(e.getId()).isNotNull();
        assertThat(repo.findById(e.getId())).isPresent();
    }

    @Test
    void findByStatus() {
        event("A", EventStatus.DRAFT, LocalDateTime.now().plusDays(1));
        event("B", EventStatus.PUBLISHED, LocalDateTime.now().plusDays(2));
        em.flush();

        List<Event> drafts = repo.findByStatus(EventStatus.DRAFT);

        assertThat(drafts)
                .isNotEmpty()
                .extracting(Event::getStatus)
                .containsOnly(EventStatus.DRAFT);
    }

    @Test
    void findByTitleContainingIgnoreCase() {
        event("Rock Lima", EventStatus.DRAFT, LocalDateTime.now().plusDays(3));
        event("Pop Night", EventStatus.DRAFT, LocalDateTime.now().plusDays(4));
        em.flush();

        List<Event> rock = repo.findByTitleContainingIgnoreCase("rock");

        assertThat(rock)
                .isNotEmpty()
                .allMatch(ev -> ev.getTitle().toLowerCase().contains("rock"));
    }

    @Test
    void findByStartsAtBetween() {
        var t1 = LocalDateTime.now().plusDays(3);
        var t2 = LocalDateTime.now().plusDays(7);

        event("X", EventStatus.DRAFT, t1.plusHours(1));   // dentro
        event("Y", EventStatus.DRAFT, t2.plusDays(5));    // fuera
        em.flush();

        List<Event> win = repo.findByStartsAtBetween(t1, t2);

        assertThat(win)
                .extracting(Event::getTitle)
                .contains("X")
                .doesNotContain("Y");
    }

    @Test
    void findByLocationId() {
        event("LocEvt", EventStatus.DRAFT, LocalDateTime.now().plusDays(5));
        em.flush();

        List<Event> byLoc = repo.findByLocationId(loc.getId());

        assertThat(byLoc).isNotEmpty();
        assertThat(byLoc).allMatch(e -> e.getLocation().getId().equals(loc.getId()));
    }

    @Test
    void findByLocationIdAndStartsAtBetween() {
        var from = LocalDateTime.now().plusDays(1);
        var to = LocalDateTime.now().plusDays(10);

        event("InRange", EventStatus.DRAFT, LocalDateTime.now().plusDays(5));   // dentro
        event("OutRange", EventStatus.DRAFT, LocalDateTime.now().plusDays(20)); // fuera
        em.flush();

        var list = repo.findByLocationIdAndStartsAtBetween(loc.getId(), from, to);

        assertThat(list)
                .extracting(Event::getTitle)
                .contains("InRange")
                .doesNotContain("OutRange");
    }
}
