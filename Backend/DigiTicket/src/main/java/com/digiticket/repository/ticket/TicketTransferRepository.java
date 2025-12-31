package com.digiticket.repository.ticket;

import com.digiticket.domain.ticket.TicketTransfer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketTransferRepository extends JpaRepository<TicketTransfer, Long> {
}
