package com.digiticket.service.impl.event;

import com.digiticket.domain.event.EventCategory;
import com.digiticket.repository.event.EventCategoryRepository;
import com.digiticket.service.event.EventCategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EventCategoryServiceImpl implements EventCategoryService {

    private final EventCategoryRepository repository;

    public EventCategoryServiceImpl(EventCategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public EventCategory createCategory(EventCategory category) {
        // (Opcional) validar duplicados por nombre
        if (category.getName() == null || category.getName().isBlank()) {
            throw new RuntimeException("Category name is required");
        }
        return repository.save(category);
    }

    @Override
    public EventCategory updateCategory(Integer id, EventCategory updated) {
        Optional<EventCategory> opt = repository.findById(id);
        if (opt.isEmpty()) {
            throw new RuntimeException("EventCategory not found with id " + id);
        }
        EventCategory existing = opt.get();
        existing.setName(updated.getName());
        return repository.save(existing);
    }

    @Override
    public void deleteCategory(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("EventCategory not found with id " + id);
        }
        repository.deleteById(id);
    }

    @Override
    public EventCategory getCategoryById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("EventCategory not found with id " + id));
    }

    @Override
    public List<EventCategory> getAllCategories() {
        return repository.findAll();
    }

    @Override
    public List<EventCategory> searchByName(String name) {
        // Si quieres exacto usa equals; aquí lo hacemos "contains ignore case"
        return repository.findAll().stream()
                .filter(c -> c.getName() != null && c.getName().toLowerCase().contains(name.toLowerCase()))
                .toList();
        // Si prefieres query nativa, agrega en el repo:
        // List<EventCategory> findByNameContainingIgnoreCase(String name);
    }
}
