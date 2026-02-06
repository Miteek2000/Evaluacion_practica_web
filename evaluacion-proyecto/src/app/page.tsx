export default function Home() {
  const reports = [
    {
      id: 1,
      title: "Libros prestados",
      description: "libros mas solicitados"
    },
    {
      id: 2,
      title: "Préstamos vencidos",
      description: "Préstamos vencidos o devueltos tarde con cálculo de mora."
    },
    {
      id: 3,
      title: "Resumen financiero",
      description: "Resumen financiero agrupado por mes/año."
    },
    {
      id: 4,
      title: "Actividad miembros",
      description: "Indicadores de fidelidad y puntualidad de socios."
    },
    {
      id: 5,
      title: "Inventario de copias",
      description: "Estado operativo de las copias por categoría."
    }
  ];

  return (
    <main className="main-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard de Reportes</h1>
        <p className="page-description">Accede a los reportes</p>
      </div>

      <div className="dashboard-grid">
        {reports.map((report) => (
          <a key={report.id} href={`/reports/${report.id}`} className="dashboard-card">
            <h2 className="dashboard-card-title">{report.title}</h2>
            <p className="dashboard-card-desc">{report.description}</p>
          </a>
        ))}
      </div>
    </main>
  );
}