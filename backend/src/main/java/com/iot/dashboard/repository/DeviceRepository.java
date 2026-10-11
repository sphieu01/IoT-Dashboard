package com.iot.dashboard.repository;

import com.iot.dashboard.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Integer> {
    Optional<Device> findByNameIgnoreCase(String name);
}
