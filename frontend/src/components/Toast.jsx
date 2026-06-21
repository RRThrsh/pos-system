const toastStyles = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500 text-black',
}

function Toast({ message, type = 'info', onClose }) {
  return (
    <div
      className={`${toastStyles[type] || toastStyles.info}
        text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between
        min-w-[280px] max-w-sm animate-slide-in`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-3 text-white/80 hover:text-white text-lg leading-none"
      >
        &times;
      </button>
    </div>
  )
}

export default Toast
