import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import LedgerTable from '../components/LedgerTable';
import ReceiveVendorPaymentModal from '../components/ReceiveVendorPaymentModal';
import { useTranslation } from 'react-i18next';

const VendorDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [{ data: vendors }, { data: ledger }] = await Promise.all([
        api.get('/vendors'),
        api.get(`/vendors/${id}/ledger?page=1&limit=5`)
      ]);
      setVendor(vendors.find(v => v._id === id));
      setPreview(ledger.entries || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('vendor_details')}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} aria-label={t('record_payment')} className="px-4 py-2 rounded bg-green-600 text-white focus:outline-none focus:ring-2 focus:ring-green-400">{t('record_payment')}</button>
          <Link to={`/vendors/${id}/ledger`} className="px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500">{t('view_full_ledger')}</Link>
        </div>
      </div>

      {loading || !vendor ? (
        <div>{t('loading')}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{vendor.name}</h2>
              <p className="text-sm text-gray-500">{vendor.phone} • {vendor.address}</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${vendor.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{t('balance')}: Rs {vendor.balance}</p>
              <p className="text-sm text-gray-500">{vendor._id}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">{t('recent_ledger')}</h3>
            <LedgerTable entries={preview} />
          </div>
        </div>
      )}

      <ReceiveVendorPaymentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetch(); }} vendorId={id} onSuccess={() => fetch()} />
    </div>
  );
};

export default VendorDetail;
