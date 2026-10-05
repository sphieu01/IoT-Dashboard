package com.iot.dashboard.repository;

import com.iot.dashboard.entity.SensorReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    
    // Lấy 15 điểm đo mới nhất cho Live Chart
    List<SensorReading> findTop15ByOrderByCreatedAtDesc();

    // Phân trang
    Page<SensorReading> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<SensorReading> findAllByOrderByCreatedAtAsc(Pageable pageable);
}
