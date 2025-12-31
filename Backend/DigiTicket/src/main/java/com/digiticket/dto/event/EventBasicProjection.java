package com.digiticket.dto.event;

import java.time.LocalDateTime;

/**
 * Proyección ligera de Event que NO incluye imageData (BLOB pesado)
 * para optimizar queries donde no necesitamos la imagen
 */
public interface EventBasicProjection {
    Integer getId();
    String getTitle();
    LocalDateTime getStartsAt();
    Integer getLocationId();
    String getLocationName();
    String getLocationAddress();
}
