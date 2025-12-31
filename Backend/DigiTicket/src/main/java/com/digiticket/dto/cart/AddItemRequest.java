package com.digiticket.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddItemRequest(
        @NotNull Integer eventId,
        @NotNull Integer eventZoneId,
        @NotNull @Min(1) Integer qty
) {}
