package com.iot.dashboard.service;

import com.iot.dashboard.dto.LiveChartPointDto;
import com.iot.dashboard.dto.SensorFlatDto;
import com.iot.dashboard.entity.DataSensor;
import com.iot.dashboard.entity.Sensor;
import com.iot.dashboard.repository.DataSensorRepository;
import com.iot.dashboard.repository.SensorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SensorService {

    private final DataSensorRepository dataSensorRepository;
    private final SensorRepository sensorRepository;
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public SensorService(DataSensorRepository dataSensorRepository, SensorRepository sensorRepository) {
        this.dataSensorRepository = dataSensorRepository;
        this.sensorRepository = sensorRepository;
    }

    private Sensor getOrCreateSensor(String name, String type) {
        return sensorRepository.findByType(type)
                .orElseGet(() -> sensorRepository.save(new Sensor(name, type)));
    }

    // Lưu bản ghi cảm biến mới nhận từ ESP32 vào tbl_datasensors (tách thành 4 bản ghi chuẩn hóa)
    @Transactional
    public List<DataSensor> saveReading(Double temp, Double humidity, Double light, Double windSpeed) {
        LocalDateTime now = LocalDateTime.now();

        Sensor sTemp = getOrCreateSensor("DHT11", "temperature");
        Sensor sHum = getOrCreateSensor("DHT11", "humidity");
        Sensor sLight = getOrCreateSensor("LDR", "light");
        Sensor sWind = getOrCreateSensor("Anemometer", "wind-speed");

        float roundedTemp = temp != null ? (float) (Math.round(temp * 10.0) / 10.0) : 0.0f;
        float roundedHum = humidity != null ? (float) (Math.round(humidity * 10.0) / 10.0) : 0.0f;
        float roundedLight = light != null ? (float) Math.round(light) : 0.0f;
        float roundedWind = windSpeed != null ? (float) (Math.round(windSpeed * 10.0) / 10.0) : 0.0f;

        DataSensor dTemp = new DataSensor(sTemp, roundedTemp, now);
        DataSensor dHum = new DataSensor(sHum, roundedHum, now);
        DataSensor dLight = new DataSensor(sLight, roundedLight, now);
        DataSensor dWind = new DataSensor(sWind, roundedWind, now);

        return dataSensorRepository.saveAll(Arrays.asList(dTemp, dHum, dLight, dWind));
    }

    @Transactional
    public List<DataSensor> saveReading(Double temp, Double humidity, Double light) {
        return saveReading(temp, humidity, light, 0.0);
    }

    // Lấy danh sách điểm cho biểu đồ LiveChart (15 điểm mới nhất sắp xếp theo thời gian tăng dần)
    public List<LiveChartPointDto> getLatestChartPoints(int limit) {
        // Mỗi chu kỳ đo gồm 4 bản ghi (temp, hum, light, wind) -> lấy tối đa 60 bản ghi
        List<DataSensor> list = dataSensorRepository.findTop60ByOrderByMeasuredAtDesc();

        // Nhóm các bản ghi theo thời điểm đo (giữ thứ tự chèn)
        Map<String, double[]> grouped = new LinkedHashMap<>();
        for (DataSensor d : list) { // gom nhóm cùng thời gian
            String timeKey = d.getMeasuredAt().format(timeFormatter);
            grouped.putIfAbsent(timeKey, new double[] { 0.0, 0.0, 0.0, 0.0 }); // [temp, hum, light, windSpeed]
            double[] values = grouped.get(timeKey);

            String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
            if (type.contains("temp")) {
                values[0] = d.getValue();
            } else if (type.contains("hum")) {
                values[1] = d.getValue();
            } else if (type.contains("light")) {
                values[2] = d.getValue();
            } else if (type.contains("wind")) {
                values[3] = d.getValue();
            }
        }
        // chuẩn hóa
        List<LiveChartPointDto> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : grouped.entrySet()) {
            double[] val = entry.getValue();
            double roundedTemp = (double) Math.round(val[0] * 10.0) / 10.0;
            double roundedHum = (double) Math.round(val[1] * 10.0) / 10.0;
            double roundedLight = (double) Math.round(val[2]);
            double roundedWind = (double) Math.round(val[3] * 10.0) / 10.0;
            result.add(new LiveChartPointDto(entry.getKey(), roundedTemp, roundedHum, roundedLight, roundedWind));
        }

        // Đảo ngược lại để theo thứ tự thời gian từ cũ -> mới (trái sang phải trên biểu đồ)
        Collections.reverse(result);

        if (result.size() > limit) {
            return result.subList(result.size() - limit, result.size());
        }
        return result;
    }

    private String mapSensorDisplayName(DataSensor d) {
        String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
        if (type.contains("temp")) {
            return "Temperature";
        } else if (type.contains("hum")) {
            return "Humidity";
        } else if (type.contains("light")) {
            return "Light";
        } else if (type.contains("wind")) {
            return "Wind Speed";
        }
        return "Unknown";
    }

    // Lấy dữ liệu cho trang DataSensorPage từ bảng tbl_datasensors
    public Map<String, Object> getFlatSensors(String searchType, String query, String sort, int page, int perPage) {
        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Order.asc("measuredAt"), Sort.Order.asc("id"))
                : Sort.by(Sort.Order.desc("measuredAt"), Sort.Order.desc("id"));

        final int MAX_FETCH = 1000;
        int pageSize = Math.min(Math.max(perPage, 1), MAX_FETCH);
        String q = (query != null) ? query.trim().toLowerCase() : "";

        // TỐI ƯU HÓA: Khi không tìm kiếm -> Phân trang trực tiếp tại MySQL (LIMIT 8 OFFSET ...) siêu tốc ~1ms
        if (q.isEmpty()) {
            long totalDb = dataSensorRepository.count();
            int total = (int) Math.min(totalDb, MAX_FETCH);
            int totalPages = Math.max(1, (int) Math.ceil((double) total / pageSize));
            int safePage = Math.min(Math.max(page, 1), totalPages);

            Pageable pageable = PageRequest.of(safePage - 1, pageSize, sortOrder);
            Page<DataSensor> dbPage = dataSensorRepository.findAll(pageable);

            List<SensorFlatDto> pagedData = dbPage.getContent().stream()
                    .map(d -> {
                        String fullTime = d.getMeasuredAt().format(fullTimeFormatter);
                        String displaySensor = mapSensorDisplayName(d);
                        return new SensorFlatDto(
                                d.getId(),
                                displaySensor,
                                (double) Math.round(d.getValue() * 10.0) / 10.0,
                                fullTime);
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("data", pagedData);
            response.put("total", total);
            response.put("totalPages", totalPages);
            response.put("currentPage", safePage);
            return response;
        }

        // Khi có từ khóa tìm kiếm: Chỉ kéo tối đa 1000 bản ghi mới nhất từ DB để lọc (không bao giờ kéo toàn bộ bảng)
        Pageable fetchLimit = PageRequest.of(0, MAX_FETCH, sortOrder);
        List<DataSensor> allData = dataSensorRepository.findAll(fetchLimit).getContent();

        List<SensorFlatDto> filtered = allData.stream()
                .filter(d -> {
                    String fullTime = d.getMeasuredAt().format(fullTimeFormatter);
                    String displaySensor = mapSensorDisplayName(d);

                    double roundedVal = (double) Math.round(d.getValue() * 10.0) / 10.0;
                    String valStr = String.valueOf(roundedVal);
                    String intValStr = String.valueOf(Math.round(d.getValue()));

                    if ("temperature".equalsIgnoreCase(searchType) || "temp".equalsIgnoreCase(searchType)) {
                        if (!"temperature".equalsIgnoreCase(displaySensor)) return false;
                        return valStr.contains(q) || intValStr.contains(q);
                    } else if ("humidity".equalsIgnoreCase(searchType) || "humid".equalsIgnoreCase(searchType)) {
                        if (!"humidity".equalsIgnoreCase(displaySensor)) return false;
                        return valStr.contains(q) || intValStr.contains(q);
                    } else if ("light".equalsIgnoreCase(searchType)) {
                        if (!"light".equalsIgnoreCase(displaySensor)) return false;
                        return valStr.contains(q) || intValStr.contains(q);
                    } else if ("wind".equalsIgnoreCase(searchType) || "windspeed".equalsIgnoreCase(searchType) || "wind-speed".equalsIgnoreCase(searchType) || "wind_speed".equalsIgnoreCase(searchType)) {
                        if (!"wind speed".equalsIgnoreCase(displaySensor)) return false;
                        return valStr.contains(q) || intValStr.contains(q);
                    } else if ("time".equalsIgnoreCase(searchType)) {
                        return fullTime.toLowerCase().contains(q);
                    } else { // "all"
                        return displaySensor.toLowerCase().contains(q) ||
                                valStr.contains(q) ||
                                intValStr.contains(q) ||
                                fullTime.toLowerCase().contains(q);
                    }
                })
                .map(d -> {
                    String fullTime = d.getMeasuredAt().format(fullTimeFormatter);
                    String displaySensor = mapSensorDisplayName(d);
                    return new SensorFlatDto(
                            d.getId(),
                            displaySensor,
                            (double) Math.round(d.getValue() * 10.0) / 10.0,
                            fullTime);
                })
                .collect(Collectors.toList());

        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / pageSize));
        int safePage = Math.min(Math.max(page, 1), totalPages);
        int fromIndex = Math.min((safePage - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);

        List<SensorFlatDto> pagedData = filtered.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pagedData);
        response.put("total", total);
        response.put("totalPages", totalPages);
        response.put("currentPage", safePage);

        return response;
    }

    // Thống kê cảnh báo theo tháng (số cảnh báo / ngày khi wind-speed > 300)
    public Map<String, Object> getMonthlyAlertStatistics(int year, int month) {
        java.time.YearMonth yearMonth = java.time.YearMonth.of(year, month);
        LocalDateTime startDt = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDt = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        List<DataSensor> windReadings = dataSensorRepository.findWindReadingsInRange(startDt, endDt);

        int daysInMonth = yearMonth.lengthOfMonth();
        int[] alertCounts = new int[daysInMonth + 1];
        double[] maxWindSpeeds = new double[daysInMonth + 1];
        int[] totalReadings = new int[daysInMonth + 1];

        int totalAlerts = 0;
        double maxMonthlyWindSpeed = 0.0;

        for (DataSensor d : windReadings) {
            int day = d.getMeasuredAt().getDayOfMonth();
            double val = (double) Math.round(d.getValue() * 10.0) / 10.0;
            totalReadings[day]++;
            if (val > maxWindSpeeds[day]) {
                maxWindSpeeds[day] = val;
            }
            if (val > maxMonthlyWindSpeed) {
                maxMonthlyWindSpeed = val;
            }
            if (val > 300.0) {
                alertCounts[day]++;
                totalAlerts++;
            }
        }

        int peakDay = 1;
        int maxDayAlerts = 0;
        int daysWithAlerts = 0;

        List<Map<String, Object>> dailyList = new ArrayList<>();
        for (int day = 1; day <= daysInMonth; day++) {
            int count = alertCounts[day];
            if (count > maxDayAlerts) {
                maxDayAlerts = count;
                peakDay = day;
            }
            if (count > 0) {
                daysWithAlerts++;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("day", day);
            item.put("date", String.format("%04d-%02d-%02d", year, month, day));
            item.put("alertCount", count);
            item.put("maxWindSpeed", (double) Math.round(maxWindSpeeds[day] * 10.0) / 10.0);
            item.put("totalReadings", totalReadings[day]);
            dailyList.add(item);
        }

        Map<String, Object> peakDayMap = new HashMap<>();
        peakDayMap.put("day", peakDay);
        peakDayMap.put("count", maxDayAlerts);

        Map<String, Object> response = new HashMap<>();
        response.put("year", year);
        response.put("month", month);
        response.put("totalAlerts", totalAlerts);
        response.put("peakDay", peakDayMap);
        response.put("maxMonthlyWindSpeed", (double) Math.round(maxMonthlyWindSpeed * 10.0) / 10.0);
        response.put("daysWithAlerts", daysWithAlerts);
        response.put("safeDays", daysInMonth - daysWithAlerts);
        response.put("dailyCounts", dailyList);

        return response;
    }
}
