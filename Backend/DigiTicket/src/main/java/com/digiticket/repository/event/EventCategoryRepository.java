package com.digiticket.repository.event;

import com.digiticket.domain.event.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventCategoryRepository extends JpaRepository<EventCategory, Integer> { }
