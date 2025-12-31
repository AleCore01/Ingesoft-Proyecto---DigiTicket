package com.digiticket.repository.location;


import com.digiticket.domain.location.LocationZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationZoneRepository extends JpaRepository<LocationZone,Integer> {
    //Buscar las zonas de un local
    List<LocationZone> findByLocationId(Integer locationId);
    Optional<LocationZone> findByLocationIdAndNameIgnoreCase(Integer locationId, String name);
}
