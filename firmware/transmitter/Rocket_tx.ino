 #include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <TinyGPS++.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BMP280.h>
#include <MPU6050.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

TinyGPSPlus gps;
HardwareSerial GPS(2);
#define SEA_LEVEL_PRESSURE 1000.6
Adafruit_BMP280 bmp;
MPU6050 mpu;

// LoRa
#define LORA_SS     5
#define LORA_RST    14
#define LORA_DIO0   2

// GPS
#define GPS_RX      16
#define GPS_TX      17

// I2C
#define SDA_PIN     21
#define SCL_PIN     22

// Vibration
#define VIB_PIN     27

int16_t ax, ay, az;
int16_t gx, gy, gz;

float roll = 0;
float pitch = 0;

float temperature = 0;
float pressure = 0;
float altitude = 0;
float groundAltitude = 0;

bool vibration = false;

long packetNo = 0;



void setup()
{
  Serial.begin(115200);

  Wire.begin(SDA_PIN, SCL_PIN);

  GPS.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  pinMode(VIB_PIN, INPUT);

  // OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC,0x3C))
  {
    while(1);
  }

  display.clearDisplay();
  display.setTextSize(1);
display.setTextColor(SSD1306_WHITE);

  // MPU6050
  mpu.initialize();

 // if (!mpu.testConnection())
//{
//    Serial.println("MPU6050 Connection Failed!");
  //  while (1);
//}

  // BMP280
if (!bmp.begin(0x76) && !bmp.begin(0x77))
{
    Serial.println("BMP280 not found!");
    while (1);
}
delay(1000);
  // Store Ground Altitude
  groundAltitude = bmp.readAltitude(SEA_LEVEL_PRESSURE);

  // LORA
  LoRa.setPins(LORA_SS,LORA_RST,LORA_DIO0);

  if(!LoRa.begin(433E6))
  {
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("LoRa Failed");
    display.display();

    while(1);
  }

  LoRa.setTxPower(20);

  LoRa.setSpreadingFactor(9);

  LoRa.setSignalBandwidth(125E3);

  LoRa.setCodingRate4(5);

  LoRa.enableCrc();

  display.clearDisplay();
  display.setCursor(0,20);
  display.println("Rocket Ready");
  display.display();

  delay(2000);
}


void updateOLED()
{
  display.clearDisplay();

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0,0);

  if(gps.location.isValid())
  {
    display.print("GPS FIX ");
    display.print(gps.satellites.value());
    display.println(" SAT");
  }
  else
  {
    display.println("GPS SEARCH...");
  }

  display.setCursor(0,12);
  display.print("Roll:");
  display.print(roll,1);

  display.setCursor(70,12);
  display.print("P:");
  display.print(pitch,1);

  display.setCursor(0,24);
  display.print("T:");
  display.print(temperature,1);
  display.print("C");

  display.setCursor(70,24);
  display.print("A:");
  display.print(altitude,1);

  display.setCursor(0,36);
  display.print("Pr:");
  display.print(pressure,1);

  display.setCursor(0,48);
  display.print("VIB:");

  if(vibration)
    display.print("YES");
  else
    display.print("NO");

  display.setCursor(70,48);
  display.print("TX:");
  display.print(packetNo);

  display.display();
}

void sendLoRa()
{
  LoRa.beginPacket();

  LoRa.print(packetNo);
  LoRa.print(",");

if (gps.location.isValid())
{
  LoRa.print(gps.location.lat(), 6);
}
else
{
  LoRa.print("0");
}

LoRa.print(",");

if (gps.location.isValid())
{
  LoRa.print(gps.location.lng(), 6);
}
else
{
  LoRa.print("0");
}

LoRa.print(",");

  LoRa.print(roll,2);
  LoRa.print(",");

  LoRa.print(pitch,2);
  LoRa.print(",");

  LoRa.print(temperature,2);
  LoRa.print(",");

  LoRa.print(pressure,2);
  LoRa.print(",");

  LoRa.print(altitude,2);
  LoRa.print(",");

  LoRa.print(vibration);
  LoRa.print(",");

  LoRa.print(gps.satellites.value());

  LoRa.endPacket(false);

  packetNo++;
}

void printSerial()
{
  Serial.print(packetNo);
  Serial.print(",");
if (gps.location.isValid())
{
    Serial.print(gps.location.lat(), 6);
}
else
{
    Serial.print("0");
}

Serial.print(",");

if (gps.location.isValid())
{
    Serial.print(gps.location.lng(), 6);
}
else
{
    Serial.print("0");
}

Serial.print(",");

  Serial.print(roll,2);
  Serial.print(",");

  Serial.print(pitch,2);
  Serial.print(",");

  Serial.print(temperature,2);
  Serial.print(",");

  Serial.print(pressure,2);
  Serial.print(",");

  Serial.print(altitude,2);
  Serial.print(",");

  Serial.print(vibration);
  Serial.print(",");

  Serial.println(gps.satellites.value());
}

void readGPS()
{
  while (GPS.available())
  {
    gps.encode(GPS.read());
  }
}

void readMPU()
{
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  float Ax = ax / 16384.0;
  float Ay = ay / 16384.0;
  float Az = az / 16384.0;

  roll = atan2(Ay, Az) * 180.0 / PI;
  pitch = atan2(-Ax, sqrt(Ay * Ay + Az * Az)) * 180.0 / PI;
}
void readBMP()
{
  temperature = bmp.readTemperature();
  pressure = bmp.readPressure() / 100.0;

  float currentAltitude = bmp.readAltitude(SEA_LEVEL_PRESSURE);
  altitude = currentAltitude - groundAltitude;

  // Remove tiny fluctuations
  if (abs(altitude) < 0.3)
  {
    altitude = 0.0;
  }
}

void readSensors()
{
  readGPS();

  readMPU();

  readBMP();

  readVibration();
} 

void readVibration()
{
  vibration = digitalRead(VIB_PIN);
}

void loop()
{
  // Read all sensors
  readSensors();

  // Update OLED
  updateOLED();

  // Print to Serial Monitor
  printSerial();

  // Transmit via LoRa
  sendLoRa();

  // Send every second
  delay(1000);
}
