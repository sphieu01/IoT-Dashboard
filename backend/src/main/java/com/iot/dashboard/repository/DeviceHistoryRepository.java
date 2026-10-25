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

    List<DeviceHistory> findAllByOrderByExecutedAtDesc();

    Page<DeviceHistory> findAllByOrderByExecutedAtDesc(Pageable pageable);

    Page<DeviceHistory> findAllByOrderByExecutedAtAsc(Pageable pageable);

    // Tìm bản ghi PENDING gần nhất của thiết bị để chuyển thành ON/OFF/SUCCESS khi
    // ESP32 ACK
    Optional<DeviceHistory> findTop1ByDevice_NameIgnoreCaseAndStatusOrderByExecutedAtDesc(String deviceName,
            String status);

    // Tìm tất cả bản ghi có status (PENDING) trước thời điểm threshold để xử lý timeout 5s
    List<DeviceHistory> findByStatusIgnoreCaseAndExecutedAtBefore(String status, java.time.LocalDateTime threshold);
}
