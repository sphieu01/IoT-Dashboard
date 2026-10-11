package com.iot.dashboard.repository;

import com.iot.dashboard.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Integer> {
    Optional<Sensor> findByType(String type);
    Optional<Sensor> findByNameAndType(String name, String type);
}
