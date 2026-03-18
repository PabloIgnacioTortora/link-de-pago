import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-bold text-indigo-600">LinkPago</span>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">Iniciar sesión</Link>
          <Link href="/register" className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Cobros simples,<br />
          <span className="text-indigo-600">con un link.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Creá links de cobro en segundos y compartílos por WhatsApp, Instagram o email.
          Tus clientes pagan con tarjeta o transferencia — vos recibís al instante.
        </p>
        <Link href="/register" className="inline-block bg-indigo-600 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors">
          Crear mi cuenta gratis
        </Link>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          {[
            { icon: '🔗', title: 'Generá tu link', desc: 'Completá el monto, descripción y listo. Tu link está listo para compartir.' },
            { icon: '📲', title: 'Compartí', desc: 'Envialo por WhatsApp, redes sociales o email. Funciona en cualquier dispositivo.' },
            { icon: '💰', title: 'Cobrá', desc: 'Tu cliente paga con MercadoPago. Vos recibís notificación y el dinero en tu cuenta.' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Pricing */}
      <section className="bg-gray-50 py-24 px-6" id="precios">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Precios simples</h2>
          <p className="text-gray-500">Empezá gratis. Pasá a Pro cuando necesites más.</p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Free</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">$0</p>
            <p className="text-sm text-gray-400 mb-6">Para siempre</p>
            <ul className="space-y-3 text-sm text-gray-600 mb-8">
              {[
                '2 links de cobro activos',
                'Pagos con MercadoPago',
                'Dashboard básico',
                'Acceso desde cualquier dispositivo',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Empezar gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-indigo-600 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Recomendado
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
            <p className="text-4xl font-bold text-white mb-1">$15.000</p>
            <p className="text-sm text-indigo-200 mb-6">por mes · en ARS</p>
            <ul className="space-y-3 text-sm text-indigo-100 mb-8">
              {[
                'Links ilimitados',
                'Marca propia (logo, color, nombre)',
                'Código QR por link',
                'Estadísticas completas',
                'Notificaciones por email',
                'Soporte prioritario',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full text-center py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors">
              Empezar con Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} LinkPago · Hecho en Argentina 🇦🇷</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="/terms" className="hover:text-gray-600 transition-colors">Términos y Condiciones</a>
          <a href="/privacy" className="hover:text-gray-600 transition-colors">Política de Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
