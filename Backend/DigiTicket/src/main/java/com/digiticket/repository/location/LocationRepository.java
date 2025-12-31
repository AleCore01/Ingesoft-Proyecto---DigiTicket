package com.digiticket.repository.location;

import com.digiticket.domain.location.Location;
import com.digiticket.domain.location.LocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location,Integer> {
    //Search by status

    List<Location> findByStatus(LocationStatus status);
    //Search by name
    List<Location> findByNameContainingIgnoreCase(String text);
    //Optional<Location> findByIdAndStatus(Integer id);
    Optional<Location> findByNameAndAddress(String name,String address);
    List<Location>findByDistrict(String district);
}
