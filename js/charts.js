/**
 * Visualizaciones Científicas y Gráficas de Análisis de Ciclo de Vida (LCA)
 * Investigación: César Ruiz-Camou et al. (UNAM / EarthShift Global)
 */

document.addEventListener('DOMContentLoaded', () => {
  initLcaChart();
});

let lcaChartInstance = null;

const lcaDataScenarios = {
  gwp: {
    title: 'Potencial de Calentamiento Global (GWP 100)',
    unit: 'kg CO₂ eq / Litro de mezcal',
    labels: ['Cultivo de Agave', 'Cocción cónica', 'Fermentación', 'Destilación (Leña)', 'Gestión Residuos'],
    baseline: [0.85, 2.40, 0.35, 3.20, 1.10], // Total ~7.90 kg CO2 eq
    biogas: [0.85, 2.40, 0.35, 1.65, 0.40],    // Reducción con biogás de vinaza ~5.65 kg
    circular: [0.85, 1.90, 0.35, 1.10, -0.65], // Reducción con biochar (secuestro C) ~3.55 kg
    kpiBaseline: '7.90',
    kpiOptimized: '3.55',
    reduction: '55.1%'
  },
  eutrophication: {
    title: 'Eutrofización de Agua Dulce',
    unit: 'g P eq / Litro de mezcal',
    labels: ['Cultivo (Fertilizantes)', 'Molienda', 'Descarga Vinazas', 'Lixiviados Bagazo', 'Destilación'],
    baseline: [0.45, 0.12, 4.85, 1.20, 0.08], // Total ~6.70
    biogas: [0.45, 0.12, 0.95, 0.45, 0.08],    // Tratamiento anaeróbico reduce 80%
    circular: [0.30, 0.12, 0.35, 0.15, 0.08], // Biofiltro y enmienda orgánica
    kpiBaseline: '6.70',
    kpiOptimized: '1.00',
    reduction: '85.1%'
  },
  water: {
    title: 'Huella y Consumo de Agua',
    unit: 'Litros H₂O / Litro de mezcal',
    labels: ['Riego en Vivero', 'Lavado & Molienda', 'Enfriamiento Destilador', 'Limpieza Tina'],
    baseline: [14.0, 3.5, 42.0, 5.5], // Total ~65 L
    biogas: [14.0, 3.5, 18.0, 5.5],    // Recirculación de agua de condensación
    circular: [10.0, 3.0, 12.0, 4.0], // Circuito cerrado
    kpiBaseline: '65.0',
    kpiOptimized: '29.0',
    reduction: '55.4%'
  }
};

function initLcaChart() {
  const ctx = document.getElementById('lcaImpactChart');
  if (!ctx) return;

  const metricSelect = document.getElementById('lcaMetricSelect');
  const scenarioSelect = document.getElementById('lcaScenarioSelect');

  function updateChart() {
    const metricKey = metricSelect ? metricSelect.value : 'gwp';
    const scenarioKey = scenarioSelect ? scenarioSelect.value : 'comparison';
    const data = lcaDataScenarios[metricKey];

    // Actualizar KPIs en el DOM
    const kpiBaseEl = document.getElementById('kpiBaselineVal');
    const kpiOptEl = document.getElementById('kpiOptVal');
    const kpiRedEl = document.getElementById('kpiReductVal');
    const unitEl = document.getElementById('kpiUnitDisplay');

    if (kpiBaseEl) kpiBaseEl.textContent = data.kpiBaseline;
    if (kpiOptEl) kpiOptEl.textContent = data.kpiOptimized;
    if (kpiRedEl) kpiRedEl.textContent = '-' + data.reduction;
    if (unitEl) unitEl.textContent = data.unit;

    if (typeof Chart === 'undefined') {
      renderSvgFallback(ctx, data, scenarioKey);
      return;
    }

    let datasets = [];
    if (scenarioKey === 'comparison') {
      datasets = [
        {
          label: 'Línea Base (Tradicional)',
          data: data.baseline,
          backgroundColor: 'rgba(124, 94, 74, 0.75)', // Tono terracota/madera
          borderColor: '#7C5E4A',
          borderWidth: 1.5,
          borderRadius: 4
        },
        {
          label: 'Valorización Biogás',
          data: data.biogas,
          backgroundColor: 'rgba(29, 78, 216, 0.7)', // Tono azul tinta
          borderColor: '#1D4ED8',
          borderWidth: 1.5,
          borderRadius: 4
        },
        {
          label: 'Economía Circular Total (Biochar + Biogás)',
          data: data.circular,
          backgroundColor: 'rgba(61, 104, 83, 0.85)', // Salvia sostenible
          borderColor: '#3D6853',
          borderWidth: 1.5,
          borderRadius: 4
        }
      ];
    } else if (scenarioKey === 'baseline') {
      datasets = [{
        label: 'Escenario Base',
        data: data.baseline,
        backgroundColor: 'rgba(124, 94, 74, 0.85)',
        borderColor: '#7C5E4A',
        borderWidth: 1.5,
        borderRadius: 4
      }];
    } else if (scenarioKey === 'biogas') {
      datasets = [{
        label: 'Valorización de Vinazas',
        data: data.biogas,
        backgroundColor: 'rgba(29, 78, 216, 0.85)',
        borderColor: '#1D4ED8',
        borderWidth: 1.5,
        borderRadius: 4
      }];
    } else {
      datasets = [{
        label: 'Circular Total',
        data: data.circular,
        backgroundColor: 'rgba(61, 104, 83, 0.85)',
        borderColor: '#3D6853',
        borderWidth: 1.5,
        borderRadius: 4
      }];
    }

    if (lcaChartInstance) {
      lcaChartInstance.destroy();
    }

    lcaChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12
              },
              boxWidth: 14,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: '#1F2328',
            titleFont: { family: "'Fraunces', serif", size: 14 },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 12,
            cornerRadius: 6,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y} ${data.unit}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              color: '#58534C'
            }
          },
          y: {
            grid: {
              color: '#E8E2D6',
              borderDash: [4, 4]
            },
            title: {
              display: true,
              text: data.unit,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
              color: '#857D73'
            },
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              color: '#58534C'
            }
          }
        }
      }
    });
  }

  if (metricSelect) metricSelect.addEventListener('change', updateChart);
  if (scenarioSelect) scenarioSelect.addEventListener('change', updateChart);

  // Carga inicial
  updateChart();
}

/**
 * Renderizado de respaldo en SVG en caso de desconexión sin CDN
 */
function renderSvgFallback(container, data, scenarioKey) {
  const maxVal = Math.max(...data.baseline);
  let barsHtml = data.labels.map((lbl, idx) => {
    const valBase = data.baseline[idx];
    const valCirc = data.circular[idx];
    const pctBase = Math.max(5, (valBase / maxVal) * 100);
    const pctCirc = Math.max(5, (valCirc / maxVal) * 100);
    return `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 3px;">${lbl}</div>
        <div style="background: #E8E2D6; border-radius: 4px; height: 16px; width: 100%; position: relative; overflow: hidden; margin-bottom: 3px;">
          <div style="background: #7C5E4A; width: ${pctBase}%; height: 100%; border-radius: 4px;" title="Base: ${valBase}"></div>
        </div>
        <div style="background: #E8E2D6; border-radius: 4px; height: 16px; width: 100%; position: relative; overflow: hidden;">
          <div style="background: #3D6853; width: ${pctCirc}%; height: 100%; border-radius: 4px;" title="Circular: ${valCirc}"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="padding: 1.5rem; background: #FAF7F2; border-radius: 8px;">
      <h4 style="margin-bottom: 1rem; font-family: 'Fraunces', serif;">${data.title} (${data.unit})</h4>
      <div style="margin-bottom: 1rem; display: flex; gap: 1rem; font-size: 0.8rem;">
        <span style="display:flex; align-items:center; gap:5px;"><span style="width:12px; height:12px; background:#7C5E4A; display:inline-block; border-radius:2px;"></span> Base</span>
        <span style="display:flex; align-items:center; gap:5px;"><span style="width:12px; height:12px; background:#3D6853; display:inline-block; border-radius:2px;"></span> Circular (Biochar)</span>
      </div>
      ${barsHtml}
    </div>
  `;
}

