package com.digiticket.controller.history;

import com.digiticket.dto.order.HistoryPurchaseDTO;
import com.digiticket.dto.order.PurchaseDTO;
import com.digiticket.service.order.PurchaseService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseHistoryController {

    private final PurchaseService purchaseService;

    public PurchaseHistoryController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    /**
     * GET: Historial de compras de un cliente (paginado)
     * Devuelve un wrapper serializable para evitar problemas con Page en JSON.
     */
    @GetMapping("/history")
    public ResponseEntity<PageResponse<HistoryPurchaseDTO>> getClientPurchaseHistory(
            @RequestParam(name = "clientId") Integer clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<HistoryPurchaseDTO> historyPage =
                purchaseService.getPurchaseHistoryByClient(clientId, page, size);

        // Convertimos Page a wrapper serializable
        PageResponse<HistoryPurchaseDTO> response = new PageResponse<>(
                historyPage.getContent(),
                historyPage.getNumber(),
                historyPage.getSize(),
                historyPage.getTotalElements(),
                historyPage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * GET: Detalle de una compra por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(purchaseService.getPurchaseById(id));
    }

    // Clase interna para serializar Page
    public static record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}
}
