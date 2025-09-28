export interface NotificationDetail {
  NCId: string;
  NSId: string;
  Status: 'Scheduled' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';
  ChannelType: 'Push' | 'Email' | 'SMS';
  CreateDateTime: string;
  Report: NotificationReport;
  ShortMessageReportLink?: string | null;
}

export interface NotificationReport {
  // Base fields (all channel types)
  Total: number;
  NoUserData: number;
  InBlackList: number;
  DontWantToReceiveThisMessageType: number;
  Sent: number;
  Fail: number;
  DidNotSend: number;
  Cancel: number;

  // Push-specific fields
  NoTokenData?: number;
  Received?: number;

  // Email-specific fields
  EmailIsEmpty?: number;

  // SMS-specific fields
  CellPhoneIsEmpty?: number;
  Success?: number;
  Declined?: number;
  CellPhoneIsNotTW?: number;
  CellPhoneIsNotMY?: number;
}

export interface INcDetailService {
  getNotificationDetail(
    shopId: number,
    ncId: string,
  ): Promise<NotificationDetail | null>;
}

export const NC_DETAIL_SERVICE_TOKEN = 'INcDetailService';
