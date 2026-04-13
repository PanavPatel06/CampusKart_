// client/src/pages/PrintOrder.jsx  ← replace existing file entirely
// Logic IDENTICAL — same uploadFile, createOrder, getVendors, getLocations, getMyWallet.

import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile, createOrder, getVendors, getLocations, getMyWallet } from '../services/api';
import AuthContext from '../context/AuthContext';
import { Printer, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, XCircle } from 'lucide-react';

function cn(...c) { return c.filter(Boolean).join(' '); }

const PrintOrder = () => {
    // ← identical state to original
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [file,          setFile]          = useState(null);
    const [fileUrl,       setFileUrl]       = useState('');
    const [uploading,     setUploading]     = useState(false);
    const [orderSuccess,  setOrderSuccess]  = useState(false);
    const [blobUrl,       setBlobUrl]       = useState(null); // Local blob state for secure inline PDF bypassing
    const [vendors,       setVendors]       = useState([]);
    const [vendorId,      setVendorId]      = useState('');
    const [locations,     setLocations]     = useState([]);
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [printOptions,  setPrintOptions]  = useState({ color: 'bw', sided: 'single', pages: 1, pageRange: 'All', copies: 1 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const vendorRes = await getVendors();
                setVendors(vendorRes.data);
                if (vendorRes.data.length > 0) setVendorId(vendorRes.data[0]._id);
                const locRes = await getLocations();
                setLocations(locRes.data);
                if (user) { const walletRes = await getMyWallet(); setWalletBalance(walletRes.data.balance); }
            } catch (error) { console.error('Failed to fetch initial data', error); }
        };
        fetchData();
    }, [user]);

    // Securely pull the PDF directly into browser memory to strip forced Cloudinary attachment headers!
    useEffect(() => {
        if (!fileUrl) {
            setBlobUrl(null);
            return;
        }
        const ext = file?.name?.split('.').pop().toLowerCase() || 'pdf';
        if (ext === 'pdf') {
            fetch(fileUrl)
                .then(res => {
                    if (!res.ok) throw new Error(`Cloudinary returned HTTP ${res.status}`);
                    return res.arrayBuffer(); // Extract raw binary explicitly
                })
                .then(buffer => {
                    // Reconstruct a pristine PDF blob from absolute scratch
                    const pristineBlob = new Blob([buffer], { type: 'application/pdf' });
                    setBlobUrl(URL.createObjectURL(pristineBlob));
                })
                .catch(err => {
                    console.error("Blob proxy failed:", err);
                    setBlobUrl('error');
                });
        }
    }, [fileUrl, file]);

    const handleFileChange = (e) => { 
        setFile(e.target.files[0]);
        setFileUrl('');
        setBlobUrl(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) {
            alert('File size exceeds the 100MB limit.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
            setUploading(true);
            const { data } = await uploadFile(formData);
            setFileUrl(data.fileUrl);
            alert('File uploaded successfully!');
        } catch (error) {
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        } finally { setUploading(false); }
    };

    const getPricePerSheet = () => {
        let basePrice = printOptions.color === 'color' ? 10 : 2;
        // Adjust price if double-sided. For example, 1.5x the base price per sheet
        if (printOptions.sided === 'double') {
            basePrice = printOptions.color === 'color' ? 15 : 3;
        }
        return basePrice;
    }
    
    const pricePerSheet = getPricePerSheet();
    const estimatedCost = pricePerSheet * printOptions.pages * printOptions.copies;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileUrl)           { alert('Please upload a file first'); return; }
        if (!vendorId)          { alert('Please select a vendor'); return; }
        if (!deliveryLocation)  { alert('Please select a delivery location'); return; }
        if (walletBalance < estimatedCost) {
            alert(`Insufficient Wallet Balance (₹${walletBalance}). Total Required: ₹${estimatedCost}`);
            return;
        }
        const orderData = {
            orderItems: [{ name: 'Print Job - ' + file.name, price: pricePerSheet, qty: printOptions.copies, fileUrl, printOptions }],
            totalPrice: estimatedCost,
            vendorId,
            deliveryLocation,
        };
        try {
            await createOrder(orderData);
            setOrderSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            alert('Order failed: ' + (error.response?.data?.message || error.message));
        }
    };

    // ── Success state ──────────────────────────────────────────────────────
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto"><CheckCircle2 className="w-5 h-5 shrink-0" /></div>
                    <h2 className="text-2xl font-black text-gray-900">Order Placed!</h2>
                    <p className="text-gray-500 text-sm">Your print order was submitted successfully. Redirecting to dashboard…</p>
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600/10 to-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <h1 className="text-2xl font-black text-gray-900">New Print Order</h1>
                    <p className="text-gray-500 text-sm mt-1">Upload your PDF and get it printed on campus</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Vendor + Location */}
                    <Section title="Vendor & Delivery" number={1}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StyledSelect label="Print Vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
                                <option value="" disabled>Select a vendor</option>
                                {vendors.map(v => <option key={v._id} value={v._id}>{v.storeName} ({v.location})</option>)}
                            </StyledSelect>
                            {vendors.length === 0 && <p className="text-xs text-red-500 col-span-2">No vendors available.</p>}
                            <StyledSelect label="Delivery Location" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} required>
                                <option value="">Select location</option>
                                {locations.map(loc => <option key={loc._id} value={loc.name}>{loc.name}</option>)}
                            </StyledSelect>
                        </div>
                    </Section>

                    {/* File Upload */}
                    <Section title="Upload PDF" number={2}>
                        <label className={cn(
                            'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
                            fileUrl ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50/80 hover:border-indigo-600 hover:bg-indigo-600/10'
                        )}>
                            <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={handleFileChange} className="sr-only" />
                            <span className="text-4xl">{fileUrl ? <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0" /> : '📄'}</span>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-gray-900">{fileUrl ? file?.name : (file ? file.name : 'Click to select PDF')}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{fileUrl ? 'Uploaded & ready' : 'PDF only, max 100MB'}</p>
                            </div>
                        </label>
                        {fileUrl && (
                            <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50/80">
                                <div className="p-2 border-b bg-gray-50/80 flex justify-between items-center">
                                    <span className="text-xs font-semibold text-gray-500">Document Preview</span>
                                    <div className="flex gap-4">
                                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">Open Fullscreen</a>
                                        <button type="button" onClick={() => { setFile(null); setFileUrl(''); setBlobUrl(null); }} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">Remove File <XCircle className="w-3 h-3" /></button>
                                    </div>
                                </div>
                                {(() => {
                                    const ext = file?.name?.split('.').pop().toLowerCase() || 'pdf';
                                    const guaranteedUrl = fileUrl.toLowerCase().endsWith(`.${ext}`) ? fileUrl : `${fileUrl}.${ext}`;
                                    
                                    if (ext === 'pdf') {
                                        return blobUrl === 'error' ? (
                                            <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-50/80">
                                                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                                                <p className="text-red-600 text-sm font-bold">Network Proxy Failed</p>
                                                <p className="text-gray-500 text-xs">The PDF could not be securely fetched from Cloudinary.</p>
                                            </div>
                                        ) : blobUrl ? (
                                            <iframe src={`${blobUrl}#view=FitH`} className="w-full h-96 border-0" title="PDF Preview" />
                                        ) : (
                                            <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-50">
                                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                                                <p className="text-gray-500 text-sm font-semibold">Generating secure preview…</p>
                                            </div>
                                        );
                                    } else {
                                        return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(guaranteedUrl)}`} className="w-full h-96 border-0" title="Document Preview" />;
                                    }
                                })()}
                            </div>
                        )}
                        {file && !fileUrl && (
                            <button type="button" onClick={handleUpload} disabled={uploading}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] font-semibold text-sm rounded-lg transition-all disabled:opacity-50">
                                {uploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {uploading ? 'Uploading…' : 'Upload File'}
                            </button>
                        )}
                    </Section>

                    {/* Print Options */}
                    <Section title="Print Options" number={3}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 mb-2">Color Mode</p>
                                <div className="flex gap-2">
                                    {[['bw', '⬛ B&W'], ['color', '🌈 Color']].map(([val, label]) => (
                                        <button key={val} type="button"
                                            onClick={() => setPrintOptions({ ...printOptions, color: val })}
                                            className={cn('flex-1 py-2.5 px-2 text-xs font-bold rounded-lg border-2 transition-all',
                                                printOptions.color === val ? 'border-indigo-600 bg-indigo-600/10 text-indigo-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300')}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 mb-2">Print Sides</p>
                                <div className="flex gap-2">
                                    {[['single', '📄 Single Sided'], ['double', '📄📄 Double Sided']].map(([val, label]) => (
                                        <button key={val} type="button"
                                            onClick={() => setPrintOptions({ ...printOptions, sided: val })}
                                            className={cn('flex-1 py-2.5 px-2 text-xs font-bold rounded-lg border-2 transition-all',
                                                printOptions.sided === val ? 'border-indigo-600 bg-indigo-600/10 text-indigo-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300')}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-900">Pages to Print</label>
                                <input type="text" placeholder="e.g. All, 1-5, 8" value={printOptions.pageRange}
                                    onChange={(e) => setPrintOptions({ ...printOptions, pageRange: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all"
                                />
                            </div>
                            <StyledNumberInput label="Total Page Count" value={printOptions.pages}
                                onChange={(e) => setPrintOptions({ ...printOptions, pages: parseInt(e.target.value) || 1 })} />
                            <StyledNumberInput label="Copies" value={printOptions.copies}
                                onChange={(e) => setPrintOptions({ ...printOptions, copies: parseInt(e.target.value) || 1 })} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">Price per sheet: ₹{pricePerSheet}</p>
                    </Section>

                    {/* Summary + Submit */}
                    <Section title="Summary & Payment" number={4}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    ['Vendor',    vendors.find(v => v._id === vendorId)?.storeName || '—'],
                                    ['Delivery',  deliveryLocation || '—'],
                                    ['Mode & sides', `${printOptions.color === 'color' ? '🌈 Color' : '⬛ B&W'} • ${printOptions.sided === 'single' ? 'Single Sided' : 'Double Sided'}`],
                                    ['Pages to Print', printOptions.pageRange],
                                    ['Page Count × Copies', `${printOptions.pages} × ${printOptions.copies}`],
                                ].map(([k,v]) => (
                                    <div key={k} className="bg-gray-50/80 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">{k}</p>
                                        <p className="font-bold text-gray-900 truncate">{v}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Cost vs wallet */}
                            <div className={cn('p-4 rounded-lg border text-sm', walletBalance >= estimatedCost ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Estimated Cost</span>
                                    <span className="font-black text-indigo-600">₹{estimatedCost}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Wallet Balance</span>
                                    <span className={cn('font-black', walletBalance >= estimatedCost ? 'text-green-700' : 'text-red-600')}>
                                        ₹{walletBalance}
                                    </span>
                                </div>
                                {walletBalance < estimatedCost && (
                                    <p className="text-xs text-red-600 font-semibold mt-2">⚠ Insufficient balance — contact Admin to recharge</p>
                                )}
                            </div>

                            <button type="submit"
                                disabled={!fileUrl || !vendorId || !deliveryLocation}
                                className="w-full py-3.5 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] font-bold text-base rounded-lg shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
                                Place Print Order →
                            </button>
                        </div>
                    </Section>
                </form>
            </div>
        </div>
    );
};

function Section({ number, title, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{number}</div>
                <h3 className="font-bold text-gray-900">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function StyledSelect({ label, children, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-sm font-semibold text-gray-900">{label}</label>}
            <div className="relative">
                <select className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all" {...props}>
                    {children}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
        </div>
    );
}

function StyledNumberInput({ label, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-900">{label}</label>
            <input type="number" min="1"
                className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all"
                {...props}
            />
        </div>
    );
}

export default PrintOrder;
