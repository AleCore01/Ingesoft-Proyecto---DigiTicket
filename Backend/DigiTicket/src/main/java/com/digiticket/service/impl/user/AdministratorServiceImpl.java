package com.digiticket.service.impl.user;

import com.digiticket.domain.user.Administrator;
import com.digiticket.domain.user.DocumentType;
import com.digiticket.domain.user.RoleAdmin;
import com.digiticket.domain.user.RoleUser;   // 👈 IMPORT CLAVE
import com.digiticket.domain.user.User;
import com.digiticket.domain.user.UserStatus;
import com.digiticket.dto.user.AdminCreateRequestDTO;
import com.digiticket.dto.user.AdminResponseDTO;
import com.digiticket.dto.user.AdminUpdateRequestDTO;
import com.digiticket.repository.user.AdministratorRepository;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.user.AdministratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdministratorServiceImpl implements AdministratorService {

    private final AdministratorRepository administratorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AdminResponseDTO create(AdminCreateRequestDTO dto) {

        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden");
        }

        // ===== 1. Crear User =====
        User user = new User();
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setDocumentNumber(dto.getDocumentNumber());

        if (dto.getDocumentType() != null) {
            user.setDocumentType(DocumentType.valueOf(dto.getDocumentType()));
        }

        if (dto.getStatus() != null) {
            user.setStatus(UserStatus.valueOf(dto.getStatus()));
        } else {
            user.setStatus(UserStatus.ACTIVE);
        }

        // 👇 AQUÍ USAMOS RoleUser (enum) PARA EL ROL DEL USER
        user.setRoleUser(RoleUser.ADMIN);;

        user = userRepository.save(user);

        // ===== 2. Crear Administrator =====
        Administrator admin = new Administrator();
        admin.setUser(user);

        if (dto.getRole() != null) {
            admin.setRole(RoleAdmin.valueOf(dto.getRole()));
        } else {
            admin.setRole(RoleAdmin.ADMIN);
        }

        admin = administratorRepository.save(admin);

        return toDto(admin);
    }

    @Override
    @Transactional
    public AdminResponseDTO update(Integer adminId, AdminUpdateRequestDTO dto) {

        Administrator admin = administratorRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Administrador no encontrado"));

        User user = admin.getUser();

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setDocumentNumber(dto.getDocumentNumber());

        if (dto.getDocumentType() != null) {
            user.setDocumentType(DocumentType.valueOf(dto.getDocumentType()));
        }

        if (dto.getStatus() != null) {
            user.setStatus(UserStatus.valueOf(dto.getStatus()));
        }

        if (dto.getRole() != null) {
            admin.setRole(RoleAdmin.valueOf(dto.getRole()));
        }

        userRepository.save(user);
        administratorRepository.save(admin);

        return toDto(admin);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminResponseDTO> listAll() {
        return administratorRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminResponseDTO getById(Integer adminId) {
        Administrator admin = administratorRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Administrador no encontrado"));
        return toDto(admin);
    }

    @Override
    @Transactional
    public void delete(Integer adminId) {
        Administrator admin = administratorRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Administrador no encontrado"));

        User user = admin.getUser();

        // Soft delete: marcamos al usuario como eliminado
        user.setStatus(UserStatus.DELETED);
        user.setDeletedAt(java.time.LocalDateTime.now());

        userRepository.save(user);
        // NO borramos la fila de administrators para no romper la FK con event
    }

    // ===== helper interno para mapear a DTO =====
    private AdminResponseDTO toDto(Administrator admin) {
        User u = admin.getUser();

        AdminResponseDTO dto = new AdminResponseDTO();
        dto.setId(admin.getId());
        dto.setUserId(u.getId());

        // Código “de pantalla”: ADMIN-001, ADMIN-002, etc.
        dto.setCode(String.format("ADMIN-%03d", admin.getId()));

        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName());
        dto.setDocumentType(u.getDocumentType() != null ? u.getDocumentType().name() : null);
        dto.setDocumentNumber(u.getDocumentNumber());
        dto.setEmail(u.getEmail());
        dto.setStatus(u.getStatus() != null ? u.getStatus().name() : null);
        dto.setRole(admin.getRole() != null ? admin.getRole().name() : null);
        dto.setCreatedAt(admin.getCreatedAt());
        dto.setUpdatedAt(admin.getUpdatedAt());
        return dto;
    }
    @Override
    @Transactional(readOnly = true)
    public List<AdminResponseDTO> findByStatus(String status) {
        if (status == null || status.isBlank()) {
            return listAll();
        }

        // normalizamos a mayúsculas para el enum
        String normalized = status.trim().toUpperCase();

        UserStatus statusEnum;
        try {
            statusEnum = UserStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado de usuario inválido: " + status);
        }

        return administratorRepository.findAll().stream()
                .filter(admin -> admin.getUser().getStatus() == statusEnum)
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminResponseDTO> searchByName(String name) {
        if (name == null || name.isBlank()) {
            return listAll();
        }

        String needle = name.trim().toLowerCase();

        return administratorRepository.findAll().stream()
                .filter(admin -> {
                    var u = admin.getUser();
                    String fn = u.getFirstName() != null ? u.getFirstName().toLowerCase() : "";
                    String ln = u.getLastName() != null ? u.getLastName().toLowerCase() : "";
                    String full = (fn + " " + ln).trim();
                    return fn.contains(needle)
                            || ln.contains(needle)
                            || full.contains(needle);
                })
                .map(this::toDto)
                .toList();
    }

}
