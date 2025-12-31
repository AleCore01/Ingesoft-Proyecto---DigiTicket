package com.digiticket.controller.user;

import com.digiticket.domain.loyalty.LoyaltyPointStatus;
import com.digiticket.dto.user.AdminClientDTO;
import com.digiticket.service.user.ClientService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/admin/clients")
public class AdminClientController {

    private final ClientService clientService;

    public AdminClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // Listar clientes activos (con filtro opcional por nombre)
    @GetMapping
    public ResponseEntity<List<AdminClientDTO>> listActiveClients(
            @RequestParam(name = "name", required = false) String name
    ) {
        List<AdminClientDTO> result;

        if (name == null || name.isBlank()) {
            result = clientService.listActiveClients();
        } else {
            result = clientService.searchActiveClientsByName(name);
        }

        return ResponseEntity.ok(result);
    }

    // Desactivar cliente
    @DeleteMapping("/{clientId}")
    public ResponseEntity<Void> deactivateClient(@PathVariable Integer clientId) {
        clientService.deactivateClient(clientId);
        return ResponseEntity.noContent().build();
    }

    // Listar clientes filtrados por estado de puntos (y opcionalmente por nombre)
    @GetMapping("/by-points-status")
    public ResponseEntity<List<AdminClientDTO>> listClientsByPointsStatus(
            @RequestParam LoyaltyPointStatus status,
            @RequestParam(name = "name", required = false) String name
    ) {
        List<AdminClientDTO> result;
        if (name == null || name.isBlank()) {
            result = clientService.listClientsByPointsStatus(status);
        } else {
            result = clientService.searchClientsByPointsStatusAndName(status, name);
        }
        return ResponseEntity.ok(result);
    }
    // Clientes con puntos que vencen en los próximos 5 días
    @GetMapping("/points-expiring-in-5-days")
    public ResponseEntity<List<AdminClientDTO>> listClientsWithPointsExpiringIn5Days() {
        return ResponseEntity.ok(
                clientService.listClientsWithPointsExpiringInNextDays(5)
        );
    }

}
