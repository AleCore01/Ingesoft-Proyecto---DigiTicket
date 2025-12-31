package com.digiticket.controller.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.service.location.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/local")
public class LocationController {

    @Autowired
    private LocationService locationService;

    //Create new local
    @PostMapping("/add")
    public Location create(@RequestBody Location location) {
        return locationService.createLocation(location);
    }

    //List all the locals
    @GetMapping("/all")
    public List<Location> getAll() {
        return locationService.getAllLocations();
    }

    //Search by ID
    @GetMapping("/{id}")
    public Location getById(@PathVariable int id) {
        return locationService.getLocationById(id);
    }

    //Update local
    @PutMapping("/update/{id}")
    public Location update(@PathVariable int id, @RequestBody Location location) {
        return locationService.updateLocation(id, location);
    }

    //Delete local
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        locationService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }

    //Search by name
    @GetMapping("/search/name")
    public List<Location> searchByName(@RequestParam String name) {
        return locationService.searchLocationsByName(name);
    }

    @GetMapping("/search/district")
    public List<Location> searchByDistrict(@RequestParam String district) {
        return locationService.searchLocationsByDistrict(district);
    }


    //Search by status
    @GetMapping("/search/status/{status}")
    public List<Location> searchStatus(@PathVariable LocationStatus status) {
        return locationService.getLocationsByStatus(status);
    }

    @GetMapping("/{id}/event/count")
    public ResponseEntity<Integer> countEvents(@PathVariable Integer id) {
        int count=locationService.countEventByLocation(id);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activate(@PathVariable int id) {
        locationService.activeLocation(id);
        return ResponseEntity.ok("Activated Successfully");
    }

}
