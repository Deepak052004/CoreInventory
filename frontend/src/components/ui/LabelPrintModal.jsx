import { Printer } from 'lucide-react';
import Barcode from 'react-barcode';
import Modal from './Modal';
import { Button } from './Button';

export default function LabelPrintModal({ open, onClose, title = "Print Label", skuOrLot, productName, companyName = "CoreInventory" }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-md">
      <div className="space-y-6">
        <p className="text-sm text-slate-500 print:hidden text-center">
          Use your browser's print dialog to print this label. Ensure margins are set to "None".
        </p>
        
        {/* Printable Area */}
        <div className="flex justify-center border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-xl bg-white print:border-none print:p-0 print:m-0">
          <div className="w-full max-w-[300px] text-center print:w-[300px]" id="printable-label">
            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider mb-1">{companyName}</h3>
            {productName && <p className="text-sm text-slate-600 font-medium mb-4 truncate">{productName}</p>}
            <div className="flex justify-center bg-white p-2 rounded-lg">
              <Barcode value={skuOrLot || 'UNKNOWN'} width={2} height={60} displayValue={true} fontSize={14} margin={0} background="#ffffff" lineColor="#000000" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 print:hidden">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
            <Printer className="w-4 h-4" /> Print Label
          </Button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label, #printable-label * {
            visibility: visible;
          }
          #printable-label {
            position: absolute;
            left: 0;
            top: 0;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}} />
    </Modal>
  );
}
