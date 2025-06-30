export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatPrice = (price: string | number): string => {
  const priceNumber = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(priceNumber) ? '₹0.00' : formatCurrency(priceNumber);
};
