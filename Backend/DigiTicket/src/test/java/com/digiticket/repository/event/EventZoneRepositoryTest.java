package com.digiticket.repository.event;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventCategory;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.domain.location.LocationZone;
import com.digiticket.domain.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class EventZoneRepositoryTest {

    @Autowired
    TestEntityManager em;

    @Autowired
    EventZoneRepository repo;

    Administrator adm;
    Location loc;
    EventCategory cat;
    Event ev;
    LocationZone zl;
    LocationZone zm;

    @BeforeEach
    void init() {
        loc = location();
        cat = category("Conciertos");
        adm = admin("admin@acme.com");
        ev = event(loc, cat, adm, "Show", EventStatus.DRAFT, LocalDateTime.now().plusDays(5));
        zl = locationZone(loc, "Platea", 100);
        zm = locationZone(loc, "Mezzanine", 50);

        em.flush();
    }

    private Event event(Location loc, EventCategory cat, Administrator adm,
                        String title, EventStatus status, LocalDateTime startsAt) {
        var e = new Event();
        e.setTitle(title);
        e.setDescription("Concierto");
        e.setStartsAt(startsAt);
        e.setSalesStartAt(LocalDateTime.now().plusDays(1));
        e.setDurationMin(120);
        e.setLocation(loc);
        e.setEventCategory(cat);
        e.setAdministrator(adm);
        e.setStatus(status);
        return em.persist(e);
    }

    private User user(String email) {
        var u = new User();
        u.setFirstName("Ana");
        u.setLastName("Admin");
        u.setEmail(email);
        u.setPassword("$2a$10$hashdummy");
        u.setDocumentType(DocumentType.DNI);
        u.setDocumentNumber("12345678");
        u.setTermsAccepted(true);
        u.setStatus(UserStatus.ACTIVE);
        u.setRoleUser(RoleUser.ADMIN);
        return em.persist(u);
    }

    private Administrator admin(String email) {
        var a = new Administrator();
        a.setUser(user(email));
        a.setRole(RoleAdmin.ADMIN);
        return em.persist(a);
    }

    private Location location() {
        var l = Location.builder()
                .name("Teatro Central")
                .contactEmail("contacto@teatro.com")
                .address("Av. Siempre Viva 123")
                .city("Lima")
                .district("Miraflores")
                .capacity(500)
                .status(LocationStatus.ACTIVE)
                .build();
        return em.persist(l);
    }

    private EventCategory category(String name) {
        var c = EventCategory.builder()
                .name(name)
                .build();
        return em.persist(c);
    }

    private LocationZone locationZone(Location loc, String name, int capacity) {
        var z = LocationZone.builder()
                .location(loc)
                .name(name)
                .capacity(capacity)
                .status(LocationStatus.ACTIVE)
                .build();
        return em.persist(z);
    }

    private EventZone ez(Event ev, LocationZone z, String name, BigDecimal price, int quota, int sold) {
        var e = EventZone.builder()
                .event(ev)
                .locationZone(z)
                .displayName(name)
                .price(price)
                .seatsQuota(quota)
                .seatsSold(sold)
                .status(EventZone.Status.ACTIVE)
                .build();
        return em.persist(e);
    }

    @Test
    void findByEvent_Id_returns_list() {
        ez(ev, zl, "Platea A", new BigDecimal("120.00"), 100, 10);
        ez(ev, zm, "Mezz B", new BigDecimal("80.00"), 50, 5);
        em.flush();

        List<EventZone> list = repo.findByEvent_Id(ev.getId());

        assertThat(list).hasSize(2);
        assertThat(list).allMatch(z -> z.getEvent().getId().equals(ev.getId()));
    }

    @Test
    void findFirstByEvent_IdAndLocationZone_Id_found() {
        EventZone created = ez(ev, zl, "Platea A", new BigDecimal("120.00"), 100, 10);
        em.flush();

        Optional<EventZone> opt = repo.findFirstByEvent_IdAndLocationZone_Id(ev.getId(), zl.getId());

        assertThat(opt).isPresent();
        assertThat(opt.get().getId()).isEqualTo(created.getId());
    }

    @Test
    void findFirstByEvent_IdAndLocationZone_Id_not_found() {
        Optional<EventZone> opt = repo.findFirstByEvent_IdAndLocationZone_Id(999, 888);

        assertThat(opt).isEmpty();
    }
}
