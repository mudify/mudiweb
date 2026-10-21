import React from 'react';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import '../TerminosPage/LegalPages.css';

export default function PrivacidadPage() {
  return (
    <div className="legal-page">
      <Navbar onOpenAuthModal={() => {}} />
      <div className="legal-container">
        <h1>Política de Privacidad de Mudify</h1>
        <p className="legal-updated">Última actualización: Octubre de 2026</p>

        <section className="legal-section">
          <h2>1. Información que Recopilamos</h2>
          <p>
            Recopilamos datos de registro (nombre, correo electrónico provisto a través de Google OAuth 2.0),
            datos del vehículo (patente, marca, modelo, habilitaciones) y coordenadas GPS en tiempo real
            durante los viajes activos.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Uso de la Geolocalización</h2>
          <p>
            La información de ubicación obtenida del sensor satelital del teléfono se utiliza exclusivamente para:
            mostrar el vehículo en el radar de la torre de control, estimar tiempos de arribo al destino
            y permitir el rastreo en vivo al cliente que contrató el servicio.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Protección de Datos Personales</h2>
          <p>
            Mudify cumple estrictamente con la Ley de Protección de Datos Personales de la República Argentina (Ley 25.326).
            No comercializamos ni transferimos información privada a terceras entidades.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
}
