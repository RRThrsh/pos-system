const DEFAULT_SHORTCUTS = {
  charge: { key: 'F2', label: 'Charge / Checkout', description: 'Complete the current sale' },
  scan: { key: 'F3', label: 'Focus Barcode Input', description: 'Focus the barcode scanning field' },
  quickKeys: { key: 'F4', label: 'Toggle Quick Keys', description: 'Show/hide quick product buttons' },
  close: { key: 'Escape', label: 'Close Modals', description: 'Close receipt or held orders panel' },
}

export function getDefaultShortcuts() {
  return JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
}

export const SHORTCUT_ACTIONS = [
  { id: 'charge', label: 'Charge / Checkout', description: 'Complete current sale (only when cart has items)' },
  { id: 'scan', label: 'Focus Barcode Input', description: 'Focus the barcode scanning input field' },
  { id: 'quickKeys', label: 'Toggle Quick Keys', description: 'Show or hide quick product buttons panel' },
  { id: 'close', label: 'Close Modals', description: 'Close receipt modal or held orders panel' },
]
