// Port: domain and application code read the current time through it, never `new Date()`.
export abstract class Clock {
  abstract now(): Date;
}
