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
    </div>
  );
}
