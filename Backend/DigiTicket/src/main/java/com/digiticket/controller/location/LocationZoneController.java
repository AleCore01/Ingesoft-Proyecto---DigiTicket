package com.digiticket.controller.location;

import com.digiticket.domain.location.LocationZone;
import com.digiticket.service.location.LocationZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/localzone")
public class LocationZoneController {

    @Autowired
    LocationZoneService locationZoneService;

    //Crear nueva zona
    @PostMapping("/add")
    public ResponseEntity<LocationZone> create(@RequestParam Integer locationId, @RequestBody LocationZone zone){
        LocationZone createdZone = locationZoneService.createZone(locationId,zone);
        return ResponseEntity.ok(createdZone);
    }

    @GetMapping("/{id}")
    public LocationZone getById(@PathVariable Integer id){
        return locationZoneService.getZoneById(id);
    }

    //Actualizar todas las zonas
    @PutMapping("/update/{id}")
    public LocationZone update(@PathVariable Integer id, @RequestBody LocationZone locationZone){
        return locationZoneService.updateZone(id, locationZone);
    }

    //Eliminar zona
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){
        locationZoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }

    //Listar zonas de los locales
    @GetMapping("/list/{locationId}")
    public List<LocationZone> getByLocation(@PathVariable Integer locationId){
        return locationZoneService.getZonesByLocation(locationId);
    }
}
