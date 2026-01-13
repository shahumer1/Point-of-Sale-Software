import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import LedgerTable from '../components/LedgerTable';
import { useTranslation } from 'react-i18next';

const CustomerLedger = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const q = `?page=${page}&limit=${limit}` + (startDate ? `&startDate=${startDate}` : '') + (endDate ? `&endDate=${endDate}` : '');
      const { data } = await api.get(`/customers/${id}/ledger${q}`);
      setEntries(data.entries);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id, page, startDate, endDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('ledger')}</h1>
        <div className="flex gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border p-2 rounded" />
          <button onClick={() => { setPage(1); fetch(); }} className="px-3 py-2 rounded bg-indigo-600 text-white">{t('filter')}</button>
        </div>
      </div>

      {loading ? <div>{t('loading')}</div> : <LedgerTable entries={entries} />}

      {/* Pagination controls (simple) */}
      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded border">{t('prev')}</button>
        <span>{t('page')} {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-2 rounded border">{t('next')}</button>
      </div>
    </div>
  );
};

export default CustomerLedger;