package com.digiticket.service.impl.reservation;

import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.reservation.ReservationHold;
import com.digiticket.domain.reservation.ReservationStatus;
import com.digiticket.repository.event.EventZoneRepository;
import com.digiticket.repository.reservation.ReservationHoldRepository;
import com.digiticket.service.reservation.ReservationService;
import com.digiticket.service.settings.SettingsService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReservationServiceImpl implements ReservationService {

    private final EntityManager em;
    private final JdbcTemplate jdbc;
    private final EventZoneRepository eventZoneRepo;
    private final ReservationHoldRepository holdRepo;
    private final SettingsService settingsService;

    public ReservationServiceImpl(EntityManager em,
                                  JdbcTemplate jdbc,
                                  EventZoneRepository eventZoneRepo,
                                  ReservationHoldRepository holdRepo,
                                  SettingsService settingsService) {
        this.em = em;
        this.jdbc = jdbc;
        this.eventZoneRepo = eventZoneRepo;
        this.holdRepo = holdRepo;
        this.settingsService = settingsService;
    }

    /**
     * Crea 1 hold por cada cart_item del carrito.
     * - Si hay cupo: PENDING con expires_at = now + ttl
     * - Si no hay cupo: WAITING (no bloquea stock)
     *
     * IDEMPOTENCIA: Antes de crear holds, expira los holds anteriores (PENDING/WAITING)
     * del mismo usuario para los mismos cartItemIds. Así evitamos duplicados cuando
     * el usuario modifica qty o vuelve a llamar ensureHold.
     *
     * Nota: usamos bloqueo pesimista por zona para evitar sobre-venta.
     */
    @Override
    @Transactional
    public Integer placeHold(Integer userId, Integer cartId) {

        // 1) Leer los items del carrito (sin crear repos nuevos)
        List<CartItemRow> items = jdbc.query(
                """
                SELECT ci.id, ci.event_id, ci.event_zone_id, ci.qty
                FROM cart_item ci
                WHERE ci.cart_id = ?
                """,
                (rs, rowNum) -> mapCartItem(rs),
                cartId
        );

        if (items.isEmpty()) {
            throw new RuntimeException("El carrito está vacío: cartId=" + cartId);
        }

        Integer lastHoldId = null;
        LocalDateTime now = LocalDateTime.now();

        int ttlMinutes = getCurrentTtlMinutes();
        LocalDateTime expiresAt = now.plusMinutes(ttlMinutes);

        // 2) LIMPIEZA: Expirar holds anteriores del usuario para estos cart_item_ids
        List<Long> cartItemIds = items.stream()
                .map(CartItemRow::id)
                .collect(Collectors.toList());

        List<ReservationHold> oldHolds = holdRepo.findByUserAndCartItemIds(userId, cartItemIds);
        if (!oldHolds.isEmpty()) {
            List<Integer> oldHoldIds = oldHolds.stream()
                    .map(ReservationHold::getId)
                    .collect(Collectors.toList());
            int expired = holdRepo.expireByIds(oldHoldIds);
            // Log opcional: System.out.println("Expirados " + expired + " holds antiguos para evitar duplicados");
        }

        // 3) Por cada item del carrito, intentamos reservar en su zona
        for (CartItemRow it : items) {

            // 3.1) Bloqueo pesimista de la fila de EventZone (equivalente a SELECT ... FOR UPDATE)
            EventZone zone = em.find(EventZone.class, it.eventZoneId(), LockModeType.PESSIMISTIC_WRITE);
            if (zone == null) {
                throw new RuntimeException("event_zone no existe: " + it.eventZoneId());
            }

            // 3.2) Calcular disponibilidad actual (solo restan PENDING vigentes)
            int holdsActivos = holdRepo.sumPendingActiveQtyByZone(it.eventZoneId(), now);
            int available = zone.getSeatsQuota() - zone.getSeatsSold() - holdsActivos;

            // 3.3) Crear el hold según disponibilidad
            ReservationHold hold = ReservationHold.builder()
                    .userId(userId)
                    .eventId(it.eventId())
                    .eventZoneId(it.eventZoneId())
                    .cartItemId(it.id())     // BIGINT en BD => Long aquí
                    .qty(it.qty())
                    .status(available >= it.qty() ? ReservationStatus.PENDING : ReservationStatus.WAITING)
                    .expiresAt(available >= it.qty() ? expiresAt : null)
                    .createdAt(now)
                    .build();

            if (hold.getStatus() == ReservationStatus.WAITING) {
                // Asignar posición FIFO: tamaño actual de la cola + 1
                int position = holdRepo.findWaitingFIFOByZone(it.eventZoneId()).size() + 1;
                hold.setPosition(position);
            }

            ReservationHold saved = holdRepo.save(hold);
            lastHoldId = saved.getId();
        }

        return lastHoldId; // luego puedes cambiarlo a un "groupId"
    }

    @Override
    public int getCurrentTtlMinutes() {
        return settingsService.getReservationHoldTtlMinutes();
    }

    /**
     * CONFIRMAR: pago aprobado.
     * - Toma todos los holds PENDING del usuario para los items de ese cart
     * - Incrementa seats_sold por zona con la suma de qty
     * - Marca holds -> CONFIRMED
     */
    @Override
    @Transactional
    public void confirmHold(Integer userId, Integer cartId) {
        LocalDateTime now = LocalDateTime.now();

        // 1) Traer holds PENDING y vigentes del usuario que pertenecen a cartId
        List<HoldRow> holds = jdbc.query(
                """
                SELECT rh.id, rh.event_zone_id, rh.qty
                FROM reservation_hold rh
                JOIN cart_item ci ON ci.id = rh.cart_item_id
                WHERE ci.cart_id = ?
                  AND rh.user_id = ?
                  AND rh.status = 'PENDING'
                  AND rh.expires_at > ?
                """,
                (rs, n) -> new HoldRow(rs.getInt("id"), rs.getInt("event_zone_id"), rs.getInt("qty")),
                cartId, userId, now
        );

        if (holds.isEmpty()) {
            // nada que confirmar; según política, puedes lanzar excepción si quieres
            return;
        }

        // 2) Agrupar por zona y sumar qty
        Map<Integer, Integer> qtyByZone = holds.stream()
                .collect(Collectors.groupingBy(HoldRow::eventZoneId, Collectors.summingInt(HoldRow::qty)));

        // 3) Por cada zona: lock, incrementar seats_sold
        for (Map.Entry<Integer, Integer> e : qtyByZone.entrySet()) {
            Integer zoneId = e.getKey();
            Integer qtySum = e.getValue();

            EventZone zone = em.find(EventZone.class, zoneId, LockModeType.PESSIMISTIC_WRITE);
            if (zone == null) throw new RuntimeException("event_zone no existe: " + zoneId);

            zone.setSeatsSold(zone.getSeatsSold() + qtySum);
            // em.merge(zone); // no necesario si zone está manejado
        }

        // 4) Marcar holds como CONFIRMED (en lote)
        List<Integer> ids = holds.stream().map(HoldRow::id).toList();
        String inClause = ids.stream().map(i -> "?").collect(Collectors.joining(","));
        jdbc.update("UPDATE reservation_hold SET status='CONFIRMED' WHERE id IN (" + inClause + ")", ids.toArray());
    }

    /**
     * RELEASE: pago rechazado/cancelado.
     * - Toma todos los holds PENDING (vigentes o no) del usuario/cart
     * - Los marca -> EXPIRED
     * - NO toca seats_sold
     */
    @Override
    @Transactional
    public void releaseHold(Integer userId, Integer cartId) {
        // Simple y directo via SQL (evitamos cargar todas las entidades si no hace falta)
        jdbc.update("""
            UPDATE reservation_hold rh
            JOIN cart_item ci ON ci.id = rh.cart_item_id
            SET rh.status='EXPIRED'
            WHERE ci.cart_id = ?
              AND rh.user_id = ?
              AND rh.status = 'PENDING'
            """, cartId, userId);
    }

    /**
     * Expira PENDING vencidos y promueve 1 WAITING por zona si ahora hay espacio.
     * Devuelve cuántos registros cambió (expirados + promovidos).
     */
    @Override
    @Transactional
    public int expireAndPromote() {
        int changed = 0;
        LocalDateTime now = LocalDateTime.now();

        // 1) Expirar PENDING vencidos
        changed += holdRepo.expireDuePending(now);

        // 2) Zonas con WAITING
        List<Integer> zonesWithWaiting = jdbc.query("""
                SELECT DISTINCT event_zone_id
                FROM reservation_hold
                WHERE status = 'WAITING'
                """, (rs, n) -> rs.getInt(1));

        // 3) Intentar promover 1 por zona (FIFO)
        for (Integer zoneId : zonesWithWaiting) {
            changed += promoteOneWaitingIfFits(zoneId, now);
        }

        return changed;
    }

    @Override
    public boolean hasActiveHold(Integer userId, Integer cartId) {
        LocalDateTime now = LocalDateTime.now();

        Integer count=jdbc.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM reservation_hold rh
                        JOIN cart_item ci ON ci.id = rh.cart_item_id
                        WHERE ci.cart_id = ?
                          AND rh.user_id = ?
                          AND rh.status = 'PENDING'
                          AND rh.expires_at > ?
                        """,
                Integer.class, cartId, userId, now
        );
        return count != null && count > 0;

    }

    // ---- Helpers ----

    private int promoteOneWaitingIfFits(Integer zoneId, LocalDateTime now) {
        // Lock zona
        EventZone zone = em.find(EventZone.class, zoneId, LockModeType.PESSIMISTIC_WRITE);
        if (zone == null) return 0;

        int holdsActivos = holdRepo.sumPendingActiveQtyByZone(zoneId, now);
        int available = zone.getSeatsQuota() - zone.getSeatsSold() - holdsActivos;
        if (available <= 0) return 0;

        // Primer WAITING FIFO
        List<ReservationHold> waitingList = holdRepo.findWaitingFIFOByZone(zoneId);
        if (waitingList.isEmpty()) return 0;

        ReservationHold first = waitingList.get(0);
        if (first.getQty() <= available) {
            int ttlMinutes = getCurrentTtlMinutes();

            first.setStatus(ReservationStatus.PENDING);
            first.setExpiresAt(now.plusMinutes(ttlMinutes));
            first.setPromotedAt(now);
            holdRepo.save(first);
            return 1;
        }
        return 0;
    }

    private static CartItemRow mapCartItem(ResultSet rs) throws SQLException {
        return new CartItemRow(
                rs.getLong("id"),
                rs.getInt("event_id"),
                rs.getInt("event_zone_id"),
                rs.getInt("qty")
        );
    }



    // Proyección simple del cart_item para no crear más clases por ahora.
    private record CartItemRow(Long id, Integer eventId, Integer eventZoneId, Integer qty) {}
    private record HoldRow(Integer id, Integer eventZoneId, Integer qty) {}
}
