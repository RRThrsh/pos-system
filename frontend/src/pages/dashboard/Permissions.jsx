function Permissions() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Permissions</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <p className="text-lg font-medium">Permissions</p>
        <p className="text-sm mt-1">Define user roles and access levels.</p>
      </div>
    </div>
  )
}

export default Permissions
