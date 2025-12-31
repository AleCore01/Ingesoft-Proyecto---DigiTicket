package com.digiticket.service.event;

import com.digiticket.domain.event.EventCategory;

import java.util.List;

public interface EventCategoryService {
    EventCategory createCategory(EventCategory category);
    EventCategory updateCategory(Integer id, EventCategory updated);
    void deleteCategory(Integer id);
    EventCategory getCategoryById(Integer id);
    List<EventCategory> getAllCategories();
    List<EventCategory> searchByName(String name);
}
