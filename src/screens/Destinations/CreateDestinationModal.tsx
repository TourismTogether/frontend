// 'use client';

// import React, { useState } from 'react';
// import { X, MapPin, Globe, Calendar, Loader2 } from 'lucide-react';
// import { supabase } from '../../lib/supabase';
// import { ImageUploader } from '../../components/Upload/ImageUploader';

// interface CreateDestinationModalProps {
//   onClose: () => void;
//   onDestinationCreated: () => void;
// }

// const generateId = () => {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let result = '';
//   for (let i = 0; i < 6; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
// };

// const categories = [
//   'Shopping',
//   'History',
//   'Architecture',
//   'Museum',
//   'Entertainment',
//   'Nature',
//   'Modern',
//   'Religious',
//   'Beach',
//   'Mountain',
//   'Cultural',
//   'Adventure',
// ];

// const seasons = [
//   'All Year',
//   'Spring',
//   'Summer',
//   'Autumn',
//   'Winter',
//   'Dry Season',
//   'Rainy Season',
// ];

// export const CreateDestinationModal: React.FC<CreateDestinationModalProps> = ({
//   onClose,
//   onDestinationCreated,
// }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     country: '',
//     region_name: '',
//     latitude: '',
//     longitude: '',
//     category: '',
//     best_season: '',
//   });
//   const [images, setImages] = useState<{ url: string; caption: string }[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     if (!formData.name.trim()) {
//       setError('Destination name is required');
//       return;
//     }

//     if (!formData.country.trim()) {
//       setError('Country is required');
//       return;
//     }

//     setLoading(true);

//     try {
//       const id_destination = generateId();

//       const { error: insertError } = await supabase.from('destination').insert({
//         id_destination,
//         name: formData.name.trim(),
//         country: formData.country.trim(),
//         region_name: formData.region_name.trim() || null,
//         latitude: formData.latitude ? parseFloat(formData.latitude) : null,
//         longitude: formData.longitude ? parseFloat(formData.longitude) : null,
//         category: formData.category || null,
//         best_season: formData.best_season || null,
//         images: images.length > 0 ? images : [],
//         average_rating: 0,
//         total_reviews: 0,
//       });

//       if (insertError) {
//         console.error('Insert error:', insertError);
//         throw new Error(insertError.message);
//       }

//       onDestinationCreated();
//     } catch (err: any) {
//       console.error('Error creating destination:', err);
//       setError(err.message || 'Failed to create destination');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-destination to-destination/80 px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
//                 <MapPin className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold text-white">Create Destination</h2>
//                 <p className="text-white/80 text-sm">Add a new travel destination</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-white/20 rounded-full transition-colors"
//             >
//               <X className="w-5 h-5 text-white" />
//             </button>
//           </div>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
//               {error}
//             </div>
//           )}

//           {/* Name */}
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-foreground mb-2">
//               Destination Name *
//             </label>
//             <input
//               type="text"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="e.g., Ben Thanh Market"
//               className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//               required
//             />
//           </div>

//           {/* Country & Region */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">
//                 <Globe className="w-4 h-4 inline mr-1" />
//                 Country *
//               </label>
//               <input
//                 type="text"
//                 name="country"
//                 value={formData.country}
//                 onChange={handleChange}
//                 placeholder="e.g., Vietnam"
//                 className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">
//                 Region
//               </label>
//               <input
//                 type="text"
//                 name="region_name"
//                 value={formData.region_name}
//                 onChange={handleChange}
//                 placeholder="e.g., Ho Chi Minh City"
//                 className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//               />
//             </div>
//           </div>

//           {/* Coordinates */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">
//                 <MapPin className="w-4 h-4 inline mr-1" />
//                 Latitude
//               </label>
//               <input
//                 type="number"
//                 name="latitude"
//                 value={formData.latitude}
//                 onChange={handleChange}
//                 placeholder="e.g., 10.7725"
//                 step="any"
//                 className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">
//                 Longitude
//               </label>
//               <input
//                 type="number"
//                 name="longitude"
//                 value={formData.longitude}
//                 onChange={handleChange}
//                 placeholder="e.g., 106.6980"
//                 step="any"
//                 className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//               />
//             </div>
//           </div>

//           {/* Category & Season */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">
//                 Category
//               </label>
//               <select
//                 name="category"
//                 value={formData.category}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//               >
//                 <option value="">Select category</option>
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>
//                     {cat}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">
//                 <Calendar className="w-4 h-4 inline mr-1" />
//                 Best Season
//               </label>
//               <select
//                 name="best_season"
//                 value={formData.best_season}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
//               >
//                 <option value="">Select season</option>
//                 {seasons.map((season) => (
//                   <option key={season} value={season}>
//                     {season}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Images */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-foreground mb-2">
//               Images
//             </label>
//             <ImageUploader
//               images={images}
//               onChange={setImages}
//               bucket="destinations"
//               maxImages={10}
//             />
//           </div>

//           {/* Submit Buttons */}
//           <div className="flex justify-end space-x-3 pt-4 border-t border-border">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex items-center space-x-2 px-6 py-2 bg-destination hover:bg-destination/90 text-white rounded-lg transition-colors disabled:opacity-50"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   <span>Creating...</span>
//                 </>
//               ) : (
//                 <>
//                   <MapPin className="w-4 h-4" />
//                   <span>Create Destination</span>
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };
