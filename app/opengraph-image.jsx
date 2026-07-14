import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Trainr accountability network'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#f7fbff',
          color: '#082033',
          fontFamily: 'Inter, Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f7fbff 0%, #eaf5ff 56%, #e8fff5 100%)' }} />
        <div style={{ position: 'absolute', right: -140, top: -130, width: 460, height: 460, borderRadius: 460, background: 'rgba(61, 153, 255, 0.16)' }} />
        <div style={{ position: 'absolute', left: -90, bottom: -120, width: 390, height: 390, borderRadius: 390, background: 'rgba(36, 209, 143, 0.18)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 86px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 54 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: '#0b2740', color: '#8ff0c6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 900 }}>T</div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 0 }}>Trainr</div>
          </div>
          <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 0.96, letterSpacing: 0, maxWidth: 820 }}>
            Built for accountability, not dating.
          </div>
          <div style={{ marginTop: 32, fontSize: 30, lineHeight: 1.35, color: '#31546a', maxWidth: 860 }}>
            Find verified gym partners nearby, matched by goals, schedule and experience.
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 48, fontSize: 24, color: '#0c6b53', fontWeight: 800 }}>
            <span>Verified profiles</span>
            <span>•</span>
            <span>Gym & goals</span>
            <span>•</span>
            <span>Safety-first</span>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
