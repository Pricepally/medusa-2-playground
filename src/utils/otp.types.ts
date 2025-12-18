export interface IOtpRequest {
  identifier_type: TIdentifier;
  identifier: string;
  country_code?: string;
  channel?: TChannel;
}

export interface IOtpResponse {
  message: string;
}

export interface IOtpVerificationRequest {
  identifier_type: TIdentifier;
  identifier: string;
  country_code?: string;
  otp: string;
  channel?: string;
}

export interface IOtpVerificationResponse {
  message: string;
  data: {
    token: string | null;
  };
}

export type TChannel = 'sms' | 'whatsapp';
export type TIdentifier = 'email' | 'phone';
