// Enunciado de un supuesto práctico: los párrafos de contexto y, si lo hay,
// el modelo de datos (tablas con PK/FK y relaciones), que en el PDF es una
// imagen y aquí se transcribe como tablas.
export default function SupuestoContext({ part }) {
  return (
    <div className="space-y-3 text-gray-300">
      {part.context?.map((p, i) => (
        <p key={i} className={p.startsWith('- ') ? 'ml-4' : ''}>
          {p}
        </p>
      ))}
      {part.schema && <SchemaView schema={part.schema} />}
    </div>
  );
}

function SchemaView({ schema }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Modelo de datos</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {schema.tables.map((t) => (
          <table key={t.name} className="w-full overflow-hidden rounded border border-gray-700 text-xs">
            <thead>
              <tr>
                <th colSpan={2} className="bg-gray-800 px-2 py-1 text-left font-mono text-yellow-300">
                  {t.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.columns.map(([name, type, key]) => (
                <tr key={name} className="border-t border-gray-800">
                  <td className={`px-2 py-0.5 font-mono ${key === 'pk' ? 'font-bold text-gray-100' : key === 'fk' ? 'italic text-blue-300' : ''}`}>
                    {key === 'pk' && <span className="mr-1 text-yellow-400">PK</span>}
                    {key === 'fk' && <span className="mr-1 not-italic text-blue-400">FK</span>}
                    {name}
                  </td>
                  <td className="px-2 py-0.5 text-right font-mono text-gray-500">{type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
      <ul className="mt-2 space-y-0.5 font-mono text-xs text-gray-400">
        {schema.relations.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
