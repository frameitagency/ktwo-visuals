import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      
      // Limit file size to 5MB to prevent network/proxy drops
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5MB. Please choose a smaller image.");
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onChange(data.publicUrl);
    } catch (error: any) {
      console.error('Upload Error: ', error);
      const isNetworkError = error.message === 'Failed to fetch' || (error.message || '').includes('Failed to fetch');
      alert(`Error uploading image: ${error.message}.\n\n${isNetworkError ? 'This is a network connection issue. It may happen if ad-blockers block Supabase, or if the file was dropped by the browser. Please try a smaller image or disable ad/tracker blockers.' : 'Please ensure you have created an "images" bucket in your Supabase Dashboard as a PUBLIC bucket.'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs uppercase tracking-widest text-gray-500">{label}</label>}
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-24 h-24 border border-gray-200 shrink-0">
            <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => onChange('')} 
              className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="relative w-full border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleUpload} 
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 group-hover:text-gray-600" />
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-gray-400 mb-2 group-hover:text-gray-600 transition-colors" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Desktop Image</span>
              </>
            )}
          </div>
        )}
        
        {value && (
          <div className="flex-1 w-full">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Or paste Image URL</div>
            <input 
              type="url" 
              value={value} 
              onChange={e => onChange(e.target.value)} 
              placeholder="https://..." 
              className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-gray-900 transition-colors" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
