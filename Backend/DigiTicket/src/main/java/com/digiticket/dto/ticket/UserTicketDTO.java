package com.digiticket.dto.ticket;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserTicketDTO(
        Integer id,
        Integer orderId,
        Integer eventId,
        String eventTitle,
        String zoneName,
        BigDecimal price,
        LocalDateTime purchaseDate,
        String status,
        LocalDateTime eventDate,
        String eventLocation,
        String eventAddress,
        Integer ownerClientId,
        Integer transferCount,
        String ticketUrl,
        Boolean isPresale
) {}
