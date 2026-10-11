package com.iot.dashboard.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_devices")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name; // VD: Light, Fan (Đèn, Quạt)

    @Column(name = "current_status", nullable = false, length = 10)
    private String currentStatus; // ON, OFF

    public Device() {
        this.currentStatus = "OFF";
    }

    public Device(String name, String currentStatus) {
        this.name = name;
        this.currentStatus = currentStatus != null ? currentStatus : "OFF";
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(String currentStatus) {
        this.currentStatus = currentStatus;
    }
}
