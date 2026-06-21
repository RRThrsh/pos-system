import { useSearchParams } from 'react-router-dom'

function Snapshots() {
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('type') || ''

  const content = {
    inventory: {
      title: 'Inventory Snapshots',
      desc: 'Coming soon — stock levels frozen at a point in time.',
    },
    sales: {
      title: 'Sales Snapshots',
      desc: 'Coming soon — periodic sales summaries.',
    },
    system: {
      title: 'System Snapshots',
      desc: 'Coming soon — full system data export.',
    },
  }

  const selected = content[type]

  const title = selected?.title || 'Snapshots'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {!selected && (
          <div className="text-center text-gray-500 py-12">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            <p className="text-lg font-medium">Select a snapshot type from the sidebar</p>
            <p className="text-sm mt-1">Snapshots capture a point-in-time view of your data.</p>
          </div>
        )}

        {selected && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg font-medium">{selected.title}</p>
            <p className="text-sm mt-1">{selected.desc}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Snapshots
