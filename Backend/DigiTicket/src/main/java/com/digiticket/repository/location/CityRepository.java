package com.digiticket.repository.location;

import com.digiticket.domain.location.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface CityRepository extends JpaRepository<City,Integer> { }
