package com.iot.dashboard.service;

import com.iot.dashboard.dto.LiveChartPointDto;
import com.iot.dashboard.dto.SensorFlatDto;
import com.iot.dashboard.entity.SensorReading;
import com.iot.dashboard.repository.SensorReadingRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SensorService {

    private final SensorReadingRepository sensorRepository;
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public SensorService(SensorReadingRepository sensorRepository) {
        this.sensorRepository = sensorRepository;
    }

    // Lưu bản ghi cảm biến mới nhận từ ESP32
    public SensorReading saveReading(Double temp, Double humidity, Double light) {
        SensorReading reading = new SensorReading(temp, humidity, light, LocalDateTime.now());
        return sensorRepository.save(reading);
    }

    // Lấy danh sách điểm cho biểu đồ LiveChart (15 điểm mới nhất sắp xếp theo thời gian tăng dần)
    public List<LiveChartPointDto> getLatestChartPoints(int limit) {
        List<SensorReading> list = sensorRepository.findTop15ByOrderByCreatedAtDesc();
        Collections.reverse(list); // Đảo ngược để vẽ đồ thị theo thứ tự thời gian từ trái qua phải

        List<LiveChartPointDto> result = new ArrayList<>();
        for (SensorReading r : list) {
            result.add(new LiveChartPointDto(
                    r.getCreatedAt().format(timeFormatter),
                    r.getTemperature(),
                    r.getHumidity(),
                    r.getLight()
            ));
        }
        return result;
    }

    // Lấy dữ liệu cho trang DataSensorPage (Phẳng hóa mỗi reading thành 3 hàng: Light, Humidity, Temperature)
    public Map<String, Object> getFlatSensors(String searchType, String query, String sort, int page, int perPage) {
        Sort sortOrder = "oldest".equalsIgnoreCase(sort) 
                ? Sort.by(Sort.Direction.ASC, "createdAt") 
                : Sort.by(Sort.Direction.DESC, "createdAt");
        
        List<SensorReading> readings = sensorRepository.findAll(sortOrder);

        // Biến đổi mỗi SensorReading thành các dòng phẳng
        List<SensorFlatDto> flatRows = new ArrayList<>();
        for (SensorReading r : readings) {
            String fullTime = r.getCreatedAt().format(fullTimeFormatter);
            long baseId = r.getId() != null ? r.getId() * 3 : flatRows.size() + 3;

            flatRows.add(new SensorFlatDto(baseId, "Light", r.getLight(), fullTime));
            flatRows.add(new SensorFlatDto(baseId - 1, "Humidity", r.getHumidity(), fullTime));
            flatRows.add(new SensorFlatDto(baseId - 2, "Temperature", r.getTemperature(), fullTime));
        }

        // Lọc theo searchType và query
        List<SensorFlatDto> filtered = flatRows.stream().filter(f -> {
            if (query == null || query.trim().isEmpty()) return true;
            String q = query.trim().toLowerCase();

            if ("all".equalsIgnoreCase(searchType) || searchType == null) {
                return f.getSensorType().toLowerCase().contains(q) ||
                       String.valueOf(f.getValue()).contains(q) ||
                       f.getFullTime().toLowerCase().contains(q);
            }
            if ("light".equalsIgnoreCase(searchType)) {
                return "Light".equalsIgnoreCase(f.getSensorType()) && String.valueOf(f.getValue()).contains(q);
            }
            if ("humidity".equalsIgnoreCase(searchType)) {
                return "Humidity".equalsIgnoreCase(f.getSensorType()) && String.valueOf(f.getValue()).contains(q);
            }
            if ("temp".equalsIgnoreCase(searchType)) {
                return "Temperature".equalsIgnoreCase(f.getSensorType()) && String.valueOf(f.getValue()).contains(q);
            }
            if ("time".equalsIgnoreCase(searchType)) {
                return f.getFullTime().toLowerCase().contains(q);
            }
            return true;
        }).collect(Collectors.toList());

        // Phân trang
        int totalItems = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / perPage));
        int currentPage = Math.max(1, Math.min(page, totalPages));

        int fromIndex = (currentPage - 1) * perPage;
        int toIndex = Math.min(fromIndex + perPage, totalItems);

        List<SensorFlatDto> pageData = (fromIndex <= totalItems) ? filtered.subList(fromIndex, toIndex) : Collections.emptyList();

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageData);
        response.put("total", totalItems);
        response.put("page", currentPage);
        response.put("totalPages", totalPages);
        response.put("perPage", perPage);

        return response;
    }
}
