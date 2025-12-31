package com.digiticket.service.reservation;

import java.time.Instant;

public interface ReservationService {

    /**
     * Intenta reservar (por cada cart_item del carrito del usuario)
     * usando el TTL configurado en el sistema.
     */
    Integer placeHold(Integer userId, Integer cartId);

    /** TTL actual configurado (en minutos). */
    int getCurrentTtlMinutes();

    /** Confirma los holds del carrito/usuario cuando el pago fue aprobado. */
    void confirmHold(Integer userId, Integer cartId);

    /** Libera (expira) los holds del carrito/usuario cuando el pago fue rechazado/cancelado. */
    void releaseHold(Integer userId, Integer cartId);

    /** Expira en lote los PENDING vencidos y promueve WAITING si hay espacio. */
    int expireAndPromote();

    /** Calcula el instante de expiración usando el TTL configurado. */
    default Instant computeExpiry() {
        return Instant.now().plusSeconds(getCurrentTtlMinutes() * 60L);
    }

    /** Se verifica si este Hold está activo en este momento. */
    boolean hasActiveHold(Integer userId, Integer cartId);
}
