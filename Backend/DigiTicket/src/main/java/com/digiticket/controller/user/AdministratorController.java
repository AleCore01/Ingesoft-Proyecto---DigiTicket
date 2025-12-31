package com.digiticket.controller.user;

import com.digiticket.dto.user.AdminCreateRequestDTO;
import com.digiticket.dto.user.AdminResponseDTO;
import com.digiticket.dto.user.AdminUpdateRequestDTO;
import com.digiticket.service.user.AdministratorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admins")
public class AdministratorController {

    private final AdministratorService administratorService;

    public AdministratorController(AdministratorService administratorService) {
        this.administratorService = administratorService;
    }

    // Registrar administrador (pantalla "Registrar administrador")
    @PostMapping
    public ResponseEntity<AdminResponseDTO> create(@RequestBody AdminCreateRequestDTO dto) {
        AdminResponseDTO created = administratorService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Modificar administrador (pantalla "Modificar administrador")
    @PutMapping("/{id}")
    public ResponseEntity<AdminResponseDTO> update(
            @PathVariable Integer id,
            @RequestBody AdminUpdateRequestDTO dto) {
        AdminResponseDTO updated = administratorService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    // Obtener un admin (para llenar el formulario de edición)
    @GetMapping("/{id}")
    public ResponseEntity<AdminResponseDTO> getOne(@PathVariable Integer id) {
        return ResponseEntity.ok(administratorService.getById(id));
    }

    // Listar todos (para tabla de usuarios admin)
    @GetMapping
    public ResponseEntity<List<AdminResponseDTO>> listAll() {
        return ResponseEntity.ok(administratorService.listAll());
    }

    // Eliminar (delete de toda la vida)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        administratorService.delete(id);
        return ResponseEntity.noContent().build();
    }
    // Listar por estado (ACTIVE, BLOCKED, DELETED)
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AdminResponseDTO>> listByStatus(@PathVariable String status) {
        return ResponseEntity.ok(administratorService.findByStatus(status));
    }

    // Buscar por nombre/apellido (contiene)
    @GetMapping("/search")
    public ResponseEntity<List<AdminResponseDTO>> searchByName(@RequestParam("name") String name) {
        return ResponseEntity.ok(administratorService.searchByName(name));
    }
}
