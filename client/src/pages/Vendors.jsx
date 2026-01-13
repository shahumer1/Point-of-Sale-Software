import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import ReceiveVendorPaymentModal from '../components/ReceiveVendorPaymentModal';
import { useAuth } from '../context/AuthContext';

const Vendors = () => {
  const { t, i18n } = useTranslation();
  const dir = i18n.dir();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);

  // payment modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payVendorId, setPayVendorId] = useState(null);
  const openPayment = (vendorId) => { setPayVendorId(vendorId); setIsPayOpen(true); };

  useEffect(() => { fetchVendors(); }, []);
  useEffect(() => {
    const res = vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.phone.includes(searchTerm));
    setFiltered(res);
  }, [searchTerm, vendors]);

  const fetchVendors = async () => {
    try {
      const { data } = await api.get('/vendors');
      setVendors(data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete') + ' ' + t('vendor') + '?')) return;
    try {
      await api.delete(`/vendors/${id}`);
      setVendors(vendors.filter(v => v._id !== id));
    } catch (err) { console.error(err); }
  };

  const openModal = (vendor = null) => {
    setCurrentVendor(vendor);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // minimal create/edit support
    const form = e.target;
    const name = form.name.value; const phone = form.phone.value; const address = form.address.value;
    try {
      if (currentVendor) {
        const { data } = await api.put(`/vendors/${currentVendor._id}`, { name, phone, address });
        setVendors(vendors.map(v => v._id === data._id ? data : v));
      } else {
        const { data } = await api.post('/vendors', { name, phone, address });
        setVendors([...vendors, data]);
      }
      setIsModalOpen(false);
    } catch (err) { console.error(err); alert('Operation failed'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('vendors')}</h1>
        {user?.role === 'admin' && (
          <button onClick={() => openModal()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <Plus size={20} className="mr-2" /> {t('add_vendor')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-2.5 h-5 w-5 text-gray-400`} aria-hidden />
            <input type="text" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-10 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" aria-label={t('search')} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('address')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('balance')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(v => (
                <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{v.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{v.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{v.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><Link to={`/vendors/${v._id}`} className={`${v.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>Rs {v.balance}</Link></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end">
                      <button onClick={() => openPayment(v._id)} aria-label={t('record_payment')} className="text-green-600 hover:text-green-800 mr-4 focus:outline-none focus:ring-2 focus:ring-green-400 rounded">{t('record_payment')}</button>
                      {user?.role === 'admin' && (
                        <>
                          <button onClick={() => openModal(v)} aria-label={t('edit')} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(v._id)} aria-label={t('delete')} className="text-red-600 hover:text-red-900 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentVendor ? t('edit_vendor') : t('add_vendor')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('name')}</label>
            <input name="name" defaultValue={currentVendor?.name || ''} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
            <input name="phone" defaultValue={currentVendor?.phone || ''} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('address')}</label>
            <input name="address" defaultValue={currentVendor?.address || ''} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2">{t('cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('save')}</button>
          </div>
        </form>
      </Modal>

      <ReceiveVendorPaymentModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} vendorId={payVendorId} onSuccess={() => { setIsPayOpen(false); fetchVendors(); }} />
    </div>
  );
};

export default Vendors;
