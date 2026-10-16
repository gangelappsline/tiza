import { ChevronDown, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const FAQ = [
  {
    q: '¿Qué es Tiza?',
    a: (
      <>
        Tiza es una plataforma educativa gamificada para niños y jóvenes. En la{' '}
        <Link to="/" className="font-bold text-emerald-600 hover:underline">
          Biblioteca Pública
        </Link>{' '}
        encontrarás actividades y juegos para practicar vocales, lectura, sumas, restas, multiplicaciones y divisiones.
      </>
    ),
  },
  {
    q: '¿Necesito una cuenta para jugar?',
    a: 'No. Todas las actividades y juegos de la biblioteca se pueden usar sin registrarse. Las cuentas son para maestros y administradores que crean actividades y revisan resultados.',
  },
  {
    q: '¿Cómo se juega Memoria de Vocales?',
    a: 'Voltea dos cartas a la vez y encuentra cada vocal con la imagen que empieza con ella (A con abeja, E con elefante…). Puedes cambiar entre mayúsculas y minúsculas y activar la voz para escuchar cada carta.',
  },
  {
    q: '¿Cómo funciona Práctica de Matemáticas?',
    a: 'Elige las operaciones (suma, resta, multiplicación y división), el nivel y la cantidad de ejercicios. Después de cada respuesta verás si fue correcta y, al final, un resumen con tu puntaje y tiempo.',
  },
  {
    q: '¿Cómo funciona Ordenar Oraciones?',
    a: 'Arrastra las palabras (o tócalas) para colocarlas en la zona de respuesta en el orden correcto y presiona «Comprobar». Funciona con ratón, en tabletas y en celulares. El botón «Escuchar oración» lee la oración en voz alta como pista.',
  },
  {
    q: '¿Cómo se juega Batalla Espacial Matemática?',
    a: 'Dispara a los asteroides: cada número se suma al poder de tu nave. Para ganar debes sumar exactamente la vida de la nave enemiga; si te pasas o un asteroide te golpea, pierdes. En computadora usa ← → y Espacio; en el celular, los botones en pantalla.',
  },
  {
    q: '¿Se guarda el progreso de mi mascota virtual?',
    a: 'Sí, se guarda automáticamente en este navegador y dispositivo. Si borras los datos del navegador o usas otro dispositivo, tendrás que adoptar una nueva mascota.',
  },
  {
    q: 'Soy maestro: ¿cómo comparto una práctica de matemáticas ya configurada?',
    a: (
      <>
        Puedes compartir un enlace con la configuración lista, por ejemplo:{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm break-all text-slate-800">
          /actividad/matematicas?nivel=medio&amp;cantidad=20&amp;operaciones=suma,resta
        </code>
        . Las actividades creadas desde tu panel generan enlaces que piden el nombre del estudiante y te envían sus
        resultados.
      </>
    ),
  },
  {
    q: 'Olvidé mi contraseña, ¿qué hago?',
    a: (
      <>
        En la página de{' '}
        <Link to="/login" className="font-bold text-emerald-600 hover:underline">
          inicio de sesión
        </Link>{' '}
        elige «¿Olvidaste tu contraseña?». Te enviaremos un código de 6 dígitos a tu correo para crear una nueva.
      </>
    ),
  },
  {
    q: '¿En qué dispositivos funciona Tiza?',
    a: 'En las versiones recientes de Chrome, Edge, Firefox y Safari, tanto en computadoras como en tabletas y celulares. La lectura en voz alta depende de las voces en español instaladas en tu dispositivo.',
  },
];

export default function HelpPage() {
  useDocumentTitle('Centro de Ayuda', 'Respuestas a las preguntas frecuentes sobre las actividades y juegos de Tiza.');
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <div className="mb-10 text-center">
        <span className="mb-4 inline-grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
          <LifeBuoy className="size-8" aria-hidden="true" />
        </span>
        <h1 className="text-4xl font-bold sm:text-5xl">Centro de Ayuda</h1>
        <p className="mt-3 text-lg text-slate-600">Todo lo que necesitas saber para aprender jugando con Tiza.</p>
      </div>
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="group card overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-display text-lg font-semibold text-slate-900 transition hover:bg-slate-50">
              {item.q}
              <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-6 pb-6 leading-relaxed text-slate-600">{item.a}</div>
          </details>
        ))}
      </div>
      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <span className="text-4xl" aria-hidden="true">
          🚀
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">¿Listo para empezar?</h2>
          <p className="text-slate-600">Explora la biblioteca y elige tu primera aventura.</p>
        </div>
        <Link to="/" className="btn btn-md btn-primary">
          Ver actividades
        </Link>
      </div>
    </div>
  );
}
