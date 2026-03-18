import Link from 'next/link';
import { privacyHtml } from './content';

export const metadata = {
  title: 'Política de Privacidad — LinkPago',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold text-indigo-600">LinkPago</Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <style>{`
          [data-custom-class='body'], [data-custom-class='body'] * { background: transparent !important; }
          [data-custom-class='title'], [data-custom-class='title'] * { font-family: Arial !important; font-size: 26px !important; color: #000 !important; }
          [data-custom-class='subtitle'], [data-custom-class='subtitle'] * { font-family: Arial !important; color: #595959 !important; font-size: 14px !important; }
          [data-custom-class='heading_1'], [data-custom-class='heading_1'] * { font-family: Arial !important; font-size: 19px !important; color: #000 !important; }
          [data-custom-class='heading_2'], [data-custom-class='heading_2'] * { font-family: Arial !important; font-size: 17px !important; color: #000 !important; }
          [data-custom-class='body_text'], [data-custom-class='body_text'] * { color: #595959 !important; font-size: 14px !important; font-family: Arial !important; }
          [data-custom-class='link'], [data-custom-class='link'] * { color: #3030F1 !important; font-size: 14px !important; font-family: Arial !important; word-break: break-word !important; }
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: privacyHtml }} />
      </div>
    </div>
  );
}
