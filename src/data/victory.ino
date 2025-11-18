#include <SCServo.h>

SCSCL sc;

// Hand side: 1 = Right, 2 = Left
int Side = 1;  

// Speed configuration
int MaxSpeed = 1500;

// Finger middle calibration positions (adjust per your calibration)
int MiddlePos[8] = {511, 511, 500, 520, 650, 400, 510, 400};

// Servo control step (300° / 1024)
float Step = 0.293;

void setup() {
  Serial.begin(1000000);
  sc.pSerial = &Serial;
  delay(1000);

  // Perform Victory symbol once after setup
  Victory();
}

// Empty loop — no repetition
void loop() {
  // nothing here
}

void Victory() {
  if (Side == 1) { // Right Hand ✌️
    Move_Index(-15, 65, MaxSpeed);
    Move_Middle(-65, 15, MaxSpeed);
    Move_Ring(90, -90, MaxSpeed);
    Move_Thumb(90, -90, MaxSpeed);
  } 
  else if (Side == 2) { // Left Hand ✌️
    Move_Index(-65, 15, MaxSpeed);
    Move_Middle(-15, 65, MaxSpeed);
    Move_Ring(90, -90, MaxSpeed);
    Move_Thumb(90, -90, MaxSpeed);
  }
}

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
