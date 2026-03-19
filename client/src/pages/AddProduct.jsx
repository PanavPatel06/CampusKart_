import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { addProduct, updateProduct, uploadImage } from '../services/api';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { XCircle, Image, ShoppingBag } from 'lucide-react';

async function getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0, 0,
        crop.width, crop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas is empty');
                return;
            }
            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
    });
}

const AddProduct = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const productToEdit = location.state?.product;

    const [formData, setFormData] = useState({ 
        name: '', 
        price: '', 
        description: '', 
        image: '' 
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [crop, setCrop] = useState({ unit: '%', width: 50, aspect: 1 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [imageRef, setImageRef] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    const [error,   setError]     = useState(null);
    const [loading, setLoading]   = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name || '',
                price: productToEdit.price || '',
                description: productToEdit.description || '',
                image: productToEdit.image || ''
            });
            if (productToEdit.image) {
                setImagePreview(productToEdit.image);
            }
        }
    }, [productToEdit]);

    const handleChange  = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setCrop({ unit: '%', width: 50, aspect: 1 });
            setCompletedCrop(null);
            setIsCropping(true);
        }
    };

    const handleSaveCrop = async () => {
        if (imageRef && completedCrop?.width && completedCrop?.height) {
            try {
                const croppedFile = await getCroppedImg(imageRef, completedCrop, 'cropped_image.jpg');
                setImageFile(croppedFile);
                setImagePreview(URL.createObjectURL(croppedFile));
                setIsCropping(false);
            } catch (err) {
                console.error('Failed to crop image:', err);
            }
        } else {
            setIsCropping(false);
        }
    };

    const handleCancelCrop = () => {
        setIsCropping(false);
        setImagePreview(productToEdit?.image || null);
        setImageFile(null);
    };

    const handleClearImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleSubmit  = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            let imageUrl = formData.image;
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                const uploadRes = await uploadImage(uploadData);
                imageUrl = uploadRes.data.imageUrl;
            }

            const finalData = { ...formData, image: imageUrl };

            if (productToEdit) {
                await updateProduct(productToEdit._id, finalData);
            } else {
                await addProduct(finalData);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50/40 to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-xl shadow-green-200 mb-4">
                        <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">{productToEdit ? 'Edit Product' : 'Add New Product'}</h1>
                    <p className="text-gray-500 text-sm mt-1">{productToEdit ? 'Update details of your existing product' : 'List a product on the campus marketplace'}</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-5">
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                            <XCircle className="w-4 h-4 mt-0.5 shrink-0 fill-current" />
                            <span>{error}</span>
                        </div>
                    )}

                    {isCropping ? (
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 text-center">Crop your image</h3>
                            <div className="flex justify-center bg-gray-50/80 rounded-lg overflow-hidden border border-gray-200 max-h-[400px]">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    className="max-h-full"
                                >
                                    <img 
                                        src={imagePreview} 
                                        onLoad={(e) => setImageRef(e.currentTarget)} 
                                        alt="Crop preview" 
                                        className="max-h-[400px] object-contain max-w-full"
                                    />
                                </ReactCrop>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleCancelCrop} 
                                    className="flex-1 py-3 bg-gray-50/80 hover:bg-gray-50/80 text-gray-900 font-bold rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="button" onClick={handleSaveCrop} 
                                    disabled={!completedCrop?.width || !completedCrop?.height}
                                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50">
                                    Save Crop
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-900">Product Image <span className="text-gray-500 font-normal">(optional)</span></label>
                                <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/80 hover:bg-green-50 hover:border-green-300 transition-colors cursor-pointer overflow-hidden">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={handleClearImage}
                                                title="Remove Image"
                                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md z-10 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-green-500 transition-colors">
                                            <Image className="w-6 h-6" />
                                            <span className="text-xs font-semibold">Click to upload image</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>

                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="name" className="text-sm font-semibold text-gray-900">Product Name</label>
                                <input id="name" name="name" type="text"
                                    value={formData.name} onChange={handleChange}
                                    placeholder="e.g. Chicken Burger, Print Paper A4"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/25 focus:border-green-400 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Price */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="price" className="text-sm font-semibold text-gray-900">Price (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">₹</span>
                                    <input id="price" name="price" type="number" min="0" step="0.01"
                                        value={formData.price} onChange={handleChange}
                                        placeholder="0.00"
                                        required
                                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/25 focus:border-green-400 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="description" className="text-sm font-semibold text-gray-900">
                                    Description <span className="text-gray-500 font-normal">(optional)</span>
                                </label>
                                <textarea id="description" name="description"
                                    value={formData.description} onChange={handleChange}
                                    placeholder="Describe your product briefly…"
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-400/25 focus:border-green-400 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Link to="/dashboard"
                                    className="flex-1 py-3 text-center text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50/80 transition-colors">
                                    ← Cancel
                                </Link>
                                <button type="submit" disabled={loading || !formData.name || !formData.price}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold text-sm rounded-lg shadow-md shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
                                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {loading ? 'Saving…' : (productToEdit ? 'Save Changes' : 'Add Product')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
