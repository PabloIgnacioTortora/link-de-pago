import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Círculos decorativos */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-60px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🔗
          </div>
          <span style={{ fontSize: '48px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
            LinkPago
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            margin: '0 0 16px',
            lineHeight: 1.1,
            letterSpacing: '-2px',
          }}
        >
          Cobros simples,
          <br />
          con un link.
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            fontSize: '26px',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            margin: '0 0 40px',
            maxWidth: '700px',
          }}
        >
          Creá tu link · Compartí · Cobrá con MercadoPago
        </p>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '100px',
            padding: '12px 28px',
          }}
        >
          <span style={{ fontSize: '20px', color: '#a5f3fc' }}>✓</span>
          <span style={{ fontSize: '20px', color: 'white', fontWeight: 600 }}>
            Empezá gratis — sin tarjeta
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
