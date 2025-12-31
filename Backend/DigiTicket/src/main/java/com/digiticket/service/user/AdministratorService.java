package com.digiticket.service.user;

import com.digiticket.dto.user.AdminCreateRequestDTO;
import com.digiticket.dto.user.AdminResponseDTO;
import com.digiticket.dto.user.AdminUpdateRequestDTO;

import java.util.List;

public interface AdministratorService {
    AdminResponseDTO create(AdminCreateRequestDTO dto);
    AdminResponseDTO update(Integer adminId, AdminUpdateRequestDTO dto);
    List<AdminResponseDTO> listAll();
    AdminResponseDTO getById(Integer adminId);
    void delete(Integer adminId);
    List<AdminResponseDTO> findByStatus(String status);
    List<AdminResponseDTO> searchByName(String name);
}
