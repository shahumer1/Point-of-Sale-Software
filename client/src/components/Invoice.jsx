import React, { forwardRef } from 'react';

const Invoice = forwardRef(({ cart, customer, total, tax, discount, user, date }, ref) => {
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sindhi" dir="rtl" style={{ width: '80mm', margin: '0 auto', fontFamily: 'Noto Naskh Arabic' }}>
            {/* Header */}
            <div className="text-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold">پوائنٹ آف سیل</h2>
                <p className="text-xs">123 مین اسٹریٹ، کراچی</p>
                <p className="text-xs">فون: 0300-1234567</p>
            </div>

            {/* Info */}
            <div className="mb-4 text-xs">
                <p><strong>تاریخ:</strong> {date}</p>
                <p><strong>کیشئر:</strong> {user?.name}</p>
                <p><strong>گاہک:</strong> {customer?.name || 'Walk-in'}</p>
            </div>

            {/* Items */}
            <table className="w-full text-xs mb-4 border-collapse text-right">
                <thead>
                    <tr className="border-b">
                        <th className="py-1">آئٹم</th>
                        <th className="text-center py-1">تعداد</th>
                        <th className="text-left py-1">قیمت</th>
                        <th className="text-left py-1">کل</th>
                    </tr>
                </thead>
                <tbody>
                    {cart.map((item, index) => (
                        <tr key={index} className="border-b border-dashed">
                            <td className="py-1">{item.name}</td>
                            <td className="text-center py-1">{item.qty}</td>
                            <td className="text-left py-1">{item.price}</td>
                            <td className="text-left py-1">{item.price * item.qty}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="text-xs space-y-1 border-t pt-2">
                <div className="flex justify-between">
                    <span>سب ٹوٹل:</span>
                    <span>{cart.reduce((acc, item) => acc + (item.price * item.qty), 0)}</span>
                </div>
                <div className="flex justify-between">
                    <span>ٹیکس:</span>
                    <span>{tax}</span>
                </div>
                <div className="flex justify-between">
                    <span>ڈسکاؤنٹ:</span>
                    <span>{discount}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-b py-1 mt-1">
                    <span>کل رقم:</span>
                    <span>{total}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-xs">
                <p>خریداری کے لیے شکریہ!</p>
                <p>سافٹ ویئر بذریعہ Raghib Shah</p>
                <p>Phone No: 03153079945</p>
            </div>
        </div>
    );
});

export default Invoice;
