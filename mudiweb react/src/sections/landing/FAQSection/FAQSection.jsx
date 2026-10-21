import React, { useState } from 'react';
import './FAQSection.css';

const FAQS = [
  {
    question: '¿Cómo funciona el período de gracia de 60 días?',
    answer: 'Al registrarte como fletero independiente o empresa de mudanzas, contás con 60 días continuos con costo $0 de suscripción fija. Podés recibir viajes, cotizar y facturar sin pagar nada. Tampoco cobramos comisión por traslado.'
  },
  {
    question: '¿Por qué un conductor independiente solo puede registrar 1 vehículo?',
    answer: 'El Plan Fletero Pro está diseñado específicamente para conductores autónomos propietarios de su propia unidad (furgón, pick-up o utilitario). Si contás con más vehículos o choferes contratados, el sistema te permite actualizar al Plan Flota por Vehículos (hasta 10 unidades) o Plan Enterprise.'
  },
  {
    question: '¿Cómo se abona el viaje o flete?',
    answer: 'El pago se realiza 100% de manera directa entre el cliente y el transportista (efectivo, transferencia bancaria o Mercado Pago). Mudify no retiene fondos de los viajes.'
  },
  {
    question: '¿Cómo funciona el radar y seguimiento por satélite en tiempo real?',
    answer: 'Durante el viaje activo, el transportista comparte su ubicación continua de alta precisión mediante el GPS de su teléfono. Tanto el cliente como la torre de control pueden ver el avance del vehículo en el mapa en vivo.'
  },
  {
    question: '¿Qué es el código de seguridad OTP para finalizar un viaje?',
    answer: 'Es un código numérico único de 4 dígitos generado para el cliente. Cuando el chofer descarga todas las pertenencias en destino, el cliente le proporciona este PIN para confirmar la entrega y cerrar el viaje formalmente en el sistema.'
  }
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="section-container">
        <div className="faq-header">
          <span className="faq-badge">Ayuda &amp; Soporte</span>
          <h2>Preguntas Frecuentes</h2>
          <p>Todo lo que necesitás saber sobre la plataforma Mudify.</p>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className={`faq-item ${openIdx === idx ? 'faq-item--open' : ''}`}
              onClick={() => toggle(idx)}
            >
              <div className="faq-question">
                <span>{faq.question}</span>
                <span className="faq-icon">{openIdx === idx ? '−' : '+'}</span>
              </div>
              {openIdx === idx && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
