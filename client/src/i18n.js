import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "dashboard": "Dashboard",
            "products": "Products",
            "sales": "Sales/POS",
            "customers": "Customers",
            "expenses": "Expenses",
            "reports": "Reports",
            "settings": "Settings",
            "logout": "Logout",
            "login": "Login",
            "welcome": "Welcome",
            "total_sales": "Total Sales",
            "total_orders": "Total Orders",
            "low_stock": "Low Stock",
            "add_product": "Add Product",
            "invoice": "Invoice",
            "date": "Date",
            "customer": "Customer",
            "item": "Item",
            "qty": "Qty",
            "price": "Price",
            "total": "Total",
            "pay_now": "Pay Now",
            "print": "Print",
            "search": "Search...",
            "name": "Name",
            "phone": "Phone",
            "address": "Address",
            "balance": "Balance",
            "save": "Save",
            "cancel": "Cancel",
            "delete": "Delete",
            "edit": "Edit",
            "status": "Status",
            "action": "Action",
        }
    },
    ur: {
        translation: {
            "dashboard": "ڈیش بورڈ",
            "products": "مصنوعات",
            "sales": "فروخت / پوائنٹ آف سیل",
            "customers": "گاہک",
            "expenses": "اخراجات",
            "reports": "رپورٹس",
            "settings": "ترتیبات",
            "logout": "لاگ آؤٹ",
            "login": "لاگ ان کریں",
            "welcome": "خوش آمدید",
            "total_sales": "کل فروخت",
            "total_orders": "کل آرڈرز",
            "low_stock": "کم اسٹاک",
            "add_product": "پروڈکٹ شامل کریں",
            "invoice": "انوائس",
            "date": "تاریخ",
            "customer": "گاہک",
            "item": "آئٹم",
            "qty": "مقدار",
            "price": "قیمت",
            "total": "کل",
            "pay_now": "ابھی ادا کریں",
            "print": "پرنٹ کریں",
            "search": "تلاش کریں...",
            "name": "نام",
            "phone": "فون",
            "address": "پتہ",
            "balance": "بیلنس",
            "save": "محفوظ کریں",
            "cancel": "منسوخ کریں",
            "delete": "ختم کریں",
            "edit": "ترمیم کریں",
            "status": "حیثیت",
            "action": "کارروائی",
        }
    },
    sd: {
        translation: {
            "dashboard": "ڊيش بورڊ",
            "products": "پراڊڪٽس",
            "sales": "وڪرو / پوائنٽ آف سيل",
            "customers": "گراهڪ",
            "expenses": "خرچ",
            "reports": "رپورٽس",
            "settings": "سيٽنگون",
            "logout": "لاگ آئوٽ",
            "login": "لاگ ان",
            "welcome": "خوش آمديد",
            "total_sales": "کل وڪرو",
            "total_orders": "کل آرڊر",
            "low_stock": "گهٽ اسٽاڪ",
            "add_product": "پراڊڪٽ شامل ڪريو",
            "invoice": "رسيد",
            "date": "تاريخ",
            "customer": "گراهڪ",
            "item": "شيءِ",
            "qty": "تعداد",
            "price": "قيمت",
            "total": "کل",
            "pay_now": "ادائگي ڪريو",
            "print": "پرنٽ ڪريو",
            "search": "ڳولا ڪريو...",
            "name": "نالو",
            "phone": "فون",
            "address": "پتو",
            "balance": "بيڪايا",
            "save": "محفوظ ڪريو",
            "cancel": "رد ڪريو",
            "delete": "ختم ڪريو",
            "edit": "تبديل ڪريو",
            "status": "حال",
            "action": "عمل",
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
