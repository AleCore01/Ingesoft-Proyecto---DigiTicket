package com.digiticket.service.impl.location;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.event.EventZone;
import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.repository.event.EventRepository;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.service.location.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;
    private final EventRepository eventRepository;

    @Override
    @Transactional
    public Location createLocation(Location location) {
        Optional<Location> existing = locationRepository.
                findByNameAndAddress(location.getName(),
                        location.getAddress());
        if(existing.isPresent()){
            Location loc = existing.get();
            if(loc.getStatus()==LocationStatus.INACTIVE){
                loc.setStatus(LocationStatus.ACTIVE);
                loc.setContactEmail(location.getContactEmail());
                loc.setCity(location.getCity());
                loc.setDistrict(location.getDistrict());
                loc.setCapacity(location.getCapacity());
                loc.setUpdatedAt(LocalDateTime.now());
                return  locationRepository.save(loc);
            }else{
                throw new RuntimeException("Location already exists with name='" + location.getName() + "' and address='" + location.getAddress() + "'");
            }
        }
        location.setStatus(LocationStatus.ACTIVE);
        return locationRepository.save(location);
    }

    @Override
    public Location updateLocation(Integer id, Location updatedLocation) {
        Optional<Location> optional = locationRepository.findById(id);
        if(optional.isEmpty()) {
            throw  new RuntimeException("Location not found with id "+id);
        }
        Location existing=optional.get();
        existing.setName(updatedLocation.getName());
        existing.setContactEmail(updatedLocation.getContactEmail());
        existing.setAddress(updatedLocation.getAddress());
        existing.setCity(updatedLocation.getCity());
        existing.setDistrict(updatedLocation.getDistrict());
        existing.setCapacity(updatedLocation.getCapacity());
        existing.setStatus(updatedLocation.getStatus());
        return locationRepository.save(existing);

    }

    @Override
    @Transactional
    public void deleteLocation(Integer id) {
        Location loc = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with id " + id));
        //DRAFT, PUBLISHED, CANCELED, FINISHED
        boolean hasBlockedEvents = eventRepository.existsByLocation_Id_AndStatusIn(
                id,
                List.of(EventStatus.PUBLISHED)
        );

        if (hasBlockedEvents) {
            throw new IllegalStateException("No se puede eliminar el local porque tiene eventos activos o próximos.");
        }

        loc.setStatus(LocationStatus.INACTIVE);

        if (loc.getZones() != null) {
            loc.getZones().forEach(z -> z.setStatus(LocationStatus.INACTIVE));
        }

        var events =eventRepository.findByLocationId(id);

        for(Event e:events){
            if(e.getStatus()!=EventStatus.PUBLISHED){
                e.setStatus(EventStatus.FINISHED);
                if(e.getZones()!=null){
                    e.getZones().forEach(z->z.setStatus(EventZone.Status.INACTIVE));
                }
            }
        }

        locationRepository.save(loc);
    }



    @Override
    public Location getLocationById(Integer id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found or inactive"));
    }

    @Override
    public List<Location> getAllLocations() {
        long startTime = System.currentTimeMillis();
        List<Location> locations = locationRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        long endTime = System.currentTimeMillis();
        System.out.println("⏱️ [LocationService] getAllLocations took: " + (endTime - startTime) + "ms, returned " + locations.size() + " locations");
        return locations;
    }

    @Override
    public List<Location> getLocationsByStatus(LocationStatus status) {
        return locationRepository.findByStatus(status)
                .stream()
                .sorted(Comparator.comparing(Location::getName))
                .toList();
    }

    @Override
    public List<Location> searchLocationsByName(String name) {
        return locationRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .sorted(Comparator.comparing(Location::getName))
                .toList();
    }
    @Override
    public int countEventByLocation(Integer locationId) {
        if(!locationRepository.existsById(locationId)){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"No existe una location with id "+locationId);
        }
        return eventRepository.countByLocation_Id(locationId);
    }

    @Override
    public List<Location> searchLocationsByDistrict(String district) {
        return locationRepository.findByDistrict(district)
                .stream()
                .sorted(Comparator.comparing(Location::getName))
                .toList();
    }

    @Override
    @Transactional
    public void activeLocation(Integer locationId) {
        Location loc=locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found with id"+locationId));
        if(loc.getStatus()==LocationStatus.ACTIVE){
            throw new RuntimeException("El local ya esta activado");
        }

        loc.setStatus(LocationStatus.ACTIVE);
        loc.setUpdatedAt(LocalDateTime.now());

        locationRepository.save(loc);
    }

}
