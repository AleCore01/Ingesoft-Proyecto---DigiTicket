package com.digiticket.service.location;

//import com.digiticket.domain.Location;
import com.digiticket.domain.location.LocationZone;

import java.util.List;

public interface LocationZoneService {

    LocationZone createZone(Integer locationId,LocationZone zone);

    LocationZone updateZone(Integer id,LocationZone zone);

    void deleteZone(Integer id);

    LocationZone getZoneById(Integer id);

    List<LocationZone> getZonesByLocation(Integer locationId);
}
