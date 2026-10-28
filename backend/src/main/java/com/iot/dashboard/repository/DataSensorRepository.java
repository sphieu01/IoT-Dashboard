package com.iot.dashboard.repository;

import com.iot.dashboard.entity.DataSensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataSensorRepository extends JpaRepository<DataSensor, Long> {

    // Lấy 60 bản ghi mới nhất (4 cảm biến x 15 chu kỳ = 15 điểm đồ thị)
    List<DataSensor> findTop60ByOrderByMeasuredAtDesc();

    List<DataSensor> findTop45ByOrderByMeasuredAtDesc();

    Page<DataSensor> findAllByOrderByMeasuredAtDesc(Pageable pageable);

    Page<DataSensor> findAllByOrderByMeasuredAtAsc(Pageable pageable);

    @Query("SELECT COUNT(d) FROM DataSensor d WHERE LOWER(d.sensor.type) LIKE LOWER(CONCAT('%', :type, '%')) AND d.value > :threshold")
    Long countBySensorTypeAndValueGreaterThan(@Param("type") String type, @Param("threshold") Float threshold);
}
