package com.iot.dashboard.dto;

public class SensorFlatDto {
    private Long id;
    private String sensorType; // 'Light' | 'Humidity' | 'Temperature'
    private Double value;
    private String fullTime;

    public SensorFlatDto() {}

    public SensorFlatDto(Long id, String sensorType, Double value, String fullTime) {
        this.id = id;
        this.sensorType = sensorType;
        this.value = value;
        this.fullTime = fullTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSensorType() {
        return sensorType;
    }

    public void setSensorType(String sensorType) {
        this.sensorType = sensorType;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public String getFullTime() {
        return fullTime;
    }

    public void setFullTime(String fullTime) {
        this.fullTime = fullTime;
    }
}
