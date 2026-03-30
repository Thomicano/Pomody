import { useState, useEffect } from 'react';

export default function DigitalClock() {
  // Estado para guardar la hora y la fecha actual
  const [time, setTime] = useState<Date>(new Date());

  // UseEffect para actualizar la hora cada segundo
  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000); // Actualiza cada 1 segundo (1000ms)

    // Función de limpieza para borrar el temporizador al desmontar el componente
    return () => clearInterval(timerId);
  }, []); // El array vacío significa que solo se ejecuta una vez al montar

  // Formatear la hora HH:MM (ej: "21:03")
  const timeString = time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // Formatear la fecha "día, DD de mes" (ej: "martes, 28 de noviembre")
  // Usamos 'es-ES' para el idioma español
  const dateString = time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    // Contenedor centrado
    <div className="text-center text-white/90">
      
      {/* La Hora: Letra muy grande y delgada */}
      <h2 className="text-9xl font-extralight tracking-tight tabular-nums leading-none">
        {timeString}
      </h2>

      {/* La Fecha: Letra más pequeña, centrada justo debajo */}
      <p className="text-2xl font-light opacity-80 mt-[-10px]">
        {dateString}
      </p>

    </div>
  );
}