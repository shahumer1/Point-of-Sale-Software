import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import LedgerTable from '../components/LedgerTable';
import ReceivePaymentModal from '../components/ReceivePaymentModal';
import { useTranslation } from 'react-i18next';

const CustomerDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [{ data: cust }, { data: ledger }] = await Promise.all([
        api.get(`/customers`), // list then find; small shortcut to avoid adding new endpoint
        api.get(`/customers/${id}/ledger?page=1&limit=5`)
      ]);
      setCustomer(cust.find(c => c._id === id));
      setPreview(ledger.entries || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('customer_details')}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} aria-label={t('receive_payment')} className="px-4 py-2 rounded bg-green-600 text-white focus:outline-none focus:ring-2 focus:ring-green-400">{t('receive_payment')}</button>
          <Link to={`/customers/${id}/ledger`} className="px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500">{t('view_full_ledger')}</Link>
        </div>
      </div>

      {loading || !customer ? (
        <div>{t('loading')}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customer.name}</h2>
              <p className="text-sm text-gray-500">{customer.phone} • {customer.address}</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{t('balance')}: Rs {customer.balance}</p>
              <p className="text-sm text-gray-500">{customer._id}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">{t('recent_ledger')}</h3>
            <LedgerTable entries={preview} />
          </div>
        </div>
      )}

      <ReceivePaymentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetch(); }} customerId={id} onSuccess={() => fetch()} />
    </div>
  );
};

export default CustomerDetail;