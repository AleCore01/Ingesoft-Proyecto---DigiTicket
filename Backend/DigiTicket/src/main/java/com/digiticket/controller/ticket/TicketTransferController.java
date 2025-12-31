package com.digiticket.controller.ticket;

import com.digiticket.dto.ticket.UserTicketDTO;
import com.digiticket.mapper.ticket.UserTicketMapper;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.ticket.TicketTransferService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tickets")
public class TicketTransferController {
    private final TicketTransferService transferService;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
        private final UserTicketMapper mapper;

        public TicketTransferController(TicketTransferService transferService,
                                                                        UserRepository userRepository,
                                                                        ClientRepository clientRepository,
                                                                        UserTicketMapper mapper) {
        this.transferService = transferService;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
                this.mapper = mapper;
    }

        public record TransferRequest(String destinationEmail, String reason) {}

    @PostMapping("/{ticketId}/transfer")
    public ResponseEntity<UserTicketDTO> transfer(@PathVariable Integer ticketId,
                                                  @RequestBody TransferRequest body,
                                                  HttpServletRequest request) {
        Integer performedByUserId = requireUserId(request);
        var user = userRepository.findByEmail(body.destinationEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destination user not found"));
        var client = clientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destination client not found"));

        var ticket = transferService.transfer(ticketId, performedByUserId, client.getId(), body.reason());

        UserTicketDTO dto = mapper.toDto(ticket);

        return ResponseEntity.ok(dto);
    }

        private Integer requireUserId(HttpServletRequest request) {
                String raw = request.getHeader("X-User-Id");
                if (raw == null || raw.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing X-User-Id header");
                }
                try {
                        return Integer.valueOf(raw);
                } catch (NumberFormatException ex) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-User-Id must be numeric");
                }
        }
}
