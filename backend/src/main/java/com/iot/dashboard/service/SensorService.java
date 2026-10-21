package com.iot.dashboard.service;

import com.iot.dashboard.dto.LiveChartPointDto;
import com.iot.dashboard.dto.SensorFlatDto;
import com.iot.dashboard.entity.DataSensor;
import com.iot.dashboard.entity.Sensor;
import com.iot.dashboard.repository.DataSensorRepository;
import com.iot.dashboard.repository.SensorRepository;
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

    // Lưu bản ghi cảm biến mới nhận từ ESP32 vào tbl_datasensors (tách thành 3 bản
    // ghi chuẩn hóa)
    @Transactional
    public List<DataSensor> saveReading(Double temp, Double humidity, Double light) {
        LocalDateTime now = LocalDateTime.now();

        Sensor sTemp = getOrCreateSensor("DHT11", "temperature");
        Sensor sHum = getOrCreateSensor("DHT11", "humidity");
        Sensor sLight = getOrCreateSensor("LDR", "light");

        float roundedTemp = temp != null ? (float) (Math.round(temp * 10.0) / 10.0) : 0.0f;
        float roundedHum = humidity != null ? (float) (Math.round(humidity * 10.0) / 10.0) : 0.0f;
        float roundedLight = light != null ? (float) Math.round(light) : 0.0f;

        DataSensor dTemp = new DataSensor(sTemp, roundedTemp, now);
        DataSensor dHum = new DataSensor(sHum, roundedHum, now);
        DataSensor dLight = new DataSensor(sLight, roundedLight, now);

        return dataSensorRepository.saveAll(Arrays.asList(dTemp, dHum, dLight));
    }

    // Lấy danh sách điểm cho biểu đồ LiveChart (15 điểm mới nhất sắp xếp theo thời
    // gian tăng dần)
    public List<LiveChartPointDto> getLatestChartPoints(int limit) {
        // Mỗi chu kỳ đo gồm 3 bản ghi (temp, hum, light) -> lấy tối đa 45 bản ghi
        List<DataSensor> list = dataSensorRepository.findTop45ByOrderByMeasuredAtDesc();

        // Nhóm các bản ghi theo thời điểm đo (giữ thứ tự chèn)
        Map<String, double[]> grouped = new LinkedHashMap<>();
        for (DataSensor d : list) { // gom nhóm cùng thời gian
            String timeKey = d.getMeasuredAt().format(timeFormatter);
            grouped.putIfAbsent(timeKey, new double[] { 0.0, 0.0, 0.0 }); // [temp, hum, light]
            double[] values = grouped.get(timeKey);

            String type = d.getSensor() != null ? d.getSensor().getType().toLowerCase() : "";
            if (type.contains("temp")) {
                values[0] = d.getValue();
            } else if (type.contains("hum")) {
                values[1] = d.getValue();
            } else if (type.contains("light")) {
                values[2] = d.getValue();
            }
        }
        // chuẩn hóa
        List<LiveChartPointDto> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : grouped.entrySet()) {
            double[] val = entry.getValue();
            double roundedTemp = (double) Math.round(val[0] * 10.0) / 10.0;
            double roundedHum = (double) Math.round(val[1] * 10.0) / 10.0;
            double roundedLight = (double) Math.round(val[2]);
            result.add(new LiveChartPointDto(entry.getKey(), roundedTemp, roundedHum, roundedLight));
        }

        // Đảo ngược lại để theo thứ tự thời gian từ cũ -> mới (trái sang phải trên biểu
        // đồ)
        Collections.reverse(result);

        if (result.size() > limit) {
            return result.subList(result.size() - limit, result.size());
        }
        return result;
    }

    // Lấy dữ liệu cho trang DataSensorPage từ bảng tbl_datasensors
    public Map<String, Object> getFlatSensors(String searchType, String query, String sort, int page, int perPage) {
        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Order.asc("measuredAt"), Sort.Order.asc("id"))
                : Sort.by(Sort.Order.desc("measuredAt"), Sort.Order.desc("id"));

        // Lấy toàn bộ từ DB theo thứ tự sắp xếp để lọc trước
        List<DataSensor> allData = dataSensorRepository.findAll(sortOrder);

        final int MAX_FETCH = 1000;
        String q = (query != null) ? query.trim().toLowerCase() : "";

        // 1. Lọc trước trên toàn bộ dữ liệu (Filter first)
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
                    }

                    double roundedVal = (double) Math.round(d.getValue() * 10.0) / 10.0;
                    String valStr = String.valueOf(roundedVal);

                    if ("temperature".equalsIgnoreCase(searchType) || "temp".equalsIgnoreCase(searchType)) {
                        if (!"temperature".equalsIgnoreCase(displaySensor)) return false;
                        return q.isEmpty() || valStr.contains(q);
                    } else if ("humidity".equalsIgnoreCase(searchType) || "humid".equalsIgnoreCase(searchType)) {
                        if (!"humidity".equalsIgnoreCase(displaySensor)) return false;
                        return q.isEmpty() || valStr.contains(q);
                    } else if ("light".equalsIgnoreCase(searchType)) {
                        if (!"light".equalsIgnoreCase(displaySensor)) return false;
                        return q.isEmpty() || valStr.contains(q);
                    } else if ("time".equalsIgnoreCase(searchType)) {
                        return q.isEmpty() || fullTime.toLowerCase().contains(q);
                    } else { // "all"
                        if (q.isEmpty()) return true;
                        return displaySensor.toLowerCase().contains(q) ||
                                valStr.contains(q) ||
                                fullTime.toLowerCase().contains(q);
                    }
                })
                .limit(MAX_FETCH) // 2. Lọc xong mới lấy 1000 dòng đầu tiên (Limit 1000 after filter)
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
                    }
                    return new SensorFlatDto(
                            d.getId(),
                            displaySensor,
                            (double) Math.round(d.getValue() * 10.0) / 10.0,
                            fullTime);
                })
                .collect(Collectors.toList());

        int pageSize = Math.min(Math.max(perPage, 1), MAX_FETCH);
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
