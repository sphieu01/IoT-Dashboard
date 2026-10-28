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
    public List<DataSensor> saveReading(Double temp, Double humidity, Double light, Double co2) {
        LocalDateTime now = LocalDateTime.now();

        Sensor sTemp = getOrCreateSensor("DHT11", "temperature");
        Sensor sHum = getOrCreateSensor("DHT11", "humidity");
        Sensor sLight = getOrCreateSensor("LDR", "light");
        Sensor sCo2 = getOrCreateSensor("MQ-135", "co2");

        float roundedTemp = temp != null ? (float) (Math.round(temp * 10.0) / 10.0) : 0.0f;
        float roundedHum = humidity != null ? (float) (Math.round(humidity * 10.0) / 10.0) : 0.0f;
        float roundedLight = light != null ? (float) Math.round(light) : 0.0f;
        float roundedCo2 = co2 != null ? (float) Math.round(co2) : 400.0f;

        DataSensor dTemp = new DataSensor(sTemp, roundedTemp, now);
        DataSensor dHum = new DataSensor(sHum, roundedHum, now);
        DataSensor dLight = new DataSensor(sLight, roundedLight, now);
        DataSensor dCo2 = new DataSensor(sCo2, roundedCo2, now);

        return dataSensorRepository.saveAll(Arrays.asList(dTemp, dHum, dLight, dCo2));
    }

    @Transactional
    public List<DataSensor> saveReading(Double temp, Double humidity, Double light) {
        // Tự động mô phỏng giá trị CO2 thực tế (400 - 650 ppm) nếu chưa có cảm biến vật lý
        double simulatedCo2 = 400.0 + (Math.random() * 250.0);
        return saveReading(temp, humidity, light, simulatedCo2);
    }

    // Lấy danh sách điểm cho 4 biểu đồ LiveChart (15 điểm mới nhất sắp xếp theo thời gian tăng dần)
    public List<LiveChartPointDto> getLatestChartPoints(int limit) {
        // Mỗi chu kỳ đo gồm 4 bản ghi (temp, hum, light, co2) -> lấy tối đa 60 bản ghi
        List<DataSensor> list = dataSensorRepository.findTop60ByOrderByMeasuredAtDesc();
        if (list.isEmpty()) {
            list = dataSensorRepository.findTop45ByOrderByMeasuredAtDesc();
        }

        // Nhóm các bản ghi theo thời điểm đo (giữ thứ tự chèn)
        Map<String, double[]> grouped = new LinkedHashMap<>();
        for (DataSensor d : list) {
            String timeKey = d.getMeasuredAt().format(timeFormatter);
            grouped.putIfAbsent(timeKey, new double[] { 0.0, 0.0, 0.0, 0.0 }); // [temp, hum, light, co2]
            double[] values = grouped.get(timeKey);

            String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
            if (type.contains("temp")) {
                values[0] = d.getValue();
            } else if (type.contains("hum")) {
                values[1] = d.getValue();
            } else if (type.contains("light")) {
                values[2] = d.getValue();
            } else if (type.contains("co2")) {
                values[3] = d.getValue();
            }
        }

        // Chuẩn hóa DTO
        List<LiveChartPointDto> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : grouped.entrySet()) {
            double[] val = entry.getValue();
            double roundedTemp = (double) Math.round(val[0] * 10.0) / 10.0;
            double roundedHum = (double) Math.round(val[1] * 10.0) / 10.0;
            double roundedLight = (double) Math.round(val[2]);
            double roundedCo2 = (double) Math.round(val[3] > 0 ? val[3] : 450.0);
            result.add(new LiveChartPointDto(entry.getKey(), roundedTemp, roundedHum, roundedLight, roundedCo2));
        }

        // Đảo ngược lại để theo thứ tự thời gian từ cũ -> mới (trái sang phải trên biểu đồ)
        Collections.reverse(result);

        if (result.size() > limit) {
            return result.subList(result.size() - limit, result.size());
        }
        return result;
    }

    // Đếm số lần vượt ngưỡng từ CSDL MySQL cho 4 cảm biến
    public Map<String, Long> getExceedanceCounts(Double tempThresh, Double humThresh, Double lightThresh, Double co2Thresh) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("temperature", tempThresh != null ? dataSensorRepository.countBySensorTypeAndValueGreaterThan("temperature", tempThresh.floatValue()) : 0L);
        counts.put("humidity", humThresh != null ? dataSensorRepository.countBySensorTypeAndValueGreaterThan("humidity", humThresh.floatValue()) : 0L);
        counts.put("light", lightThresh != null ? dataSensorRepository.countBySensorTypeAndValueGreaterThan("light", lightThresh.floatValue()) : 0L);
        counts.put("co2", co2Thresh != null ? dataSensorRepository.countBySensorTypeAndValueGreaterThan("co2", co2Thresh.floatValue()) : 0L);
        return counts;
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
                        String displaySensor = "Temperature";
                        String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
                        if (type.contains("temp")) {
                            displaySensor = "Temperature";
                        } else if (type.contains("hum")) {
                            displaySensor = "Humidity";
                        } else if (type.contains("light")) {
                            displaySensor = "Light";
                        } else if (type.contains("co2")) {
                            displaySensor = "CO2";
                        }
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
                    String displaySensor = "Temperature";
                    String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
                    if (type.contains("temp")) {
                        displaySensor = "Temperature";
                    } else if (type.contains("hum")) {
                        displaySensor = "Humidity";
                    } else if (type.contains("light")) {
                        displaySensor = "Light";
                    } else if (type.contains("co2")) {
                        displaySensor = "CO2";
                    }

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
                    } else if ("co2".equalsIgnoreCase(searchType)) {
                        if (!"co2".equalsIgnoreCase(displaySensor)) return false;
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
                    String displaySensor = "Temperature";
                    String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
                    if (type.contains("temp")) {
                        displaySensor = "Temperature";
                    } else if (type.contains("hum")) {
                        displaySensor = "Humidity";
                    } else if (type.contains("light")) {
                        displaySensor = "Light";
                    } else if (type.contains("co2")) {
                        displaySensor = "CO2";
                    }
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
}
