import { CustomerTransaction, PurchaseItem } from '../types';

export function generateInvoice(transaction: CustomerTransaction): string {
  const { customer, purchases } = transaction;

  let invoice = `INVOICE\n\n`;
  invoice += `Customer:\n`;
  invoice += `${customer.firstName ? customer.firstName + ' ' : ''}${customer.lastName}\n`;
  invoice += `${customer.address.street}\n`;
  invoice += `${customer.address.city}\n`;
  invoice += `${customer.address.country}\n\n`;

  let subtotal = 0;

  if (purchases && purchases.length > 0) {
    invoice += `Items:\n`;
    invoice += `------------------------------------------------------------\n`;
    purchases.forEach((item: PurchaseItem) => {
      const itemTotal = item.quantity * item.cost;
      subtotal += itemTotal;
      invoice += `- ${item.quantity} x ${item.itemName} (${item.sku})\n`;
      invoice += `  Category: ${item.category || 'N/A'} @ $${item.cost.toFixed(2)} each = $${itemTotal.toFixed(2)}\n`;
    });
    invoice += `------------------------------------------------------------\n\n`;
  }

  let total = subtotal;
  let discountAmount = 0;

  if (customer.isVip) {
    discountAmount = subtotal * 0.05;
    total = subtotal - discountAmount;
  }

  invoice += `Subtotal: $${subtotal.toFixed(2)}\n`;
  if (customer.isVip) {
    invoice += `VIP Discount (5%): -$${discountAmount.toFixed(2)}\n`;
  }
  invoice += `Total: $${total.toFixed(2)}`;

  return invoice;
}
