package com.iot.dashboard.repository;

import com.iot.dashboard.entity.DataSensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DataSensorRepository extends JpaRepository<DataSensor, Long> {

    // Lấy 45 bản ghi mới nhất (tương thích cũ)
    List<DataSensor> findTop45ByOrderByMeasuredAtDesc();

    // Lấy 60 bản ghi mới nhất (4 cảm biến x 15 chu kỳ = 15 điểm đồ thị)
    List<DataSensor> findTop60ByOrderByMeasuredAtDesc();

    // Lấy toàn bộ dữ liệu cảm biến gió trong khoảng thời gian để thống kê cảnh báo theo tháng
    @Query("SELECT d FROM DataSensor d WHERE LOWER(d.sensor.type) LIKE '%wind%' AND d.measuredAt >= :start AND d.measuredAt <= :end ORDER BY d.measuredAt ASC")
    List<DataSensor> findWindReadingsInRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    Page<DataSensor> findAllByOrderByMeasuredAtDesc(Pageable pageable);

    Page<DataSensor> findAllByOrderByMeasuredAtAsc(Pageable pageable);
}
