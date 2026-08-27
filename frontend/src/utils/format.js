const formatters = new Map();

export function formatMoney(amount, currency = 'XOF') {
  let fmt = formatters.get(currency);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });
    } catch {
      fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
    }
    formatters.set(currency, fmt);
  }
  return fmt.format(amount);
}