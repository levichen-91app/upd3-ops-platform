export interface IWhaleApiService {
  getNotificationHistory(notificationId: number): Promise<WhaleApiNotificationResponse | null>;
}

export const WHALE_API_SERVICE_TOKEN = 'IWhaleApiService';

export interface WhaleApiNotificationResponse {
  code: string;
  message: string | null;
  data: {
    id: number;
    channel: string;
    bookDatetime: string;
    sentDatetime: string | null;
    ncId: string;
    ncExtId: number;
    status: string;
    isSettled: boolean;
    originalAudienceCount: number;
    filteredAudienceCount: number;
    sentAudienceCount: number;
    receivedAudienceCount: number;
    sentFailedCount: number;
    report: {
      Total: number;
      Sent: number;
      Success: number;
      Fail: number;
      NoUser: number;
    };
  };
}