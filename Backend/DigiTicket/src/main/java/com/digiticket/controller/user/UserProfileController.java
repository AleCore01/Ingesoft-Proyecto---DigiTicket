package com.digiticket.controller.user;

import com.digiticket.dto.user.UpdateUserProfileRequest;
import com.digiticket.dto.user.UserProfileDTO;
import com.digiticket.service.user.ClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final ClientService clientService;

    public UserProfileController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@PathVariable Integer userId) {
        UserProfileDTO dto = clientService.getProfileByUserId(userId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @PathVariable Integer userId,
            @RequestBody UpdateUserProfileRequest request
    ) {
        UserProfileDTO updated = clientService.updateCurrentProfileByUserId(request, userId);
        return ResponseEntity.ok(updated);
    }
}
