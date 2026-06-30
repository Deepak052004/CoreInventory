import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, Check, XCircle, Printer, MapPin, Factory, Download } from 'lucide-react';
import { purchaseOrdersApi, settingsApi } from '../services/api';
import { generatePO } from '../utils/pdfGenerator';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPO = () => {
    setLoading(true);
    purchaseOrdersApi.getOne(id)
      .then((r) => setPO(r.data.data))
      .catch(() => toast.error('PO not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPO(); }, [id]);

  const handleAction = (actionStr, apiCall) => {
    if (!window.confirm(`Are you sure you want to ${actionStr} this PO?`)) return;
    setActionLoading(true);
    apiCall(id)
      .then(() => {
        toast.success(`PO ${actionStr} successfully`);
        fetchPO();
      })
      .catch((err) => toast.error(err.response?.data?.message || `Failed to ${actionStr}`))
      .finally(() => setActionLoading(false));
  };

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

  const handleDownloadPDF = async () => {
    try {
      const res = await settingsApi.get();
      const settings = res.data.data;
      if (settings?.logoUrl) {
        settings.logoBase64 = await getBase64ImageFromUrl(`http://localhost:5000${settings.logoUrl}`);
      }
      generatePO(po, settings);
    } catch (err) {
      toast.error('Failed to load settings for PDF');
      generatePO(po, null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!po) return <div className="text-center py-16 text-slate-500">PO not found.</div>;

  const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-indigo-100 text-indigo-700',
    partial: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const canApprove = po.status === 'submitted' && hasPermission('purchase_orders:approve');
  const canCancel = !['completed', 'cancelled'].includes(po.status) && hasPermission('purchase_orders:cancel');
  const canEdit = po.status === 'draft' && hasPermission('purchase_orders:update');

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/purchase-orders">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
          </Button>
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={`/purchase-orders/${po._id}/edit`}>
              <Button variant="outline" size="sm">Edit Draft</Button>
            </Link>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => handleAction('cancel', purchaseOrdersApi.cancel)} disabled={actionLoading} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200">
              <XCircle className="w-4 h-4 mr-2" /> Cancel PO
            </Button>
          )}
          {canApprove && (
            <Button size="sm" onClick={() => handleAction('approve', purchaseOrdersApi.approve)} disabled={actionLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Check className="w-4 h-4 mr-2" /> Approve PO
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
        <div className="h-2 w-full bg-indigo-500"></div>
        <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold font-mono text-slate-900 dark:text-white uppercase tracking-tight">{po.poNumber}</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2">Created on {new Date(po.createdAt).toLocaleDateString()} by {po.createdBy?.name || 'Unknown'}</p>
            {po.expectedDeliveryDate && (
              <p className="text-sm text-slate-500">Expected Delivery: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span></p>
            )}
          </div>
          <div className="text-left md:text-right flex flex-col md:items-end justify-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Status</span>
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${STATUS_STYLES[po.status] || STATUS_STYLES.draft}`}>
              {po.status}
            </span>
            {po.approvedBy && (
              <p className="text-xs text-slate-500 mt-2">Approved by {po.approvedBy.name} on {new Date(po.approvedAt).toLocaleDateString()}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-slate-50/30 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Factory className="w-4 h-4" /> Vendor Information
              </h3>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{po.supplier?.name}</p>
              {po.supplier?.code && <p className="text-sm font-mono text-slate-500">{po.supplier.code}</p>}
              {po.supplier?.contactPerson && <p className="text-sm text-slate-600 mt-2">Attn: {po.supplier.contactPerson}</p>}
              {po.supplier?.email && <p className="text-sm text-slate-600">{po.supplier.email}</p>}
              {po.supplier?.phone && <p className="text-sm text-slate-600">{po.supplier.phone}</p>}
              {po.supplier?.address && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{po.supplier.address}</p>}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Ship To Warehouse
              </h3>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{po.warehouse?.name}</p>
              {po.warehouse?.code && <p className="text-sm font-mono text-slate-500">{po.warehouse.code}</p>}
              {po.warehouse?.location && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{po.warehouse.location}</p>}
              {po.warehouse?.contact && <p className="text-sm text-slate-600 mt-1">Contact: {po.warehouse.contact}</p>}
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
                  {po.items.map((item, idx) => (
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
                {po.notes && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{po.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-80 space-y-3 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">${(po.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span>Tax (10%)</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">${(po.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    ${(po.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
