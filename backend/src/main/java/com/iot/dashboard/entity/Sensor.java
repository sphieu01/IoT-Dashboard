package com.iot.dashboard.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_sensors")
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name; // VD: DHT11, LDR

    @Column(nullable = false, length = 50)
    private String type; // VD: temperature, humidity, light

    public Sensor() {
    }

    public Sensor(String name, String type) {
        this.name = name;
        this.type = type;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
