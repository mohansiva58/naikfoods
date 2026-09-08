import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Package, Truck, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  size: string;
  quantity: number;
  variantImage?: string;
  color?: string;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  orderId: string;
  userId: string | { displayName: string; email: string; };
  userEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  discount?: number;
  couponCode?: string;
  total: number;
  shipping?: number;
  paymentMethod?: 'razorpay' | 'cod';
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const shippingAddress = order.shippingAddress || {
    fullName: 'N/A',
    phone: 'N/A',
    address: 'N/A',
    city: 'N/A',
    state: 'N/A',
    pincode: 'N/A',
  };
  const formatCurrency = (value: unknown) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  order.items = items;
  order.shippingAddress = shippingAddress;
  order.subtotal = Number(order.subtotal || 0);
  order.discount = Number(order.discount || 0);
  order.total = Number(order.total || 0);
  order.shipping = Number(order.shipping || 0);

  const handlePrint = (mode: 'full' | 'label') => {
    printOrderDocument(order, mode);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'returned':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/45 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-background rounded-xl shadow-xl my-8 flex flex-col max-h-[90vh] lg:max-w-5xl xl:max-w-6xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
              <div>
                <h2 className="text-2xl font-bold font-serif mb-1">Order #{order.orderId}</h2>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 block">
                      Order Status
                    </label>
                    <span className={`inline-block px-4 py-2 rounded-lg font-medium border ${getStatusColor(order.orderStatus)}`}>
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 block">
                      Payment Status
                    </label>
                    <span className={`inline-block px-4 py-2 rounded-lg font-medium border ${getStatusColor(order.paymentStatus)}`}>
                      {formatStatus(order.paymentStatus)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 block">
                      Payment Method
                    </label>
                    <span className="inline-block px-4 py-2 rounded-lg font-medium bg-secondary">
                      {order.paymentMethod === 'razorpay' ? 'Razorpay' : order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div className="bg-secondary/30 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck size={18} className="text-primary" />
                      <span className="font-semibold">Tracking Information</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Tracking #: <span className="font-mono font-bold text-foreground">{order.trackingNumber}</span></p>
                    {order.estimatedDelivery && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                )}

                {/* Shipping Address */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-lg">Shipping Address</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-foreground">{shippingAddress.fullName}</p>
                    <p className="text-foreground">{shippingAddress.address}</p>
                    <p className="text-foreground">
                      {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <Phone size={16} />
                      <span className="text-foreground">{shippingAddress.phone}</span>
                    </div>
                    {shippingAddress.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span className="text-foreground">{shippingAddress.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={20} />
                    <h3 className="font-semibold text-lg">Order Items</h3>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const price = Number(item.price || 0);
                      const quantity = Number(item.quantity || 0);
                      item.price = price;
                      item.quantity = quantity;

                      return (
                      <div key={idx} className="flex gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="w-20 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={item.variantImage || item.image}
                            alt={item.name || 'Order item'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground mb-1">{item.name || 'Unnamed item'}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Size: <span className="font-medium text-foreground">{item.size || 'N/A'}</span></p>
                            {item.color && <p>Color: <span className="font-medium text-foreground">{item.color}</span></p>}
                            <p>Qty: <span className="font-medium text-foreground">{quantity || 'N/A'}</span></p>
                            <p>Price: <span className="font-medium text-foreground">₹{item.price.toLocaleString()}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-foreground">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString()}</span>
                  </div>
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between items-center text-primary font-medium">
                      <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                      <span>-₹{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold border-t border-border pt-2 text-primary">
                    <span>Total</span>
                    <span>₹{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background rounded-b-xl">
              <button
                onClick={() => handlePrint('label')}
                className="flex items-center gap-2 px-6 py-2 rounded-lg border border-border font-medium hover:bg-secondary transition-colors"
              >
                <Printer size={18} />
                Print Shipping Label
              </button>
              <button
                onClick={() => handlePrint('full')}
                className="btn-primary flex items-center gap-2 px-6 py-2"
              >
                <Printer size={18} />
                Print Full Details
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-border font-medium hover:bg-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatPrintCurrency = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getLabelHtml = (order: Order, logoUrl: string) => `
  <!doctype html>
  <html>
    <head>
      <title>Shipping Label - ${escapeHtml(order.orderId)}</title>
      <style>
        @page { size: 4in 6in; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
          width: 4in;
          height: 6in;
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          font-family: Arial, sans-serif;
          overflow: hidden;
        }
        .label {
          width: 4in;
          height: 6in;
          padding: 0.25in;
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          page-break-after: avoid;
          break-after: avoid;
        }
        .brand { text-align: center; margin-bottom: 0.14in; }
        .logo {
          width: 0.72in;
          height: 0.72in;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid #ddd;
          display: block;
          margin: 0 auto 0.06in;
        }
        h1 { margin: 0 0 0.04in; text-align: center; font-size: 18pt; }
        .sub { text-align: center; color: #666; font-size: 8pt; margin-bottom: 0.2in; }
        .block { margin-bottom: 0.16in; }
        .rule { border-bottom: 1px solid #000; padding-bottom: 0.1in; }
        .label-text { color: #777; font-size: 8pt; font-weight: 700; margin-bottom: 0.04in; }
        .order { font-size: 13pt; font-family: monospace; font-weight: 700; overflow-wrap: anywhere; }
        .name { font-size: 11pt; font-weight: 700; margin-bottom: 0.04in; }
        .address { font-size: 9pt; line-height: 1.35; }
        .phone { font-size: 9pt; margin-top: 0.04in; }
        .tracking {
          margin-top: auto;
          border: 1px dashed #999;
          padding: 0.1in;
          text-align: center;
        }
        .tracking .value {
          font-size: 10pt;
          font-family: monospace;
          font-weight: 700;
          overflow-wrap: anywhere;
        }
      </style>
    </head>
    <body>
      <section class="label">
        <div class="brand">
          <img class="logo" src="${escapeHtml(logoUrl)}" alt="Naikfoods logo" />
          <h1>Naikfoods</h1>
          <div class="sub">SHIPPING LABEL</div>
        </div>
        <div class="block rule">
          <div class="label-text">ORDER #</div>
          <div class="order">${escapeHtml(order.orderId)}</div>
        </div>
        <div class="block">
          <div class="label-text">SHIP TO:</div>
          <div class="name">${escapeHtml(order.shippingAddress.fullName)}</div>
          <div class="address">
            ${escapeHtml(order.shippingAddress.address)}<br />
            ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.pincode)}
          </div>
        </div>
        <div class="phone"><strong>Phone:</strong> ${escapeHtml(order.shippingAddress.phone)}</div>
        <div class="tracking">
          <div class="label-text">Tracking #</div>
          <div class="value">${escapeHtml(order.trackingNumber || order.orderId)}</div>
        </div>
      </section>
      <script>
        window.onload = () => {
          window.focus();
          window.print();
        };
      </script>
    </body>
  </html>
`;

const getFullDetailsHtml = (order: Order, logoUrl: string) => {
  const items = (order.items || []).map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        ${item.color ? `<div class="muted">Color: ${escapeHtml(item.color)}</div>` : ''}
      </td>
      <td>${escapeHtml(item.size)}</td>
      <td>${Number(item.quantity || 0)}</td>
      <td>${formatPrintCurrency(item.price)}</td>
      <td>${formatPrintCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <title>Order Details - ${escapeHtml(order.orderId)}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #000; }
          .page { max-width: 186mm; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10mm; margin-bottom: 12mm; }
          .logo {
            width: 18mm;
            height: 18mm;
            border-radius: 999px;
            object-fit: cover;
            border: 1px solid #ddd;
            display: block;
            margin: 0 auto 3mm;
          }
          .brand { font-size: 28pt; font-weight: 700; }
          .muted { color: #666; font-size: 8pt; }
          .grid { display: flex; justify-content: space-between; gap: 10mm; margin-bottom: 10mm; }
          .label-title { color: #777; font-size: 8pt; font-weight: 700; margin-bottom: 2pt; }
          .value { font-size: 11pt; font-weight: 700; }
          .box { background: #f5f5f5; padding: 8mm; margin-bottom: 10mm; }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10mm; }
          th { background: #f5f5f5; border-bottom: 2px solid #000; padding: 6pt; text-align: left; }
          td { border-bottom: 1px solid #ddd; padding: 6pt; }
          th:nth-child(n+2), td:nth-child(n+2) { text-align: right; }
          .summary { margin-left: auto; width: 70mm; }
          .summary-row { display: flex; justify-content: space-between; padding: 5pt 0; }
          .total { border-top: 2px solid #000; font-weight: 700; font-size: 12pt; }
        </style>
      </head>
      <body>
        <main class="page">
          <div class="header">
            <img class="logo" src="${escapeHtml(logoUrl)}" alt="Naikfoods logo" />
            <div class="brand">Naikfoods</div>
            <div class="muted">Order Receipt</div>
          </div>
          <div class="grid">
            <div><div class="label-title">ORDER NUMBER</div><div class="value">${escapeHtml(order.orderId)}</div></div>
            <div><div class="label-title">DATE</div><div class="value">${new Date(order.createdAt).toLocaleDateString('en-IN')}</div></div>
            <div><div class="label-title">STATUS</div><div class="value">${escapeHtml(order.orderStatus).toUpperCase()}</div></div>
          </div>
          <div class="box">
            <div class="label-title">SHIPPING TO</div>
            <strong>${escapeHtml(order.shippingAddress.fullName)}</strong><br />
            ${escapeHtml(order.shippingAddress.address)}<br />
            ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} - ${escapeHtml(order.shippingAddress.pincode)}<br />
            <strong>Phone:</strong> ${escapeHtml(order.shippingAddress.phone)}
          </div>
          <table>
            <thead>
              <tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>${items}</tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>Subtotal:</span><span>${formatPrintCurrency(order.subtotal)}</span></div>
            <div class="summary-row"><span>Shipping:</span><span>${formatPrintCurrency(order.shipping)}</span></div>
            <div class="summary-row total"><span>TOTAL:</span><span>${formatPrintCurrency(order.total)}</span></div>
          </div>
        </main>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;
};

function printOrderDocument(order: Order, mode: 'full' | 'label') {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);

  const doc = frame.contentWindow?.document;
  if (!doc) {
    toast.error('Unable to open print preview');
    frame.remove();
    return;
  }

  doc.open();
  const logoUrl = new URL(logo, window.location.origin).href;
  doc.write(mode === 'label' ? getLabelHtml(order, logoUrl) : getFullDetailsHtml(order, logoUrl));
  doc.close();

  const removeFrame = () => {
    setTimeout(() => frame.remove(), 500);
  };

  frame.contentWindow?.addEventListener('afterprint', removeFrame, { once: true });
  setTimeout(removeFrame, 60_000);
}

interface PrintContentProps {
  order: Order;
  printMode: 'full' | 'label';
}

function PrintContent({ order, printMode }: PrintContentProps) {
  return (
    <div className="print-section" style={{ fontSize: '12pt', fontFamily: 'Arial, sans-serif' }}>
      {printMode === 'label' ? (
        // Shipping Label - A6 format (4x6 inches)
        <div className="print-page" style={{
          width: '4in',
          height: '6in',
          padding: '0.25in',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid black'
        }}>
          {/* Header with logo space */}
          <div style={{ textAlign: 'center', marginBottom: '0.2in' }}>
            <div style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '0.1in' }}>Naikfoods</div>
            <div style={{ fontSize: '8pt', color: '#666' }}>SHIPPING LABEL</div>
          </div>

          {/* Order Number */}
          <div style={{ marginBottom: '0.15in', paddingBottom: '0.1in', borderBottom: '1px solid black' }}>
            <div style={{ fontSize: '8pt', color: '#999' }}>ORDER #</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', fontFamily: 'monospace' }}>{order.orderId}</div>
          </div>

          {/* Recipient Address */}
          <div style={{ marginBottom: '0.2in' }}>
            <div style={{ fontSize: '8pt', color: '#999', marginBottom: '0.05in' }}>SHIP TO:</div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>{order.shippingAddress.fullName}</div>
            <div style={{ fontSize: '9pt', lineHeight: '1.3' }}>
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ fontSize: '9pt', marginBottom: '0.1in' }}>
            <strong>Phone:</strong> {order.shippingAddress.phone}
          </div>

          {/* Barcode Area */}
          <div style={{
            border: '1px dashed #999',
            padding: '0.1in',
            textAlign: 'center',
            marginTop: 'auto'
          }}>
            <div style={{ fontSize: '8pt', color: '#999', marginBottom: '0.05in' }}>Tracking #</div>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {order.trackingNumber || order.orderId}
            </div>
          </div>
        </div>
      ) : (
        // Full Order Details - Standard A4
        <div className="print-page" style={{ width: '186mm', padding: '0', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20mm', borderBottom: '2px solid black', paddingBottom: '10mm' }}>
            <div style={{ fontSize: '28pt', fontWeight: 'bold' }}>Naikfoods</div>
            <div style={{ fontSize: '10pt', color: '#666', marginTop: '5pt' }}>Order Receipt</div>
          </div>

          {/* Order Info Row 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15mm', fontSize: '10pt' }}>
            <div>
              <div style={{ fontSize: '8pt', color: '#999', marginBottom: '2pt' }}>ORDER NUMBER</div>
              <div style={{ fontSize: '12pt', fontWeight: 'bold', fontFamily: 'monospace' }}>{order.orderId}</div>
            </div>
            <div>
              <div style={{ fontSize: '8pt', color: '#999', marginBottom: '2pt' }}>DATE</div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8pt', color: '#999', marginBottom: '2pt' }}>STATUS</div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {order.orderStatus}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ marginBottom: '15mm', padding: '10mm', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt' }}>SHIPPING TO:</div>
            <div style={{ fontSize: '10pt', lineHeight: '1.6' }}>
              <div style={{ fontWeight: 'bold' }}>{order.shippingAddress.fullName}</div>
              <div>{order.shippingAddress.address}</div>
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </div>
              <div style={{ marginTop: '5pt' }}>
                <strong>Phone:</strong> {order.shippingAddress.phone}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '15mm' }}>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt' }}>ORDER ITEMS:</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid black' }}>
                  <th style={{ padding: '5pt', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '5pt', textAlign: 'center' }}>Size</th>
                  <th style={{ padding: '5pt', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '5pt', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '5pt', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '5pt' }}>
                      <div>{item.name}</div>
                      {item.color && <div style={{ fontSize: '8pt', color: '#666' }}>Color: {item.color}</div>}
                    </td>
                    <td style={{ padding: '5pt', textAlign: 'center' }}>{item.size}</td>
                    <td style={{ padding: '5pt', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '5pt', textAlign: 'right' }}>₹{item.price.toLocaleString()}</td>
                    <td style={{ padding: '5pt', textAlign: 'right' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15mm' }}>
            <div style={{ width: '150mm', maxWidth: '40%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5pt 0', borderTop: '2px solid black', marginBottom: '5pt' }}>
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5pt 0' }}>
                <span>Shipping:</span>
                <span>₹{order.shipping.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8pt 0', borderTop: '2px solid black', fontSize: '12pt', fontWeight: 'bold' }}>
                <span>TOTAL:</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: '8pt', color: '#999', textAlign: 'center', marginTop: '20mm', paddingTop: '10mm', borderTop: '1px solid #ddd' }}>
            <div>Thank you for your order!</div>
            <div>For tracking updates, please visit our website or contact customer support.</div>
          </div>
        </div>
      )}
    </div>
  );
}
