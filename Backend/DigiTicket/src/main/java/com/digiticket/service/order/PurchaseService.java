package com.digiticket.service.order;

import com.digiticket.dto.order.HistoryPurchaseDTO;
import com.digiticket.dto.order.PurchaseDTO;
import org.springframework.data.domain.Page;

public interface PurchaseService {

    /**
     * Obtiene el historial de compras de un cliente.
     *
     * @param clientId ID del cliente
     * @param page Número de página (0 = primera página)
     * @param size Tamaño de página
     * @return Página de HistoryPurchaseDTO
     */
    Page<HistoryPurchaseDTO> getPurchaseHistoryByClient(Integer clientId, int page, int size);

    PurchaseDTO getPurchaseById(Integer purchaseId);
}
