import React from 'react';
import Navbar from '../../components/layout/Navbar/Navbar';
import Footer from '../../components/layout/Footer/Footer';
import './LegalPages.css';

export default function TerminosPage() {
  return (
    <div className="legal-page">
      <Navbar onOpenAuthModal={() => {}} />
      <div className="legal-container">
        <h1>Términos y Condiciones de Uso de Mudify</h1>
        <p className="legal-updated">Última actualización: Octubre de 2026</p>

        <section className="legal-section">
          <h2>1. Naturaleza del Servicio</h2>
          <p>
            Mudify es una plataforma tecnológica que conecta a usuarios que requieren servicios de mudanzas y fletes
            con transportistas independientes y empresas de transporte habilitadas. Mudify no es una empresa de transporte
            ni presta servicios de logística de manera directa.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Relación y Pagos Directos</h2>
          <p>
            Los pagos por los servicios de transporte acordados se realizan en forma directa entre el cliente y el transportista
            o empresa elegida (en efectivo, transferencia bancaria o billetera digital). Mudify no cobra comisiones por viaje
            ni actúa como intermediario de fondos de transporte.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Suscripciones y Período de Gracia</h2>
          <p>
            Los fleteros y empresas cuentan con un período de gracia inicial de sesenta (60) días corridos bonificados con costo $0.
            El Plan Fletero Pro autoriza expresamente la operación de un (1) único vehículo activo. Para flotas de dos o más unidades,
            se requiere la suscripción al Plan Flota o Plan Enterprise correspondiente.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Geolocalización y Telemetría</h2>
          <p>
            Para el correcto funcionamiento del radar y seguimiento en vivo, el transportista autoriza a Mudify a acceder
            a las coordenadas de geolocalización de alta precisión de su dispositivo durante los traslados activos.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
}
