package com.digiticket.service.purchase;

import com.digiticket.dto.purchase.PurchaseLimitInfoDTO;

public interface PurchaseLimitService {
    /**
     * Obtiene la información del límite de compra para un usuario y evento específico.
     */
    PurchaseLimitInfoDTO getLimitInfo(Integer userId, Integer eventId);

    /**
     * Valida que el usuario no exceda el límite de compra para el evento.
     * @throws com.digiticket.exception.TicketLimitExceededException si se excede el límite
     */
    void validateLimitOrThrow(Integer userId, Integer eventId, Integer requestedQty);
}
