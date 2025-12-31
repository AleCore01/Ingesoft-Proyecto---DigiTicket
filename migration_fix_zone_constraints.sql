-- Migration: Fix zone constraints to allow multiple LocationZones with same name
-- Date: 2025-12-01
-- Purpose: Remove unique constraint from location_zone (location_id, name)
--          Add unique constraint to event_zone (event_id, location_zone_id)

-- Step 1: Check for existing duplicates in event_zone that would violate new constraint
SELECT 
    event_id, 
    location_zone_id, 
    COUNT(*) as duplicate_count
FROM event_zone 
GROUP BY event_id, location_zone_id 
HAVING COUNT(*) > 1;

-- If duplicates exist, manually resolve them before proceeding

-- Step 2: Drop foreign key constraint from event_zone temporarily
ALTER TABLE event_zone 
DROP FOREIGN KEY fk_ez_location_zone;

-- Step 3: Remove unique constraint from location_zone
ALTER TABLE location_zone 
DROP INDEX uq_location_zone_name;

-- Step 4: Add regular index for performance (replaces unique constraint)
ALTER TABLE location_zone 
ADD INDEX idx_location_zone_location (location_id);

-- Step 5: Recreate foreign key constraint
ALTER TABLE event_zone 
ADD CONSTRAINT fk_ez_location_zone 
FOREIGN KEY (location_zone_id) 
REFERENCES location_zone (id) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Step 6: Add unique constraint to event_zone
ALTER TABLE event_zone 
ADD CONSTRAINT uq_event_zone_event_location_zone 
UNIQUE (event_id, location_zone_id);

-- Verification queries
SELECT 'location_zone indexes:' as info;
SHOW INDEXES FROM location_zone;

SELECT 'event_zone indexes:' as info;
SHOW INDEXES FROM event_zone;
