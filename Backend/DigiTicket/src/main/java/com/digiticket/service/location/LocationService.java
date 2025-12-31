package com.digiticket.service.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;

import java.util.List;

public interface LocationService {
    Location createLocation(Location location);
    Location updateLocation(Integer id, Location location);
    void deleteLocation(Integer id);
    Location getLocationById(Integer id);
    List<Location> getAllLocations();
    List<Location> getLocationsByStatus(LocationStatus status);
    List<Location> searchLocationsByName(String name);
    List<Location> searchLocationsByDistrict(String district);
    int countEventByLocation(Integer locationId);
    void activeLocation(Integer locationId);
}
