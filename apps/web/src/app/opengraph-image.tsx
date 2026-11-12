import { ImageResponse } from 'next/og';
import { clinic, clinicLocation } from '@/content/clinic-profile';

export const alt = `${clinic.name}, ${clinicLocation}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social-share image (text only — replaced with branded artwork once supplied). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#effaf8',
        color: '#161c20',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 20,
          background: '#15766d',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 52,
          fontWeight: 700,
        }}
      >
        K
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{clinic.name}</div>
        <div style={{ fontSize: 34, color: '#135f59' }}>{`Dental care in ${clinicLocation}`}</div>
      </div>
    </div>,
    size,
  );
}
