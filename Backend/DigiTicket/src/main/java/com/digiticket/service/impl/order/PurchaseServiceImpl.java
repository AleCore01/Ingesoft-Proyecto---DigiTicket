package com.digiticket.service.impl.order;

import com.digiticket.domain.order.Purchase;
import com.digiticket.dto.order.HistoryPurchaseDTO;
import com.digiticket.dto.order.PurchaseDTO;
import com.digiticket.repository.order.PurchaseRepository;
import com.digiticket.service.order.PurchaseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository purchaseRepository;

    public PurchaseServiceImpl(PurchaseRepository purchaseRepository) {
        this.purchaseRepository = purchaseRepository;
    }

    // ---------- LISTADO DEL HISTORIAL ----------
    @Override
    public Page<HistoryPurchaseDTO> getPurchaseHistoryByClient(Integer clientId, int page, int size) {

        if (clientId == null) {
            throw new IllegalArgumentException("clientId cannot be null");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return purchaseRepository
                .findByClientIdOrderByCreatedAtDesc(clientId, pageable)
                .map(this::toDto);
    }

    // ---------- DETALLE ----------
    @Override
    public PurchaseDTO getPurchaseById(Integer id) {

        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Purchase no encontrada con id " + id
                ));

        return mapToPurchaseDTO(purchase);
    }

    // ---------- MAPPER PARA HISTORIAL ----------
    private HistoryPurchaseDTO toDto(Purchase purchase) {
        return new HistoryPurchaseDTO(
                purchase.getId(),
                purchase.getTotalQuantity(),
                purchase.getTotalAmount().doubleValue(),
                purchase.getPaymentMethod().name(),
                purchase.getStatus() != null ? purchase.getStatus().name() : null,
                purchase.getCreatedAt(),
                purchase.getEvent() != null ? purchase.getEvent().getId() : null,
                purchase.getEvent() != null ? purchase.getEvent().getTitle() : null,
                purchase.getEvent() != null ? purchase.getEvent().getStartsAt() : null
        );
    }

    // ---------- MAPPER PARA DETALLE ----------
    private PurchaseDTO mapToPurchaseDTO(Purchase purchase) {
        return new PurchaseDTO(
                purchase.getId(),
                purchase.getClient() != null ? purchase.getClient().getId() : null,
                purchase.getEvent() != null ? purchase.getEvent().getId() : null,
                purchase.getTotalQuantity(),
                purchase.getTotalAmount() != null ? purchase.getTotalAmount().doubleValue() : null,
                purchase.getPaymentMethod().name(),
                purchase.getStatus() != null ? purchase.getStatus().name() : null,
                purchase.getCreatedAt()
        );
    }

}
