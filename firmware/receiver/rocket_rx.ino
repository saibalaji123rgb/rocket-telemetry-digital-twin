  #include <SPI.h>
  #include <LoRa.h>
  
  #define SS    5
  #define RST   14
  #define DIO0  2
  
  void setup()
  {
    Serial.begin(115200);
  
    SPI.begin();
  
    LoRa.setPins(SS, RST, DIO0);
  
    if (!LoRa.begin(433E6))
    {
      Serial.println("LoRa Init Failed!");
      while (1);
    }
  
    LoRa.setSpreadingFactor(9);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.enableCrc();
  
    Serial.println("================================");
    Serial.println("      LoRa Receiver Ready");
    Serial.println("================================");
  }
  
  void loop()
{
  int packetSize = LoRa.parsePacket();

  if (packetSize)
  {
    String packet = "";

    while (LoRa.available())
    {
      packet += (char)LoRa.read();
    }

    Serial.print(packet);
    Serial.print(",");
    Serial.print(LoRa.packetRssi());
    Serial.print(",");
    Serial.println(LoRa.packetSnr());
  }
} 
