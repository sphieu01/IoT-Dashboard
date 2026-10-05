package com.iot.dashboard.repository;

import com.iot.dashboard.entity.DeviceHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceHistoryRepository extends JpaRepository<DeviceHistory, Long> {

    List<DeviceHistory> findAllByOrderByCreatedAtDesc();

    Page<DeviceHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<DeviceHistory> findAllByOrderByCreatedAtAsc(Pageable pageable);

    // Tìm bản ghi PENDING gần nhất của thiết bị để chuyển thành ON/OFF khi ESP32 ACK
    Optional<DeviceHistory> findTop1ByDeviceAndStatusOrderByCreatedAtDesc(String device, String status);
}
