import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, XCircle, Printer, MapPin, Users, ShoppingCart, FileText, Download } from 'lucide-react';
import { salesOrdersApi, settingsApi } from '../services/api';
import { generateInvoice, generatePackingSlip } from '../utils/pdfGenerator';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [so, setSO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSO = () => {
    setLoading(true);
    salesOrdersApi.getOne(id)
      .then((r) => setSO(r.data.data))
      .catch(() => toast.error('Sales Order not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSO(); }, [id]);

  const handleAction = (actionStr, apiCall) => {
    if (!window.confirm(`Are you sure you want to ${actionStr} this SO?`)) return;
    setActionLoading(true);
    apiCall(id)
      .then(() => {
        toast.success(`SO ${actionStr} successfully`);
        fetchSO();
      })
      .catch((err) => toast.error(err.response?.data?.message || `Failed to ${actionStr}`))
      .finally(() => setActionLoading(false));
  };

  const handleApprove = () => handleAction('approve', salesOrdersApi.approve);

  const getBase64ImageFromUrl = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const fetchSettingsAndLogo = async () => {
    try {
      const res = await settingsApi.get();
      const settings = res.data.data;
      if (settings?.logoUrl) {
        settings.logoBase64 = await getBase64ImageFromUrl(`http://localhost:5000${settings.logoUrl}`);
      }
      return settings;
    } catch (err) {
      return null;
    }
  };

  const handleDownloadInvoice = async () => {
    const settings = await fetchSettingsAndLogo();
    generateInvoice(so, settings);
  };

  const handleDownloadPackingSlip = async () => {
    const settings = await fetchSettingsAndLogo();
    generatePackingSlip(so, settings);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!so) return <div className="text-center py-16 text-slate-500">Sales Order not found.</div>;

  const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-sky-100 text-sky-700',
    partial: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const canApprove = so.status === 'submitted' && hasPermission('purchase_orders:approve'); // Using PO perm as proxy for now, ideally 'sales_orders:approve'
  const canCancel = !['completed', 'cancelled'].includes(so.status) && hasPermission('purchase_orders:cancel');
  const canEdit = so.status === 'draft' && hasPermission('purchase_orders:update');

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/sales-orders">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Sales Orders
          </Button>
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={`/sales-orders/${so._id}/edit`}>
              <Button variant="outline" size="sm">Edit Draft</Button>
            </Link>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => handleAction('cancel', salesOrdersApi.cancel)} disabled={actionLoading} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200">
              <XCircle className="w-4 h-4 mr-2" /> Cancel SO
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 px-5 gap-2">
              <Check className="w-4 h-4" /> Approve SO
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2 text-indigo-600 hover:bg-indigo-50 border-indigo-200" onClick={handleDownloadInvoice}>
            <Download className="w-4 h-4" /> Invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-slate-700" onClick={handleDownloadPackingSlip}>
            <Download className="w-4 h-4" /> Packing Slip
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
        <div className="h-2 w-full bg-sky-500"></div>
        <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold font-mono text-slate-900 dark:text-white uppercase tracking-tight">{so.soNumber}</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2">Created on {new Date(so.createdAt).toLocaleDateString()} by {so.createdBy?.name || 'Unknown'}</p>
            {so.expectedShipDate && (
              <p className="text-sm text-slate-500">Expected Ship Date: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(so.expectedShipDate).toLocaleDateString()}</span></p>
            )}
          </div>
          <div className="text-left md:text-right flex flex-col md:items-end justify-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Status</span>
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${STATUS_STYLES[so.status] || STATUS_STYLES.draft}`}>
              {so.status}
            </span>
            {so.approvedBy && (
              <p className="text-xs text-slate-500 mt-2">Approved by {so.approvedBy.name} on {new Date(so.approvedAt).toLocaleDateString()}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-slate-50/30 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Customer Information
              </h3>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{so.customer?.name}</p>
              {so.customer?.code && <p className="text-sm font-mono text-slate-500">{so.customer.code}</p>}
              {so.customer?.contactPerson && <p className="text-sm text-slate-600 mt-2">Attn: {so.customer.contactPerson}</p>}
              {so.customer?.email && <p className="text-sm text-slate-600">{so.customer.email}</p>}
              {so.customer?.phone && <p className="text-sm text-slate-600">{so.customer.phone}</p>}
              {so.customer?.address && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{so.customer.address}</p>}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Fulfillment Source
              </h3>
              {so.warehouse ? (
                <>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{so.warehouse?.name}</p>
                  {so.warehouse?.code && <p className="text-sm font-mono text-slate-500">{so.warehouse.code}</p>}
                  {so.warehouse?.location && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{so.warehouse.location}</p>}
                </>
              ) : (
                <p className="text-slate-500 italic">No specific warehouse selected. Open fulfillment.</p>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Line Items</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">SKU</th>
                    <th className="px-4 py-3 text-left font-semibold">Product Description</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                    <th className="px-4 py-3 text-right font-semibold">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {so.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{item.product?.SKU || 'N/A'}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.product?.name || 'Unknown Product'}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                        {item.requestedQty} <span className="text-xs text-slate-400">{item.product?.unitOfMeasure}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                        ${(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                        ${(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="w-full md:w-1/2">
                {so.notes && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{so.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-80 space-y-3 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">${(so.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span>Tax (10%)</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">${(so.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                    ${(so.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
