function AuditLogs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Logs</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p className="text-lg font-medium">Audit Logs</p>
        <p className="text-sm mt-1">Track system activity and changes.</p>
      </div>
    </div>
  )
}

export default AuditLogs
