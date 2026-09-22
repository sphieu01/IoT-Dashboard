/**
 * IoT Dashboard - Backend Server (Express + MQTT Ready)
 */
const express = require('express')
const cors = require('cors')
const http = require('http')
const mqtt = require('mqtt')

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// In-memory state for initial demo (Có thể thay thế bằng MongoDB / MySQL / SQLite)
const devicesState = {
  light: false,
  fan: false,
}

let historyLogs = [
  { id: 1, device: 'Fan', action: 'OFF', status: 'OFF', fullTime: '10:39:38 3/10/2025' },
  { id: 2, device: 'Fan', action: 'ON', status: 'ON', fullTime: '10:36:12 3/10/2025' },
  { id: 3, device: 'Light', action: 'OFF', status: 'OFF', fullTime: '10:18:54 3/10/2025' },
]

let sensorData = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  temp: +(29 + Math.random() * 2).toFixed(1),
  humidity: +(77 + Math.random() * 2).toFixed(1),
  light: +(700 + Math.random() * 300).toFixed(4),
  fullTime: new Date().toLocaleString(),
}))

// --- MQTT Setup (Tùy chọn kết nối Broker thực tế) ---
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883'
const MQTT_TOPIC_SENSOR = 'iot/dashboard/sensors'
const MQTT_TOPIC_COMMAND = 'iot/dashboard/commands'

let mqttClient = null
try {
  mqttClient = mqtt.connect(MQTT_BROKER)
  mqttClient.on('connect', () => {
    console.log(`[MQTT] Connected to broker: ${MQTT_BROKER}`)
    mqttClient.subscribe(MQTT_TOPIC_SENSOR, (err) => {
      if (!err) console.log(`[MQTT] Subscribed to ${MQTT_TOPIC_SENSOR}`)
    })
  })

  mqttClient.on('message', (topic, message) => {
    if (topic === MQTT_TOPIC_SENSOR) {
      try {
        const payload = JSON.parse(message.toString())
        sensorData.unshift({
          id: sensorData.length + 1,
          ...payload,
          fullTime: new Date().toLocaleString(),
        })
        if (sensorData.length > 100) sensorData.pop()
      } catch (err) {
        console.error('[MQTT] Parse error:', err.message)
      }
    }
  })
} catch (err) {
  console.log('[MQTT] MQTT connection skipped or failed:', err.message)
}

// --- REST API Endpoints ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// 2. Lấy dữ liệu telemetry cảm biến
app.get('/api/sensors', (req, res) => {
  const limit = parseInt(req.query.limit) || 30
  res.json(sensorData.slice(0, limit))
})

// 3. Lấy trạng thái hiện tại của thiết bị
app.get('/api/devices/status', (req, res) => {
  res.json(devicesState)
})

// 4. Bật / Tắt thiết bị (Gửi lệnh điều khiển & xuất bản MQTT)
app.post('/api/devices/toggle', (req, res) => {
  const { device, action } = req.body // device: 'Light' | 'Fan', action: 'ON' | 'OFF'

  if (!device || !action) {
    return res.status(400).json({ error: 'Missing device or action parameter' })
  }

  const deviceKey = device.toLowerCase()
  devicesState[deviceKey] = action === 'ON'

  // Xuất bản lệnh điều khiển qua MQTT Broker tới ESP32 / Arduino
  if (mqttClient && mqttClient.connected) {
    const payload = JSON.stringify({ device, action, timestamp: Date.now() })
    mqttClient.publish(MQTT_TOPIC_COMMAND, payload)
  }

  // Mô phỏng phản hồi trạng thái từ phần cứng
  const newLog = {
    id: historyLogs.length + 1,
    device,
    action,
    status: action,
    fullTime: new Date().toLocaleString(),
  }

  historyLogs.unshift(newLog)
  res.json(newLog)
})

// 5. Lấy danh sách lịch sử thao tác
app.get('/api/devices/logs', (req, res) => {
  res.json(historyLogs)
})

// 6. Thông tin sinh viên / profile
app.get('/api/profile', (req, res) => {
  res.json({
    name: 'Đào Trung Hiếu',
    studentId: 'B23DCCN298',
    className: 'D23CNPM02',
    university: 'PTIT',
    role: 'Software Engineer',
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`[Backend] IoT Dashboard server is running on http://localhost:${PORT}`)
})
