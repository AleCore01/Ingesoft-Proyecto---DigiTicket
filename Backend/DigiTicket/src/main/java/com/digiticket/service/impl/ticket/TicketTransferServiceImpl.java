package com.digiticket.service.impl.ticket;

import com.digiticket.domain.ticket.Ticket;
import com.digiticket.domain.ticket.TicketStatus;
import com.digiticket.domain.ticket.TicketTransfer;
import com.digiticket.domain.ticket.TicketTransferStatus;
import com.digiticket.domain.user.Client;
import com.digiticket.repository.ticket.TicketRepository;
import com.digiticket.repository.ticket.TicketTransferRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.service.settings.SettingsService;
import com.digiticket.service.ticket.TicketTransferService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class TicketTransferServiceImpl implements TicketTransferService {
    private final TicketRepository ticketRepository;
    private final TicketTransferRepository transferRepository;
    private final SettingsService settingsService;
    private final ClientRepository clientRepository;

    public TicketTransferServiceImpl(TicketRepository ticketRepository,
                                     TicketTransferRepository transferRepository,
                                     SettingsService settingsService,
                                     ClientRepository clientRepository) {
        this.ticketRepository = ticketRepository;
        this.transferRepository = transferRepository;
        this.settingsService = settingsService;
        this.clientRepository = clientRepository;
    }

    @Transactional
    public Ticket transfer(Integer ticketId, Integer performedByUserId, Integer toClientId, String reason) {
        if (performedByUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing performer user id");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket not ACTIVE");
        }
        if (toClientId == null || toClientId.equals(ticket.getOwnerClientId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid destination client");
        }

        Client ownerClient = clientRepository.findById(ticket.getOwnerClientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Owner client missing"));
        Integer ownerUserId = ownerClient.getUser() != null ? ownerClient.getUser().getId() : null;

        if (ownerUserId == null || !ownerUserId.equals(performedByUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can transfer the ticket");
        }

        int limit = settingsService.getMaxTicketTransfers();
        if (ticket.getTransferCount() + 1 > limit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer limit exceeded");
        }

        TicketTransfer tx = TicketTransfer.builder()
                .ticketId(ticket.getId())
                .fromClientId(ticket.getOwnerClientId())
                .toClientId(toClientId)
                .performedByUserId(performedByUserId)
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .status(TicketTransferStatus.COMPLETED)
                .build();
        transferRepository.save(tx);

        ticket.setOwnerClientId(toClientId);
        ticket.setTransferCount(ticket.getTransferCount() + 1);
        return ticketRepository.save(ticket);
    }
}
