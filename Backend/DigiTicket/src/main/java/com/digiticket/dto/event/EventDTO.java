package com.digiticket.dto.event;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
public class EventDTO {

    // Getters y Setters
    private Integer id;
    private String title;
    private String description;
    private LocalDateTime startsAt;
    private LocalDateTime salesStartAt;
    private Integer durationMin;
    private Integer locationId;
    private Integer eventCategoryId;
    private Integer administratorId;
    private String status;
    private String imageBase64;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
