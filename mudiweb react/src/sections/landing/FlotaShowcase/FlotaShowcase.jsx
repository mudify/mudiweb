import React from 'react';
import Button from '../../../components/ui/Button/Button';
import './FlotaShowcase.css';

const VEHICLES = [
  {
    id: 1,
    tag: 'Carga Ligera',
    img: '/assets/images/fleet_utilitario.webp',
    name: 'Utilitario Chico',
    models: 'Fiat Fiorino · Renault Kangoo · Peugeot Partner',
    capacity: '600–800 kg',
    capacitySub: 'carga útil',
    desc: 'La opción perfecta para cajas sueltas, valijas, electrodomésticos individuales como un lavarropas o envíos de e-commerce. Chico, ágil y muy económico para trayectos cortos.',
    pills: ['📦 Cajas sueltas', '🛒 E-commerce', '🏠 Encomiendas']
  },
  {
    id: 2,
    tag: 'Carga Abierta',
    img: '/assets/images/fleet_pickup.webp',
    name: 'Pick-up con Lona o Cúpula',
    models: 'Toyota Hilux · Ford Ranger · VW Amarok',
    capacity: '~1 Tn',
    capacitySub: 'carga útil',
    desc: 'Ideal para traslados rápidos que no requieren un furgón cerrado: colchones, muebles de jardín, materiales de construcción livianos o equipos voluminosos.',
    pills: ['🛏️ Colchones', '🌿 Muebles jardín', '🧱 Materiales']
  },
  {
    id: 3,
    tag: '⭐ Más Elegido',
    highlight: true,
    img: '/assets/images/fleet_furgon_mediano.webp',
    name: 'Furgón Mediano',
    models: 'Mercedes Sprinter Corto · Renault Master · Peugeot Expert',
    capacity: '1.2–1.5 Tn',
    capacitySub: '8 a 11 m³',
    desc: 'Nuestra unidad estrella para monoambientes y departamentos chicos. Caben sillones cortos, heladeras verticales, mesas medianas y gran cantidad de cajas.',
    pills: ['🛋️ Monoambiente', '❄️ Heladera', '📦 +50 cajas']
  },
  {
    id: 4,
    tag: 'Alta Capacidad',
    img: '/assets/images/fleet_furgon_grande.webp',
    name: 'Furgón Grande / Maxicarga',
    models: 'Iveco Daily Furgón · Sprinter Larga · Ford Transit Grande',
    capacity: 'Hasta 2 Tn',
    capacitySub: '13 a 15 m³',
    desc: 'Para mudanzas completas de departamentos de 1 o 2 ambientes. Permite llevar muebles altos parados y enorme cantidad de cajas.',
    pills: ['🏠 1–2 ambientes', '🪑 Muebles altos', '📦 Gran volumen']
  },
  {
    id: 5,
    tag: 'Casa Completa',
    img: '/assets/images/fleet_camion_liviano.webp',
    name: 'Camión Liviano (Caja Mudancera)',
    models: 'Mercedes Accelo · Iveco Daily Chasis · Hyundai HD78',
    capacity: '3.5–5 Tn',
    capacitySub: 'carga útil',
    desc: 'La caja mudancera aprovecha al máximo la altura y el ancho permitido, ideal para casas familiares o departamentos de 3 ambientes con peones de carga.',
    pills: ['🏡 Casa familiar', '🛋️ 3 ambientes', '👷 Ayudantes extra']
  }
];

export default function FlotaShowcase({ onSelectVehicle }) {
  return (
    <section className="fleet-section" id="conducir">
      <div className="section-container">
        <div className="fleet-header">
          <h2>El vehículo exacto para cada mudanza</h2>
          <p>
            Categorías de vehículos verificados. Desde una caja suelta hasta una mudanza interprovincial completa.
          </p>
        </div>

        <div className="fleet-grid">
          {VEHICLES.map((veh) => (
            <div
              key={veh.id}
              className={`fleet-card ${veh.highlight ? 'fleet-card--highlight' : ''}`}
            >
              <div className="fleet-card__media">
                <img src={veh.img} alt={veh.name} loading="lazy" />
                <span className="fleet-tag">{veh.tag}</span>
              </div>

              <div className="fleet-card__body">
                <div className="fleet-card__top">
                  <div>
                    <span className="fleet-num">0{veh.id}</span>
                    <h3 className="fleet-title">{veh.name}</h3>
                    <p className="fleet-models">{veh.models}</p>
                  </div>
                  <div className="fleet-capacity">
                    <span>{veh.capacity}</span>
                    <small>{veh.capacitySub}</small>
                  </div>
                </div>

                <p className="fleet-desc">{veh.desc}</p>

                <div className="fleet-pills">
                  {veh.pills.map((pill, idx) => (
                    <span key={idx} className="fleet-pill">{pill}</span>
                  ))}
                </div>

                <div className="fleet-card__footer">
                  <Button
                    variant={veh.highlight ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const quoteEl = document.getElementById('cotizador');
                      if (quoteEl) quoteEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Cotizar esta unidad 📲
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
