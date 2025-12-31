package com.digiticket.controller.system;

import com.digiticket.dto.settings.SystemSettingsDTO;
import com.digiticket.service.settings.SettingsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/system")
public class SettingsController {
    private final SettingsService settings;

    public SettingsController(SettingsService settings) {
        this.settings = settings;
    }

    @GetMapping("/settings")
    public ResponseEntity<SystemSettingsDTO> getSettings(){
        return ResponseEntity.ok(settings.getSettingsSnapshot());
    }

    @PutMapping("/settings")
    public ResponseEntity<SystemSettingsDTO> updateSettings(@RequestBody SystemSettingsDTO payload) {
        try {
            return ResponseEntity.ok(settings.updateSettings(payload));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
