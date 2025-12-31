package com.digiticket.service.event;

import com.digiticket.domain.event.EventCategory;
import com.digiticket.repository.event.EventCategoryRepository;
import com.digiticket.service.impl.event.EventCategoryServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventCategoryServiceImplTest {

    @Mock EventCategoryRepository repo;
    @InjectMocks EventCategoryServiceImpl service;

    @Test
    void createCategory_bad_name() {
        var c = new EventCategory(); c.setName(" ");
        assertThatThrownBy(() -> service.createCategory(c))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Category name is required");
        verifyNoInteractions(repo);
    }

    @Test
    void createCategory_ok() {
        var c = new EventCategory(); c.setName("Rock");
        when(repo.save(any())).thenAnswer(inv -> {
            var saved = (EventCategory) inv.getArgument(0);
            saved.setId(10);
            return saved;
        });
        var out = service.createCategory(c);
        assertThat(out.getId()).isEqualTo(10);
        verify(repo).save(any(EventCategory.class));
    }

    @Test
    void updateCategory_ok() {
        var existing = new EventCategory(); existing.setId(1); existing.setName("Old");
        when(repo.findById(1)).thenReturn(Optional.of(existing));
        when(repo.save(existing)).thenReturn(existing);

        var upd = new EventCategory(); upd.setName("Indie");
        var out = service.updateCategory(1, upd);

        assertThat(out.getName()).isEqualTo("Indie");
        verify(repo).save(existing);
    }

    @Test
    void updateCategory_not_found() {
        when(repo.findById(99)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateCategory(99, new EventCategory()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void deleteCategory_ok() {
        when(repo.existsById(5)).thenReturn(true);
        service.deleteCategory(5);
        verify(repo).deleteById(5);
    }

    @Test
    void deleteCategory_not_found() {
        when(repo.existsById(7)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteCategory(7))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getCategoryById_ok() {
        var c = new EventCategory(); c.setId(1);
        when(repo.findById(1)).thenReturn(Optional.of(c));
        assertThat(service.getCategoryById(1)).isSameAs(c);
    }

    @Test
    void getCategoryById_not_found() {
        when(repo.findById(9)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getCategoryById(9))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getAllCategories_ok() {
        service.getAllCategories();
        verify(repo).findAll();
    }

    @Test
    void searchByName_filters_in_memory() {
        var a = new EventCategory(); a.setName("Rock");
        var b = new EventCategory(); b.setName("Pop");
        when(repo.findAll()).thenReturn(List.of(a,b));

        var out = service.searchByName("ro");
        assertThat(out).extracting(EventCategory::getName).containsExactly("Rock");
    }
}
