package com.digiticket.repository.settings;

import com.digiticket.domain.settings.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Short> {
}
