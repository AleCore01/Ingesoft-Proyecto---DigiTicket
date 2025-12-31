package com.digiticket.controller.bulk;

import com.digiticket.domain.event.Event;
import com.digiticket.domain.event.EventStatus;
import com.digiticket.domain.location.Location;
import com.digiticket.dto.event.EventDTO;
import com.digiticket.mapper.EventMapper;
import com.digiticket.service.event.EventService;
import com.digiticket.service.event.EventZoneService;
import com.digiticket.domain.event.EventZone;
import com.digiticket.service.location.LocationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/bulk")
public class BulkImportController {

    private final LocationService locationService;
    private final EventService eventService;
    private final EventZoneService eventZoneService;

    public BulkImportController(LocationService locationService, EventService eventService, EventZoneService eventZoneService) {
        this.locationService = locationService;
        this.eventService = eventService;
        this.eventZoneService = eventZoneService;
    }

    @PostMapping(path = "/locals", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BulkResult> importLocals(@RequestPart("file") MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream()) {
            List<Map<String, String>> rows = parseCsv(is);
            int created = 0;
            List<String> errors = new ArrayList<>();

            for (int i = 0; i < rows.size(); i++) {
                Map<String, String> r = rows.get(i);
                try {
                    String name = req(r, "name");
                    String address = req(r, "address");
                    String city = req(r, "city");
                    String district = req(r, "district");
                    int capacity = Integer.parseInt(req(r, "capacity"));
                    String contactEmail = opt(r, "contactEmail");
                    
                    Location loc = Location.builder()
                            .name(name)
                            .address(address)
                            .city(city)
                            .district(district)
                            .capacity(capacity)
                            .contactEmail(contactEmail)
                            .build();
                    locationService.createLocation(loc);
                    created++;
                } catch (Exception ex) {
                    String errorMsg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
                    errors.add("Row " + (i + 2) + ": " + errorMsg);
                }
            }
            return ResponseEntity.ok(new BulkResult(created, errors, null));
        }
    }

    @PostMapping(path = "/event-zones", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BulkResult> importEventZones(@RequestPart("file") MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream()) {
            List<Map<String, String>> rows = parseCsv(is);
            int created = 0;
            List<Integer> createdIds = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (int i = 0; i < rows.size(); i++) {
                Map<String, String> r = rows.get(i);
                try {
                    Integer eventId = Integer.parseInt(req(r, "eventId"));
                    String displayName = opt(r, "displayName");
                    String status = opt(r, "status");
                        com.digiticket.domain.event.Event ev = new com.digiticket.domain.event.Event();
                        ev.setId(eventId);
                        EventZone zone = EventZone.builder()
                            .event(ev)
                            .displayName(displayName)
                            .price(new java.math.BigDecimal(req(r, "price")))
                            .seatsQuota(Integer.parseInt(req(r, "seatsQuota")))
                            .seatsSold(opt(r, "seatsSold") != null ? Integer.parseInt(opt(r, "seatsSold")) : 0)
                            .status(status != null ? EventZone.Status.valueOf(status.toUpperCase(Locale.ROOT)) : EventZone.Status.ACTIVE)
                            .build();
                    Integer id = eventZoneService.createZone(zone);
                    created++;
                    createdIds.add(id);
                } catch (Exception ex) {
                    errors.add("Row " + (i + 2) + ": " + ex.getMessage());
                }
            }
            return ResponseEntity.ok(new BulkResult(created, errors, createdIds));
        }
    }

    @PostMapping(path = "/events", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BulkResult> importEvents(@RequestPart("file") MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream()) {
            List<Map<String, String>> rows = parseCsv(is);
            int created = 0;
            List<Integer> createdIds = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (int i = 0; i < rows.size(); i++) {
                Map<String, String> r = rows.get(i);
                try {
                    EventDTO dto = new EventDTO();
                    dto.setTitle(req(r, "title"));
                    dto.setDescription(req(r, "description"));
                    dto.setStartsAt(parseDate(req(r, "startsAt")));
                    String sales = opt(r, "salesStartAt");
                    dto.setSalesStartAt(sales != null && !sales.isBlank() ? parseDate(sales) : null);
                    dto.setDurationMin(Integer.parseInt(req(r, "durationMin")));
                    dto.setLocationId(Integer.parseInt(req(r, "locationId")));
                    dto.setEventCategoryId(Integer.parseInt(req(r, "eventCategoryId")));
                    dto.setAdministratorId(Integer.parseInt(req(r, "administratorId")));
                    String status = opt(r, "status");
                    dto.setStatus(status != null && !status.isBlank() ? status.toUpperCase(Locale.ROOT) : EventStatus.DRAFT.name());

                    // Imagen: imageBase64 o imageUrl (descarga)
                    String imgB64 = opt(r, "imageBase64");
                    String imgUrl = opt(r, "imageUrl");
                    if (imgB64 != null && !imgB64.isBlank()) {
                        dto.setImageBase64(imgB64.trim());
                    } else if (imgUrl != null && !imgUrl.isBlank()) {
                        byte[] data = tryFetch(imgUrl.trim());
                        if (data != null && data.length > 0) {
                            dto.setImageBase64(Base64.getEncoder().encodeToString(data));
                        }
                    }

                    Event entity = EventMapper.toEntity(dto);
                    Event saved = eventService.createEvent(entity);
                    created++;
                    createdIds.add(saved.getId());
                } catch (Exception ex) {
                    String errorMsg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
                    errors.add("Row " + (i + 2) + ": " + errorMsg);
                }
            }
            return ResponseEntity.ok(new BulkResult(created, errors, createdIds));
        }
    }

    private static String req(Map<String, String> r, String key) {
        String v = r.get(key);
        if (v == null || v.isBlank()) throw new IllegalArgumentException("Missing required column '" + key + "'");
        return v.trim();
    }

    private static String opt(Map<String, String> r, String key) {
        String v = r.get(key);
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static LocalDateTime parseDate(String s) {
        List<DateTimeFormatter> fmts = List.of(
                DateTimeFormatter.ISO_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm")
        );
        for (DateTimeFormatter f : fmts) {
            try { return LocalDateTime.parse(s, f); } catch (Exception ignored) {}
        }
        // fallback: try parse as ISO without seconds
        return LocalDateTime.parse(s);
    }

    private static byte[] tryFetch(String url) {
        try (InputStream in = new URL(url).openStream()) {
            return in.readAllBytes();
        } catch (Exception e) {
            return null;
        }
    }

    private static List<Map<String, String>> parseCsv(InputStream is) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String headerLine = br.readLine();
            if (headerLine == null) return List.of();
            String[] headers = split(headerLine);
            List<Map<String, String>> rows = new ArrayList<>();
            String line;
            while ((line = br.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] cols = split(line);
                Map<String, String> map = new HashMap<>();
                for (int i = 0; i < headers.length && i < cols.length; i++) {
                    map.put(headers[i].trim(), unquote(cols[i]));
                }
                rows.add(map);
            }
            return rows;
        }
    }

    private static String[] split(String line) {
        // soporte simple para "," o ";" como separador, sin campos con comas internas
        String sep = line.contains(";") && !line.contains(",") ? ";" : ",";
        return line.split(sep, -1);
    }

    private static String unquote(String s) {
        String t = s == null ? "" : s.trim();
        if (t.startsWith("\"") && t.endsWith("\"")) {
            t = t.substring(1, t.length() - 1);
        }
        return t;
    }

    public static class BulkResult {
        public int createdCount;
        public List<String> errors;
        public List<Integer> createdIds;
        public BulkResult(int createdCount, List<String> errors, List<Integer> createdIds) {
            this.createdCount = createdCount;
            this.errors = errors;
            this.createdIds = createdIds;
        }
    }
}
