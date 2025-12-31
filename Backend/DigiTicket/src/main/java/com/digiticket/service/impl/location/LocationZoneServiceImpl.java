package com.digiticket.service.impl.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import com.digiticket.domain.location.LocationZone;
import com.digiticket.repository.location.LocationRepository;
import com.digiticket.repository.location.LocationZoneRepository;
import com.digiticket.service.location.LocationZoneService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LocationZoneServiceImpl implements LocationZoneService {

    private final LocationZoneRepository locationZoneRepository;
    private final LocationRepository locationRepository;

    public LocationZoneServiceImpl(LocationZoneRepository locationZoneRepository,
                                   LocationRepository locationRepository) {
        this.locationZoneRepository = locationZoneRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    @Transactional
    public LocationZone createZone(Integer locationId,LocationZone zone) {
        Location loc =locationRepository.findById(locationId)
                .orElseThrow(() ->new RuntimeException("Location not found"));

        if(loc.getStatus()==LocationStatus.INACTIVE){
            //loc.setStatus(LocationStatus.ACTIVE);
            //locationRepository.save(loc);
            throw new RuntimeException("Cannot activate location");
        }

        LocationZone existingZone=locationZoneRepository
                .findByLocationIdAndNameIgnoreCase(locationId,zone.getName())
                .orElse(null);

        if(existingZone!=null){
            if(existingZone.getStatus()== LocationStatus.INACTIVE){
                existingZone.setStatus(LocationStatus.ACTIVE);
                existingZone.setCapacity(zone.getCapacity());
                return locationZoneRepository.save(existingZone);
            }else{
                throw new RuntimeException("Zone with the same name already exists");
            }

        }
        zone.setLocation(loc);
        zone.setStatus(LocationStatus.ACTIVE);
        return locationZoneRepository.save(zone);
    }

    @Override
    public LocationZone updateZone(Integer id, LocationZone zone) {
        LocationZone exiting=locationZoneRepository.findById(id)
                .orElseThrow(()->new RuntimeException("LocationZone not found with id "+id));
        exiting.setName(zone.getName());
        exiting.setCapacity(zone.getCapacity());
        return locationZoneRepository.save(exiting);
    }

    @Override
    @Transactional
    public void deleteZone(Integer id) {
        LocationZone zone=locationZoneRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Zone not found with id "+id));
        zone.setStatus(LocationStatus.INACTIVE);
        locationZoneRepository.save(zone);
    }

    @Override
    public LocationZone getZoneById(Integer id) {
        return locationZoneRepository.findById(id)
                .orElseThrow(()->new RuntimeException("LocationZone not found with id "+id));
    }

    @Override
    public List<LocationZone> getZonesByLocation(Integer locationId) {
        return locationZoneRepository.findByLocationId(locationId);
    }
}
