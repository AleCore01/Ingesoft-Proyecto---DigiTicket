package com.digiticket.controller.event;

import com.digiticket.domain.event.EventCategory;
import com.digiticket.service.event.EventCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventcategory")
public class EventCategoryController {

    @Autowired
    private EventCategoryService eventCategoryService;

    // Create new category
    @PostMapping("/add")
    public EventCategory create(@RequestBody EventCategory category) {
        return eventCategoryService.createCategory(category);
    }

    //List all the categories
    @GetMapping("/all")
    public List<EventCategory> getAll() {
        return eventCategoryService.getAllCategories();
    }

    //Get category by ID
    @GetMapping("/{id}")
    public EventCategory getById(@PathVariable Integer id) {
        return eventCategoryService.getCategoryById(id);
    }

    //Update category
    @PutMapping("/update/{id}")
    public EventCategory update(@PathVariable Integer id,
                                @RequestBody EventCategory category) {
        return eventCategoryService.updateCategory(id, category);
    }

    //Delete Category
    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Integer id) {
        eventCategoryService.deleteCategory(id);
    }

    //Search by name
    @GetMapping("/search/name")
    public List<EventCategory> searchByName(@RequestParam String name) {
        return eventCategoryService.searchByName(name);
    }
}
