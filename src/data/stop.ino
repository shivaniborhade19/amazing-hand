#include <SCServo.h>

SCSCL sc;

// Side
int Side = 1; // 1 = Right hand, 2 = Left hand

// Speed 
int OpenSpeed = 1500;

// Fingers middle poses
int MiddlePos[8] = {511, 511, 500, 520, 650, 400, 510, 400}; // calibration values

// Servo control step
float Step = 0.293; // 300°/1024

void setup() {
  Serial.begin(1000000);
  sc.pSerial = &Serial;
  delay(1000);

  // Immediately open hand and stop
  OpenHand();
}

void loop() {
  // Do nothing — stop after opening hand
}

// === Function to open all fingers ===
void OpenHand() {
  Move_Index(-35, 35, OpenSpeed);
  Move_Middle(-35, 35, OpenSpeed);
  Move_Ring(-35, 35, OpenSpeed);
  Move_Thumb(-35, 35, OpenSpeed);
}

// === Servo movement helpers ===
void Move_Index(float Pos_1, float Pos_2, int Speed) {
  sc.RegWritePos(1, MiddlePos[0] + Pos_1 / Step, 0, Speed);
  sc.RegWritePos(2, MiddlePos[1] + Pos_2 / Step, 0, Speed);
  sc.RegWriteAction();
}

void Move_Middle(float Pos_1, float Pos_2, int Speed) {
  sc.RegWritePos(3, MiddlePos[2] + Pos_1 / Step, 0, Speed);
  sc.RegWritePos(4, MiddlePos[3] + Pos_2 / Step, 0, Speed);
  sc.RegWriteAction();
}

void Move_Ring(float Pos_1, float Pos_2, int Speed) {
  sc.RegWritePos(5, MiddlePos[4] + Pos_1 / Step, 0, Speed);
  sc.RegWritePos(6, MiddlePos[5] + Pos_2 / Step, 0, Speed);
  sc.RegWriteAction();
}

void Move_Thumb(float Pos_1, float Pos_2, int Speed) {
  sc.RegWritePos(7, MiddlePos[6] + Pos_1 / Step, 0, Speed);
  sc.RegWritePos(8, MiddlePos[7] + Pos_2 / Step, 0, Speed);
  sc.RegWriteAction();
}
