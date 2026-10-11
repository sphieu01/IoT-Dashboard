package com.iot.dashboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_datasensors", indexes = {
    @Index(name = "idx_datasensors_sensor_id", columnList = "sensor_id"),
    @Index(name = "idx_datasensors_measured_at", columnList = "measured_at")
})
public class DataSensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @Column(nullable = false)
    private Float value;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    public DataSensor() {
        this.measuredAt = LocalDateTime.now();
    }

    public DataSensor(Sensor sensor, Float value, LocalDateTime measuredAt) {
        this.sensor = sensor;
        this.value = value;
        this.measuredAt = measuredAt != null ? measuredAt : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Sensor getSensor() {
        return sensor;
    }

    public void setSensor(Sensor sensor) {
        this.sensor = sensor;
    }

    public Float getValue() {
        return value;
    }

    public void setValue(Float value) {
        this.value = value;
    }

    public LocalDateTime getMeasuredAt() {
        return measuredAt;
    }

    public void setMeasuredAt(LocalDateTime measuredAt) {
        this.measuredAt = measuredAt;
    }
}
