package com.digiticket.service.ticket;

import com.digiticket.domain.ticket.Ticket;

public interface TicketTransferService {
    Ticket transfer(Integer ticketId, Integer performedByUserId, Integer toClientId, String reason);
}
