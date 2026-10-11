package com.iot.dashboard.repository;

import com.iot.dashboard.entity.DataSensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataSensorRepository extends JpaRepository<DataSensor, Long> {

    // Lấy 45 bản ghi mới nhất (3 cảm biến x 15 chu kỳ = 15 điểm đồ thị)
    List<DataSensor> findTop45ByOrderByMeasuredAtDesc();

    Page<DataSensor> findAllByOrderByMeasuredAtDesc(Pageable pageable);

    Page<DataSensor> findAllByOrderByMeasuredAtAsc(Pageable pageable);
}
