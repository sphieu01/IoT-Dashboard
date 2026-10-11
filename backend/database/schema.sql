-- ==============================================================
-- IoT Dashboard - MySQL Database Schema (Cách B)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `iot_dashboard` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `iot_dashboard`;

-- --------------------------------------------------------------
-- Bảng 2: tbl_sensors (Danh mục cảm biến)
-- --------------------------------------------------------------
DROP TABLE IF EXISTS `tbl_datasensors`;
DROP TABLE IF EXISTS `tbl_sensors`;

CREATE TABLE `tbl_sensors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên cảm biến (VD: DHT11, LDR)',
    `type` VARCHAR(50) NOT NULL COMMENT 'Loại (VD: temperature, humidity, light)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dữ liệu ban đầu cho cảm biến
INSERT INTO `tbl_sensors` (`id`, `name`, `type`) VALUES
(1, 'DHT11', 'temperature'),
(2, 'DHT11', 'humidity'),
(3, 'LDR', 'light');

-- --------------------------------------------------------------
-- Bảng 3: tbl_devices (Danh mục thiết bị điều khiển)
-- --------------------------------------------------------------
DROP TABLE IF EXISTS `history`;
DROP TABLE IF EXISTS `tbl_devices`;

CREATE TABLE `tbl_devices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên thiết bị (VD: Light, Fan)',
    `current_status` VARCHAR(10) NOT NULL DEFAULT 'OFF' COMMENT 'Trạng thái hiện tại (ON / OFF)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dữ liệu ban đầu cho thiết bị
INSERT INTO `tbl_devices` (`id`, `name`, `current_status`) VALUES
(1, 'Light', 'OFF'),
(2, 'Fan', 'OFF');

-- --------------------------------------------------------------
-- Bảng 4: tbl_datasensors (Lịch sử dữ liệu đo cảm biến)
-- --------------------------------------------------------------
CREATE TABLE `tbl_datasensors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `sensor_id` INT NOT NULL COMMENT 'Khóa ngoại liên kết tới tbl_sensors.id',
    `value` FLOAT NOT NULL COMMENT 'Giá trị đo được',
    `measured_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian đo',
    CONSTRAINT `fk_datasensors_sensor` FOREIGN KEY (`sensor_id`) REFERENCES `tbl_sensors` (`id`) ON DELETE CASCADE,
    INDEX `idx_datasensors_sensor_id` (`sensor_id`),
    INDEX `idx_datasensors_measured_at` (`measured_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- Bảng 5: history (Lịch sử thao tác bật/tắt thiết bị)
-- --------------------------------------------------------------
CREATE TABLE `history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `device_id` INT NOT NULL COMMENT 'Khóa ngoại liên kết tới tbl_devices.id',
    `action` VARCHAR(20) NOT NULL COMMENT 'Lệnh gửi (ON / OFF)',
    `status` VARCHAR(20) NOT NULL COMMENT 'Phản hồi (SUCCESS / ERROR / PENDING / ON / OFF)',
    `executed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thực thi',
    CONSTRAINT `fk_history_device` FOREIGN KEY (`device_id`) REFERENCES `tbl_devices` (`id`) ON DELETE CASCADE,
    INDEX `idx_history_device_id` (`device_id`),
    INDEX `idx_history_executed_at` (`executed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
