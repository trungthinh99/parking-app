import { apiRequest } from './client';
import type {
  SubmitLocationTrackingRequest,
  SubmitLocationTrackingResponse,
  ScreenId,
} from '@/src/api-contracts';

/** Submit a batch of location tracking data to the server */
export async function submitLocationTracking(
  screenId: ScreenId,
  body: SubmitLocationTrackingRequest,
): Promise<SubmitLocationTrackingResponse> {
  return apiRequest<SubmitLocationTrackingRequest, SubmitLocationTrackingResponse>({
    method: 'POST',
    path: '/app/location-tracking',
    screenId,
    body,
  });
}
