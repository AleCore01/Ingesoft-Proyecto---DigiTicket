package com.digiticket.service.impl.purchase;

import com.digiticket.domain.order.OrderStatus;
import com.digiticket.dto.purchase.PurchaseLimitInfoDTO;
import com.digiticket.exception.TicketLimitExceededException;
import com.digiticket.repository.order.OrderItemRepository;
import com.digiticket.repository.ticket.TicketRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.service.purchase.PurchaseLimitService;
import com.digiticket.service.settings.SettingsService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class PurchaseLimitServiceImpl implements PurchaseLimitService {

    private final OrderItemRepository orderItemRepo;
    private final TicketRepository ticketRepository;
    private final ClientRepository clientRepository;
    private final SettingsService settingsService;

    public PurchaseLimitServiceImpl(OrderItemRepository orderItemRepo, 
                                    TicketRepository ticketRepository,
                                    ClientRepository clientRepository,
                                    SettingsService settingsService) {
        this.orderItemRepo = orderItemRepo;
        this.ticketRepository = ticketRepository;
        this.clientRepository = clientRepository;
        this.settingsService = settingsService;
    }

    @Override
    public PurchaseLimitInfoDTO getLimitInfo(Integer userId, Integer eventId) {
        // Convertir userId a clientId
        var client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Cliente no encontrado para el usuario " + userId));
        
        Integer clientId = client.getId();
        
        // Contar tickets reales que posee el cliente (incluye comprados y recibidos por transferencia)
        Integer alreadyPurchased = ticketRepository.countByOwnerAndEvent(clientId, eventId);

        if (alreadyPurchased == null) {
            alreadyPurchased = 0;
        }

        int max = settingsService.getMaxTicketsPerPurchase();

        Integer remaining = max - alreadyPurchased;
        if (remaining < 0) {
            remaining = 0;
        }

        return new PurchaseLimitInfoDTO(
                userId,
                eventId,
                max,
                alreadyPurchased,
                remaining
        );
    }

    @Override
    public void validateLimitOrThrow(Integer userId, Integer eventId, Integer requestedQty) {
        PurchaseLimitInfoDTO info = getLimitInfo(userId, eventId);

        if (requestedQty > info.remaining()) {
            throw new TicketLimitExceededException(
                    eventId,
                    info.maxTicketsPerUser(),
                    info.alreadyPurchased(),
                    requestedQty
            );
        }
    }
}
