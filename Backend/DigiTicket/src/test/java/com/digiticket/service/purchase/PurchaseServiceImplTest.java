package com.digiticket.service.purchase;
import com.digiticket.domain.user.Client;
import com.digiticket.domain.event.Event;
import com.digiticket.domain.order.Purchase;
import com.digiticket.domain.order.PurchasePaymentMethod;
import com.digiticket.domain.order.PurchaseStatus;
import com.digiticket.dto.order.HistoryPurchaseDTO;
import com.digiticket.dto.order.PurchaseDTO;
import com.digiticket.repository.order.PurchaseRepository;

import com.digiticket.service.impl.order.PurchaseServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.*;

import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceImplTest {
//
    @Mock
    private PurchaseRepository purchaseRepository;

    @InjectMocks
    private PurchaseServiceImpl purchaseService;


    // ---------------------------------------------------------
    // TEST: getPurchaseById()
    // ---------------------------------------------------------
    @Test
    void testGetPurchaseById_success() {

        Client client = new Client();
        client.setId(1);

        Event event = new Event();
        event.setId(10);

        Purchase purchase = new Purchase();
        purchase.setId(100);
        purchase.setClient(client);
        purchase.setEvent(event);
        purchase.setTotalQuantity(2);
        purchase.setTotalAmount(new BigDecimal("50.00"));
        purchase.setPaymentMethod(PurchasePaymentMethod.CARD);
        purchase.setStatus(PurchaseStatus.ACTIVE);
        purchase.setCreatedAt(LocalDateTime.now());

        when(purchaseRepository.findById(100)).thenReturn(Optional.of(purchase));

        PurchaseDTO result = purchaseService.getPurchaseById(100);

        assertNotNull(result);
        assertEquals(100, result.id());
        assertEquals(1, result.clientId());
        assertEquals(10, result.eventId());
        assertEquals(2, result.totalQuantity());
        assertEquals(50.0, result.totalAmount());
        assertEquals("CARD", result.paymentMethod());
        assertEquals("ACTIVE", result.status());

        verify(purchaseRepository, times(1)).findById(100);
    }


    // ---------------------------------------------------------
    // TEST: getPurchaseById() - Not Found
    // ---------------------------------------------------------
    @Test
    void testGetPurchaseById_notFound() {

        when(purchaseRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> purchaseService.getPurchaseById(999));

        verify(purchaseRepository, times(1)).findById(999);
    }


    // ---------------------------------------------------------
    // TEST: getPurchaseHistoryByClient()
    // ---------------------------------------------------------
    @Test
    void testGetPurchaseHistoryByClient_success() {

        int clientId = 1;

        Event event = new Event();
        event.setId(50);
        event.setTitle("Mega Evento");
        event.setStartsAt(LocalDateTime.of(2025, 5, 10, 20, 0));

        Purchase purchase = new Purchase();
        purchase.setId(200);
        purchase.setEvent(event);
        purchase.setTotalQuantity(3);
        purchase.setTotalAmount(new BigDecimal("150.00"));
        purchase.setPaymentMethod(PurchasePaymentMethod.CARD);
        purchase.setStatus(PurchaseStatus.ACTIVE);
        purchase.setCreatedAt(LocalDateTime.now());

        Page<Purchase> pageMock =
                new PageImpl<>(List.of(purchase));

        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());

        when(purchaseRepository.findByClientIdOrderByCreatedAtDesc(clientId, pageable))
                .thenReturn(pageMock);

        Page<HistoryPurchaseDTO> result =
                purchaseService.getPurchaseHistoryByClient(clientId, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());

        HistoryPurchaseDTO dto = result.getContent().get(0);

        assertEquals(Integer.valueOf(200), dto.purchaseId());
        assertEquals(3, dto.totalQuantity());
        assertEquals(150.0, dto.totalAmount());
        assertEquals("CARD", dto.paymentMethod());
        assertEquals("ACTIVE", dto.status());
        assertEquals(50, dto.eventId());
        assertEquals("Mega Evento", dto.eventTitle());

        verify(purchaseRepository, times(1))
                .findByClientIdOrderByCreatedAtDesc(clientId, pageable);
    }



    // ---------------------------------------------------------
    // TEST: getPurchaseHistoryByClient() - clientId null
    // ---------------------------------------------------------
    @Test
    void testGetPurchaseHistoryByClient_clientIdNull() {
        assertThrows(IllegalArgumentException.class, () ->
                purchaseService.getPurchaseHistoryByClient(null, 0, 10)
        );

        verify(purchaseRepository, never())
                .findByClientIdOrderByCreatedAtDesc(any(), any());
    }

}
