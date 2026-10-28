package com.iot.dashboard.dto;

public class LiveChartPointDto {
    private String time; // "14:05:03"
    private Double temp;
    private Double humidity;
    private Double light;
    private Double co2;

    public LiveChartPointDto() {}

    public LiveChartPointDto(String time, Double temp, Double humidity, Double light) {
        this(time, temp, humidity, light, 0.0);
    }

    public LiveChartPointDto(String time, Double temp, Double humidity, Double light, Double co2) {
        this.time = time;
        this.temp = temp;
        this.humidity = humidity;
        this.light = light;
        this.co2 = co2;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public Double getTemp() {
        return temp;
    }

    public void setTemp(Double temp) {
        this.temp = temp;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getLight() {
        return light;
    }

    public void setLight(Double light) {
        this.light = light;
    }

    public Double getCo2() {
        return co2;
    }

    public void setCo2(Double co2) {
        this.co2 = co2;
    }
}
