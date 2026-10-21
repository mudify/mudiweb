import React, { useState } from 'react';
import Button from '../../../components/ui/Button/Button';
import './CotizadorExpress.css';

export default function CotizadorExpress() {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [categoria, setCategoria] = useState('mediano');
  const [peones, setPeones] = useState(1);
  const [cotizacion, setCotizacion] = useState(null);

  const VEHICLE_PRICING = {
    chico: { name: 'Utilitario Chico (Fiorino / Kangoo)', base: 12000, kmRate: 950 },
    mediano: { name: 'Furgón Mediano (Sprinter / Master)', base: 22000, kmRate: 1400 },
    grande: { name: 'Camión Mudancero (Iveco / Chasis)', base: 45000, kmRate: 2200 }
  };

  const PEON_RATE = 14000;

  const handleCotizar = (e) => {
    e.preventDefault();
    if (!origen || !destino) return;

    // Estimated distance calculation (simulated 18km average for AMBA or random realistic range)
    const distKm = Math.floor(Math.random() * (26 - 12) + 12);
    const vehicle = VEHICLE_PRICING[categoria];
    const totalVehiculo = vehicle.base + (distKm * vehicle.kmRate);
    const totalPeones = peones * PEON_RATE;
    const totalFinal = Math.round((totalVehiculo + totalPeones) / 1000) * 1000;

    setCotizacion({
      distanciaKm: distKm,
      vehiculoNombre: vehicle.name,
      peonesCount: peones,
      total: totalFinal,
      origen,
      destino
    });
  };

  return (
    <section className="cotizador-section" id="cotizador">
      <div className="section-container">
        <div className="cotizador-header">
          <span className="cotizador-badge">⚡ Cotización Instantánea</span>
          <h2>Calculá el costo de tu mudanza en segundos</h2>
          <p>Sin llamadas molestas, con tarifas transparentes y choferes calificados.</p>
        </div>

        <div className="cotizador-card">
          <form className="cotizador-form" onSubmit={handleCotizar}>
            <div className="cotizador-grid">
              <div className="input-group">
                <label htmlFor="quote-origin">Punto de Origen (Dirección o Barrio) *</label>
                <div className="input-with-icon">
                  <span className="input-icon">📍</span>
                  <input
                    id="quote-origin"
                    type="text"
                    required
                    placeholder="Ej: Av. Santa Fe 3200, Palermo"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="quote-destination">Punto de Destino (Dirección o Localidad) *</label>
                <div className="input-with-icon">
                  <span className="input-icon">🏁</span>
                  <input
                    id="quote-destination"
                    type="text"
                    required
                    placeholder="Ej: Av. Libertador 1800, Vicente López"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="quote-category">Tamaño del Vehículo *</label>
                <select
                  id="quote-category"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="chico">Utilitario Chico (hasta 600kg / Cajas, electrodomésticos)</option>
                  <option value="mediano">Furgón Mediano (1 a 2 ambientes / Monoambiente)</option>
                  <option value="grande">Camión Mudancero (Casa familiar / 3+ ambientes)</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="quote-helpers">Ayudantes de Carga (Peones)</label>
                <select
                  id="quote-helpers"
                  value={peones}
                  onChange={(e) => setPeones(Number(e.target.value))}
                >
                  <option value={0}>Solo chofer (Sin ayudantes de carga)</option>
                  <option value={1}>Chofer + 1 Ayudante de carga</option>
                  <option value={2}>Chofer + 2 Ayudantes (Mudanza pesada)</option>
                </select>
              </div>
            </div>

            <div className="cotizador-actions">
              <Button type="submit" variant="primary" size="lg" className="cotizador-submit">
                Calcular Presupuesto Estimado ➔
              </Button>
            </div>
          </form>

          {cotizacion && (
            <div className="cotizador-result">
              <div className="result-badge">Presupuesto Sugerido</div>
              <div className="result-amount">
                <span className="currency">$</span>
                <span className="value">{cotizacion.total.toLocaleString('es-AR')}</span>
                <span className="suffix">ARS aprox.</span>
              </div>
              <div className="result-details">
                <div className="result-item">
                  <span>Trayecto estimado:</span>
                  <strong>~{cotizacion.distanciaKm} km</strong>
                </div>
                <div className="result-item">
                  <span>Vehículo:</span>
                  <strong>{cotizacion.vehiculoNombre}</strong>
                </div>
                <div className="result-item">
                  <span>Ayudantes:</span>
                  <strong>{cotizacion.peonesCount === 0 ? 'Sin peones' : `${cotizacion.peonesCount} peón/es`}</strong>
                </div>
              </div>
              <p className="result-note">
                💡 El pago se realiza 100% directo al transportista sin intermediarios ni comisiones de Mudify.
              </p>
              <div className="result-cta">
                <a
                  href={`https://wa.me/5491100000000?text=${encodeURIComponent(
                    `Hola Mudify, coticé un viaje desde ${cotizacion.origen} hasta ${cotizacion.destino} con ${cotizacion.vehiculoNombre} por $${cotizacion.total} ARS. ¿Tienen fleteros disponibles?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary btn--lg btn-wa"
                >
                  Confirmar Chofer por WhatsApp 📲
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
