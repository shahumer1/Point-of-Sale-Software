import React, { useState } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';

const ReceiveVendorPaymentModal = ({ isOpen, onClose, vendorId, onSuccess }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const num = Number(amount);
    if (!num || num <= 0) return setError(t('invalid_amount'));
    setLoading(true);
    try {
      const payload = { referenceType: 'PAYMENT', paidAmount: num, paymentMode: mode, notes };
      const { data } = await api.post(`/vendors/${vendorId}/ledger`, payload);
      onSuccess && onSuccess(data);
      onClose();
      setAmount(''); setNotes(''); setMode('Cash');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('record_payment')}>
      <form onSubmit={submit} className="space-y-4" aria-label={t('record_payment')}>
        {error && <div role="alert" aria-live="assertive" className="bg-red-50 text-red-600 p-2 rounded">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('amount')}</label>
          <input autoFocus aria-label={t('amount')} type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('payment_method')}</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Online">Online</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border">{t('cancel')}</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white">{loading ? t('processing') : t('submit')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiveVendorPaymentModal;
