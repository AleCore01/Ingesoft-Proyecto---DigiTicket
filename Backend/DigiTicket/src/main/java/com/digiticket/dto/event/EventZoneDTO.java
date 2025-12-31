package com.digiticket.dto.event;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EventZoneDTO {
    private Integer eventId;
    private Integer locationZoneId;
    private String displayName;
    private BigDecimal price;
    private Integer seatsQuota;
    private Integer seatsSold;
    private String status;

    private Integer locationId;          // id del local (location)
    private String  locationZoneName;    // nombre de la nueva zona del local
    private Integer locationZoneCapacity; // capacidad de la nueva zona

}
