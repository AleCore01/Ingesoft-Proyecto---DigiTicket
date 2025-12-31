package com.digiticket.exception;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class TicketLimitExceededException extends RuntimeException {
    private final String errorCode;
    private final Map<String, Object> details;

    public TicketLimitExceededException(
            Integer eventId,
            Integer maxTicketsPerUser,
            Integer alreadyPurchased,
            Integer requested) {
        super("Solo puedes comprar " + maxTicketsPerUser + " entradas como máximo para este evento.");
        this.errorCode = "TICKET_LIMIT_EXCEEDED";
        this.details = new HashMap<>();
        this.details.put("eventId", eventId);
        this.details.put("maxTicketsPerUser", maxTicketsPerUser);
        this.details.put("alreadyPurchased", alreadyPurchased);
        this.details.put("requested", requested);
    }
}
