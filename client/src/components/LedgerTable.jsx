import React from 'react';
import { useTranslation } from 'react-i18next';

const fmt = (n) => (typeof n === 'number' ? `Rs ${n}` : n);

const LedgerTable = ({ entries = [] }) => {
  const { t, i18n } = useTranslation();
  const dir = i18n.dir();

  return (
    <div role="region" aria-label={t('ledger')} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
      <table aria-label={t('ledger')} className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr className="text-xs uppercase text-gray-500 dark:text-gray-300">
            <th className="px-6 py-3">{t('date')}</th>
            <th className="px-6 py-3">{t('description')}</th>
            <th className="px-6 py-3">{t('products')}</th>
            <th className="px-6 py-3 text-right">{t('debit')}</th>
            <th className="px-6 py-3 text-right">{t('credit')}</th>
            <th className="px-6 py-3 text-right">{t('balance_after')}</th>
            <th className="px-6 py-3">{t('payment_method')}</th>
            <th className="px-6 py-3">{t('notes')}</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map((e) => (
            <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(e.date).toLocaleString()}</td>
              <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{t(e.referenceType.toLowerCase()) || e.referenceType}</td>
              <td className="px-6 py-3 text-sm text-gray-500">{e.orderItems && e.orderItems.length > 0 ? e.orderItems.map(it => `${it.productName || it.name} x ${it.qty}`).join(', ') : '-'}</td>
              <td className="px-6 py-3 text-sm text-red-600 text-right">{e.debitAmount ? fmt(e.debitAmount) : '-'}</td>
              <td className="px-6 py-3 text-sm text-green-600 text-right">{e.creditAmount ? fmt(e.creditAmount) : '-'}</td>
              <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">{fmt(e.balanceAfter)}</td>
              <td className="px-6 py-3 text-sm text-gray-500">{e.paymentMethod || '-'}</td>
              <td className="px-6 py-3 text-sm text-gray-500">{e.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LedgerTable;