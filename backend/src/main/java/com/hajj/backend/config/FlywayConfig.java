package com.hajj.backend.config;

import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Repairs any previously-failed Flyway migrations before running migrate().
 *
 * This is needed when a prior deploy attempted V1 but failed part-way through
 * (e.g. due to a SQL error), leaving a "failed" entry in flyway_schema_history.
 * Flyway refuses to continue without repair in that case. repair() removes the
 * failed record so the corrected migration can be applied cleanly.
 *
 * Because every INSERT in V1 is idempotent (ON CONFLICT DO NOTHING /
 * WHERE NOT EXISTS), replaying it after a partial run is safe.
 */
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy repairThenMigrate() {
        return flyway -> {
            // Remove any failed-migration records from flyway_schema_history so
            // that the corrected V1 can be applied on the next migrate() call.
            flyway.repair();
            flyway.migrate();
        };
    }
}
