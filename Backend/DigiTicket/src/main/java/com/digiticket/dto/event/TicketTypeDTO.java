package com.digiticket.dto.event;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO para exponer información de tipos de ticket con stock disponible.
 * Solo lectura - no incluye métodos para crear o modificar tickets.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTypeDTO {
    
    private Integer id;
    private Integer eventId;
    private String name;
    private BigDecimal price;
    private Integer stock;
    private Integer availableStock;
}
