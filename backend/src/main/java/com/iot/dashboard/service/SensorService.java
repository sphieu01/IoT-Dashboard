package com.iot.dashboard.service;

import com.iot.dashboard.dto.LiveChartPointDto;
import com.iot.dashboard.dto.SensorFlatDto;
import com.iot.dashboard.entity.DataSensor;
import com.iot.dashboard.entity.Sensor;
import com.iot.dashboard.repository.DataSensorRepository;
import com.iot.dashboard.repository.SensorRepository;
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

    // Lưu bản ghi cảm biến mới nhận từ ESP32 vào tbl_datasensors (tách thành 3 bản ghi chuẩn hóa)
    @Transactional
    public List<DataSensor> saveReading(Double temp, Double humidity, Double light) {
        LocalDateTime now = LocalDateTime.now();

        Sensor sTemp = getOrCreateSensor("DHT11", "temperature");
        Sensor sHum = getOrCreateSensor("DHT11", "humidity");
        Sensor sLight = getOrCreateSensor("LDR", "light");

        DataSensor dTemp = new DataSensor(sTemp, temp != null ? temp.floatValue() : 0.0f, now);
        DataSensor dHum = new DataSensor(sHum, humidity != null ? humidity.floatValue() : 0.0f, now);
        DataSensor dLight = new DataSensor(sLight, light != null ? light.floatValue() : 0.0f, now);

        return dataSensorRepository.saveAll(Arrays.asList(dTemp, dHum, dLight));
    }

    // Lấy danh sách điểm cho biểu đồ LiveChart (15 điểm mới nhất sắp xếp theo thời gian tăng dần)
    public List<LiveChartPointDto> getLatestChartPoints(int limit) {
        // Mỗi chu kỳ đo gồm 3 bản ghi (temp, hum, light) -> lấy tối đa 45 bản ghi
        List<DataSensor> list = dataSensorRepository.findTop45ByOrderByMeasuredAtDesc();

        // Nhóm các bản ghi theo thời điểm đo (giữ thứ tự chèn)
        Map<String, double[]> grouped = new LinkedHashMap<>();
        for (DataSensor d : list) {
            String timeKey = d.getMeasuredAt().format(timeFormatter);
            grouped.putIfAbsent(timeKey, new double[]{0.0, 0.0, 0.0}); // [temp, hum, light]
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

        List<LiveChartPointDto> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : grouped.entrySet()) {
            double[] val = entry.getValue();
            result.add(new LiveChartPointDto(entry.getKey(), val[0], val[1], val[2]));
        }

        // Đảo ngược lại để theo thứ tự thời gian từ cũ -> mới (trái sang phải trên biểu đồ)
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

        List<DataSensor> allData = dataSensorRepository.findAll(sortOrder);

        // Chuyển đổi DataSensor thành SensorFlatDto cho bảng trên Web
        List<SensorFlatDto> flatRows = new ArrayList<>();
        for (DataSensor d : allData) {
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

            flatRows.add(new SensorFlatDto(
                    d.getId(),
                    displaySensor,
                    (double) Math.round(d.getValue() * 10.0) / 10.0,
                    fullTime
            ));
        }

        // Lọc theo searchType và query
        List<SensorFlatDto> filtered = flatRows.stream().filter(f -> {
            if (query == null || query.trim().isEmpty()) return true;
            String q = query.trim().toLowerCase();

            if ("temperature".equalsIgnoreCase(searchType) || "temp".equalsIgnoreCase(searchType)) {
                return "temperature".equalsIgnoreCase(f.getSensorType()) && String.valueOf(f.getValue()).contains(q);
            } else if ("humidity".equalsIgnoreCase(searchType) || "humid".equalsIgnoreCase(searchType)) {
                return "humidity".equalsIgnoreCase(f.getSensorType()) && String.valueOf(f.getValue()).contains(q);
            } else if ("light".equalsIgnoreCase(searchType)) {
                return "light".equalsIgnoreCase(f.getSensorType()) && String.valueOf(f.getValue()).contains(q);
            } else if ("time".equalsIgnoreCase(searchType)) {
                return f.getFullTime().toLowerCase().contains(q);
            } else {
                return f.getSensorType().toLowerCase().contains(q) ||
                       String.valueOf(f.getValue()).contains(q) ||
                       f.getFullTime().toLowerCase().contains(q);
            }
        }).collect(Collectors.toList());

        int total = filtered.size();
        int totalPages = (int) Math.ceil((double) total / perPage);
        int fromIndex = Math.min((page - 1) * perPage, total);
        int toIndex = Math.min(fromIndex + perPage, total);

        List<SensorFlatDto> pagedData = filtered.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pagedData);
        response.put("total", total);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);

        return response;
    }
}
