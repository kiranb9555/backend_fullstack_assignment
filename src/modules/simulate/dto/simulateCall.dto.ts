export interface SimulateCallDto {
    virtualNumberId: string;
    callerMobile: string;
    direction: "INBOUND" | "OUTBOUND";
    durationSec: number;
    hasVoicemail: boolean;
  }