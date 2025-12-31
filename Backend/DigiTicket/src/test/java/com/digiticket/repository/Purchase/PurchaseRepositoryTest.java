package com.digiticket.repository.Purchase;

import com.digiticket.domain.user.Client;
import com.digiticket.domain.order.Purchase;
import com.digiticket.domain.user.User;
import com.digiticket.domain.order.PurchasePaymentMethod;
import com.digiticket.domain.order.PurchaseStatus;
import com.digiticket.repository.order.PurchaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;


class PurchaseRepositoryTest {
//
    private PurchaseRepository purchaseRepository;

    private Client client;

    @BeforeEach
    void setUp() {
        purchaseRepository = mock(PurchaseRepository.class);

        User user = User.builder()
                .id(3)
                .firstName("Andrés")
                .lastName("Quispe")
                .email("andres.quispe@example.com")
                .build();

        client = new Client();
        client.setId(1);
        client.setUser(user);
    }

    @Test
    void findByClientIdOrderByCreatedAtDesc_returnsPurchasesInCorrectOrder() {
        // Datos de prueba
        Purchase p1 = new Purchase();
        p1.setId(1);
        p1.setClient(client);
        p1.setTotalAmount(BigDecimal.valueOf(50.00));
        p1.setTotalQuantity(2);
        p1.setPaymentMethod(PurchasePaymentMethod.CARD);
        p1.setStatus(PurchaseStatus.ACTIVE);
        p1.setCreatedAt(LocalDateTime.of(2025, 11, 14, 4, 39, 40));

        Purchase p2 = new Purchase();
        p2.setId(2);
        p2.setClient(client);
        p2.setTotalAmount(BigDecimal.valueOf(100.00));
        p2.setTotalQuantity(4);
        p2.setPaymentMethod(PurchasePaymentMethod.CARD);
        p2.setStatus(PurchaseStatus.ACTIVE);
        p2.setCreatedAt(LocalDateTime.of(2025, 11, 15, 4, 39, 40));

        // Mockear comportamiento del repositorio usando Pageable
        Page<Purchase> page = new PageImpl<>(List.of(p2, p1));
        when(purchaseRepository.findByClientIdOrderByCreatedAtDesc(eq(client.getId()), any(Pageable.class)))
                .thenReturn(page);

        // Ejecutar prueba
        Page<Purchase> purchasesPage = purchaseRepository.findByClientIdOrderByCreatedAtDesc(client.getId(), Pageable.unpaged());
        List<Purchase> purchases = purchasesPage.getContent();

        // Validar
        assertEquals(2, purchases.size());
        assertEquals(2, purchases.get(0).getId()); // más reciente primero
        assertEquals(1, purchases.get(1).getId());
    }
}
