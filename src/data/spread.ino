#include <SCServo.h>

SCSCL sc;

// Hand side: 1 = Right hand, 2 = Left hand
int Side = 1;

// Speed configuration
int MaxSpeed = 1500;

// Finger middle calibration positions (adjust per your setup)
int MiddlePos[8] = {511, 511, 500, 520, 650, 400, 510, 400};

// Servo control step (300° / 1024)
float Step = 0.293;

void setup() {
  Serial.begin(1000000);
  sc.pSerial = &Serial;
  delay(1000);

  // Perform SpreadHand once after setup
  SpreadHand();
}

// Empty loop — do nothing repeatedly
void loop() {
  // nothing
}

void SpreadHand() {
  if (Side == 1) { // Right Hand
    Move_Index(4, 90, MaxSpeed);
    Move_Middle(-32, 32, MaxSpeed);
    Move_Ring(-90, -4, MaxSpeed);
    Move_Thumb(-90, -4, MaxSpeed);
  } 
  else if (Side == 2) { // Left Hand
    Move_Index(-60, 0, MaxSpeed);
    Move_Middle(-35, 35, MaxSpeed);
    Move_Ring(-4, 90, MaxSpeed);
    Move_Thumb(-4, 90, MaxSpeed);
  }
}

// === Servo movement functions ===
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
