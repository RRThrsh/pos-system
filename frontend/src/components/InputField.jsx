function InputField({ label, name, error, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-gray-700 text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default InputField
