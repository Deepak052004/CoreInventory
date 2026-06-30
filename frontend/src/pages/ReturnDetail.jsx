import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, PackageOpen, ShieldAlert } from 'lucide-react';
import { returnsApi } from '../services/api';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function ReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [ret, setReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturn = () => {
    setLoading(true);
    returnsApi.getOne(id)
      .then((r) => setReturn(r.data.data))
      .catch(() => toast.error('Return not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReturn(); }, [id]);

  const handleProcess = () => {
    if (!window.confirm(`Process this return? Inventory will be ${ret.type === 'inbound' ? 'added to' : 'deducted from'} stock.`)) return;
    setActionLoading(true);
    returnsApi.process(id)
      .then(() => {
        toast.success(`Return processed successfully`);
        fetchReturn();
      })
      .catch((err) => toast.error(err.response?.data?.message || `Failed to process`))
      .finally(() => setActionLoading(false));
  };

  const handleCancel = () => {
    if (!window.confirm('Cancel this return authorization?')) return;
    setActionLoading(true);
    returnsApi.cancel(id)
      .then(() => {
        toast.success(`Return cancelled`);
        fetchReturn();
      })
      .catch((err) => toast.error('Failed to cancel'))
      .finally(() => setActionLoading(false));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!ret) return <div className="text-center py-16 text-slate-500">Return not found.</div>;

  const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-700',
    pending_inspection: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    processed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const canEdit = ret.status === 'draft';
  const canProcess = !['processed', 'cancelled'].includes(ret.status) && hasPermission('inventory:write');
  const canCancel = !['processed', 'cancelled'].includes(ret.status) && hasPermission('inventory:write');

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/returns">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Back to Returns
          </Button>
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={`/returns/${ret._id}/edit`}>
              <Button variant="outline" size="sm">Edit Draft</Button>
            </Link>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={actionLoading} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200">
              <XCircle className="w-4 h-4 mr-2" /> Cancel Return
            </Button>
          )}
          {canProcess && (
            <Button size="sm" onClick={handleProcess} disabled={actionLoading} className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30">
              <CheckCircle className="w-4 h-4 mr-2" /> Process to Inventory
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className={`h-2 w-full ${ret.type === 'inbound' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <PackageOpen className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold font-mono text-slate-900 dark:text-white uppercase tracking-tight">{ret.reference}</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {ret.type === 'inbound' ? 'Customer RMA (Inbound)' : 'Supplier RTV (Outbound)'} • Created on {new Date(ret.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-left md:text-right flex flex-col md:items-end justify-center">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Status</span>
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${STATUS_STYLES[ret.status] || STATUS_STYLES.draft}`}>
              {ret.status.replace('_', ' ')}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-slate-50/30 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                {ret.type === 'inbound' ? 'Customer Info' : 'Supplier Info'}
              </h3>
              {ret.type === 'inbound' ? (
                <>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{ret.customer?.name || 'Unknown'}</p>
                  {ret.salesOrder && <p className="text-sm text-slate-600 mt-2">Original SO: <span className="font-mono font-semibold">{ret.salesOrder.soNumber}</span></p>}
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{ret.supplier?.name || 'Unknown'}</p>
                  {ret.purchaseOrder && <p className="text-sm text-slate-600 mt-2">Original PO: <span className="font-mono font-semibold">{ret.purchaseOrder.poNumber}</span></p>}
                </>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Inventory Impact</h3>
              {ret.status === 'processed' ? (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Inventory Updated</p>
                    <p className="text-xs mt-1">Processed on {new Date(ret.processedAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Pending Processing</p>
                    <p className="text-xs mt-1">
                      {ret.type === 'inbound' ? 'Items will be added to stock upon processing.' : 'Items will be deducted from stock upon processing.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Return Items</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">SKU / Product</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-left font-semibold">Warehouse Target</th>
                    <th className="px-4 py-3 text-left font-semibold">Condition</th>
                    <th className="px-4 py-3 text-left font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ret.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-slate-500">{line.product?.SKU}</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5">{line.product?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-bold">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {line.warehouse?.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                          {line.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {line.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {ret.notes && (
              <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{ret.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
