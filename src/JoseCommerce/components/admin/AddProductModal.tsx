import React, { useState } from 'react';
import { 
  X, 
  Check, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Tag, 
  Search, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Product } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { generateProductId, resolveClassAndCategoryCodes, normalizeCategorySlug } from '../../services/productIdService';
import { createAndPersistProduct } from '../../services/productService';
import { compressImageBeforeUpload } from '../../lib/imageService';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  theme?: 'dark' | 'light';
}



const PRESET_KEYWORDS = [
  'Jersey', 'Team Kit', 'Egerton FC', 'Matchday', 'Training Kit',
  'Warm-up', 'Boots', 'Footwear', 'Shin Guards', 'Goalkeeper',
  'Gloves', 'Dri-FIT', 'Breathable', 'Custom Print', 'Sublimated',
  'Tracksuit', 'Shorts', 'Socks', 'Cap', 'Sports Bag',
  'Official', 'Pro Edition', 'Authentic', 'Moisture-Wicking', 'Captain Armband',
  'Whistle', 'Bibs', 'Referee Kit', 'Ball', 'Match Ball'
];

export const CLASS_OPTIONS: { code: 'I' | 'T' | 'C' | 'O'; label: string; description: string }[] = [
  { code: 'I', label: 'Individual (I)', description: 'Footwear, shin guards, personal equipment' },
  { code: 'T', label: 'Team (T)', description: 'Squad match kits, team jerseys, warm-up tracksuits' },
  { code: 'C', label: 'Coaching (C)', description: 'Tactical boards, whistles, cones, coach equipment' },
  { code: 'O', label: 'Officiation (O)', description: 'Referee kits, cards, boundary flags, whistles' },
];

export interface SpecColumn {
  id: string;
  name: string; // e.g. "Colors", "Sizes", "Material", or custom name
  values: string[]; // e.g. ["Red", "Green", "Yellow"]
}

const STORAGE_KEY_ADD_PRODUCT_DRAFT = 'egerscore_admin_add_product_draft';

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  theme = 'dark',
}) => {
  // Restore draft state on reload
  const draft = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADD_PRODUCT_DRAFT);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(() => {
    if (draft?.step === 1 || draft?.step === 2 || draft?.step === 3) return draft.step;
    return 1;
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Step 1: General
  const [name, setName] = useState<string>(() => (typeof draft?.name === 'string' ? draft.name : ''));
  const [description, setDescription] = useState<string>(() => (typeof draft?.description === 'string' ? draft.description : ''));
  const [price, setPrice] = useState<string>(() => (typeof draft?.price === 'string' || typeof draft?.price === 'number' ? String(draft.price) : ''));
  const [initialQuantity, setInitialQuantity] = useState<string>(() => (typeof draft?.initialQuantity === 'string' || typeof draft?.initialQuantity === 'number' ? String(draft.initialQuantity) : '20'));

  // Step 2: Categorization & Keywords
  const [selectedCategory, setSelectedCategory] = useState<string>(() => (typeof draft?.selectedCategory === 'string' ? draft.selectedCategory : CATEGORIES[0]?.name || 'Team Match Kits'));
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState<'I' | 'T' | 'C' | 'O' | ''>(() => {
    if (draft?.selectedClass && ['I', 'T', 'C', 'O'].includes(draft.selectedClass)) {
      return draft.selectedClass as 'I' | 'T' | 'C' | 'O';
    }
    return '';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(() => (Array.isArray(draft?.selectedKeywords) ? draft.selectedKeywords : []));
  const [isKeywordsModalOpen, setIsKeywordsModalOpen] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [customKeywordInput, setCustomKeywordInput] = useState('');

  // Step 3: Images & Multi-Column Specification Table (Clean slate: Size, Color, Material only in dropdown)
  const [logoImage, setLogoImage] = useState<string>(() => {
    if (typeof draft?.logoImage === 'string' && !draft.logoImage.includes('unsplash.com')) return draft.logoImage;
    return '';
  });
  const [colorPhotos, setColorPhotos] = useState<Record<string, string>>(() => {
    if (draft?.colorPhotos && typeof draft.colorPhotos === 'object') {
      const clean: Record<string, string> = {};
      Object.entries(draft.colorPhotos).forEach(([k, v]) => {
        if (typeof v === 'string' && !v.includes('unsplash.com')) clean[k] = v;
      });
      return clean;
    }
    return {};
  });
  
  const [specColumns, setSpecColumns] = useState<SpecColumn[]>(() => {
    if (draft?.specColumns && Array.isArray(draft.specColumns)) {
      const isOldPreset = draft.specColumns.some((c: any) => Array.isArray(c?.values) && c.values.includes('Official Navy'));
      if (!isOldPreset) return draft.specColumns;
    }
    return [];
  });
  const [availableSpecTypes, setAvailableSpecTypes] = useState<string[]>(() => {
    if (draft?.availableSpecTypes && Array.isArray(draft.availableSpecTypes) && draft.availableSpecTypes.length > 0) {
      return draft.availableSpecTypes;
    }
    return ['Size', 'Color', 'Material'];
  });
  const [selectedColumnToAdd, setSelectedColumnToAdd] = useState('Size');
  const [customColumnName, setCustomColumnName] = useState('');
  const [isAddingCustomCol, setIsAddingCustomCol] = useState(false);
  const [newValInputs, setNewValInputs] = useState<Record<string, string>>({});

  // Manage admin active mode & suppress any ads/vignettes/popunders completely
  React.useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-admin-product-active', 'true');
      document.body.setAttribute('data-prevent-popunder', 'true');

      // Purge only third-party Monetag script overlays, NEVER modal or app elements
      const overlays = document.querySelectorAll(
        'div[id*="vignette"], [class*="vignette-overlay"], [class*="vignette-container"], iframe[src*="n6wxm"]'
      );
      overlays.forEach((el) => {
        if (!el.closest('[data-admin-modal]') && !el.closest('#root')) {
          try { el.remove(); } catch {}
        }
      });

      return () => {
        document.body.removeAttribute('data-admin-product-active');
        document.body.removeAttribute('data-prevent-popunder');
      };
    }
  }, [isOpen]);

  // Keep Default color photo in sync with logoImage
  React.useEffect(() => {
    if (logoImage) {
      setColorPhotos((prev) => {
        if (prev['Default'] !== logoImage) {
          return { ...prev, Default: logoImage };
        }
        return prev;
      });
    }
  }, [logoImage]);

  // Automatically persist step and draft inputs to localStorage to survive reloads
  React.useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(STORAGE_KEY_ADD_PRODUCT_DRAFT, JSON.stringify({
          step,
          name,
          description,
          price,
          initialQuantity,
          selectedCategory,
          selectedClass,
          selectedKeywords,
          logoImage,
          colorPhotos,
          specColumns,
          availableSpecTypes,
        }));
      } catch (_) {}
    }
  }, [
    isOpen,
    step,
    name,
    description,
    price,
    initialQuantity,
    selectedCategory,
    selectedClass,
    selectedKeywords,
    logoImage,
    colorPhotos,
    specColumns,
    availableSpecTypes,
  ]);

  if (!isOpen) return null;

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Step 1 validation
  const isNameValid = name.trim().length >= 2;
  const isDescValid = description.trim().length >= 10 && description.length <= 300;
  const isPriceValid = Number(price) > 0;
  const isInitQtyValid = Number(initialQuantity) >= 0 && initialQuantity !== '';
  const isStep1Valid = isNameValid && isDescValid && isPriceValid && isInitQtyValid;

  // Step 2 validation (Product class is strictly chosen by user, never preselected)
  const effectiveCategory = isAddingNewCategory ? customCategory.trim() : selectedCategory;
  const isCategoryValid = effectiveCategory.length > 0;
  const isClassValid = Boolean(selectedClass) && ['I', 'T', 'C', 'O'].includes(selectedClass);
  const isKeywordsValid = selectedKeywords.length <= 6;
  const isStep2Valid = isCategoryValid && isClassValid && isKeywordsValid;

  // Step 3 validation: Logo required. If color variants present, 4 other colors must each upload their photo.
  const colorsCol = specColumns.find((c) => c.name.toLowerCase().startsWith('color'));
  const hasColorVariants = Boolean(colorsCol && colorsCol.values.length > 0);
  const otherColors = hasColorVariants ? colorsCol!.values.filter((v) => v !== 'Default') : [];
  const areAllOtherColorsUploaded = otherColors.length === 0 || otherColors.every((v) => Boolean(colorPhotos[v]) && colorPhotos[v].trim().length > 0);
  const isStep3Valid = Boolean(logoImage) && (hasColorVariants ? areAllOtherColorsUploaded : true);

  const handleNext = () => {
    if (step === 1) {
      setTouched((prev) => ({ ...prev, name: true, description: true, price: true, initialQuantity: true }));
      if (isStep1Valid) setStep(2);
    } else if (step === 2) {
      setTouched((prev) => ({ ...prev, category: true, productClass: true, keywords: true }));
      if (isStep2Valid) setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleAddColumn = (columnName?: string) => {
    const rawName = (columnName || (isAddingCustomCol ? customColumnName : selectedColumnToAdd)).trim();
    if (!rawName) return;

    const nameToAdd = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    // Keep newly added specification type in the dropdown options
    setAvailableSpecTypes((prev) => {
      if (!prev.some((t) => t.toLowerCase() === nameToAdd.toLowerCase())) {
        return [...prev, nameToAdd];
      }
      return prev;
    });
    setSelectedColumnToAdd(nameToAdd);

    if (specColumns.some((col) => col.name.toLowerCase() === nameToAdd.toLowerCase())) {
      alert(`The specification column "${nameToAdd}" is already added.`);
      setIsAddingCustomCol(false);
      setCustomColumnName('');
      return;
    }

    const isColor = nameToAdd.toLowerCase().startsWith('color');
    const newCol: SpecColumn = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: nameToAdd,
      values: isColor ? ['Default'] : [],
    };
    if (isColor && logoImage) {
      setColorPhotos((prev) => ({ ...prev, Default: logoImage }));
    }
    setSpecColumns((prev) => [...prev, newCol]);
    setCustomColumnName('');
    setIsAddingCustomCol(false);
  };

  const handleRemoveColumn = (colId: string) => {
    setSpecColumns((prev) => prev.filter((col) => col.id !== colId));
  };

  const handleAddValueToColumn = (colId: string) => {
    const col = specColumns.find((c) => c.id === colId);
    if (!col) return;
    const isColorCol = col.name.toLowerCase().startsWith('color');
    if (isColorCol && col.values.length >= 5) {
      alert('A maximum of 5 color specifications (Default + 4 others) will be accepted for the products.');
      return;
    }
    const val = (newValInputs[colId] || '').trim();
    if (!val) return;
    if (col.values.some((v) => v.toLowerCase() === val.toLowerCase())) {
      alert(`The specification value "${val}" already exists in this column.`);
      return;
    }

    setSpecColumns((prev) =>
      prev.map((c) => {
        if (c.id === colId) {
          return { ...c, values: [...c.values, val] };
        }
        return c;
      })
    );

    // Strictly NO preset dummy image: user must upload photo for each added color variant
    setNewValInputs((prev) => ({ ...prev, [colId]: '' }));
  };

  const handleRemoveValueFromColumn = (colId: string, valueToRemove: string) => {
    const col = specColumns.find((c) => c.id === colId);
    const isColorCol = col && col.name.toLowerCase().startsWith('color');
    if (isColorCol && valueToRemove === 'Default') {
      alert('The "Default" color uses the product logo photo and cannot be removed while the Color column is active. You can delete the entire Color column if no color variants are needed.');
      return;
    }
    setSpecColumns((prev) =>
      prev.map((c) => {
        if (c.id === colId) {
          return { ...c, values: c.values.filter((v) => v !== valueToRemove) };
        }
        return c;
      })
    );
    setColorPhotos((prev) => {
      const copy = { ...prev };
      delete copy[valueToRemove];
      return copy;
    });
  };

  const handleColorPhotoFileChange = async (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageBeforeUpload(file, 900, 900, 0.75);
        setColorPhotos((prev) => ({ ...prev, [colorName]: compressed.dataUrl }));
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setColorPhotos((prev) => ({ ...prev, [colorName]: event.target?.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const toggleKeyword = (kw: string) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords((prev) => prev.filter((k) => k !== kw));
    } else {
      if (selectedKeywords.length >= 6) {
        alert('You can select a maximum of 6 keywords.');
        return;
      }
      setSelectedKeywords((prev) => [...prev, kw]);
    }
  };

  const handleAddCustomKeyword = () => {
    const val = customKeywordInput.trim();
    if (!val) return;
    if (selectedKeywords.length >= 6) {
      alert('You can select a maximum of 6 keywords.');
      return;
    }
    if (!selectedKeywords.includes(val)) {
      setSelectedKeywords((prev) => [...prev, val]);
    }
    setCustomKeywordInput('');
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' = 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageBeforeUpload(file, 900, 900, 0.75);
        if (target === 'logo') {
          setLogoImage(compressed.dataUrl);
          setColorPhotos((prev) => ({ ...prev, Default: compressed.dataUrl }));
        }
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const res = event.target.result as string;
            if (target === 'logo') {
              setLogoImage(res);
              setColorPhotos((prev) => ({ ...prev, Default: res }));
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      alert('Please correct any validation errors before saving.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      const finalStockCount = parseInt(initialQuantity) || 20;

      // Extract sizes and colors from specColumns
      const sizesCol = specColumns.find((c) => c.name.toLowerCase().startsWith('size'));
      const uniqueSizes = sizesCol && sizesCol.values.length > 0 ? sizesCol.values : ['Standard'];

      const colorsColumn = specColumns.find((c) => c.name.toLowerCase().startsWith('color'));
      const hasColors = Boolean(colorsColumn && colorsColumn.values.length > 0);

      let finalColors: { name: string; hex: string; image?: string }[] = [];
      let finalImages: string[] = [];

      if (hasColors) {
        const validColorVals = colorsColumn!.values.slice(0, 5); // Default + 4 others = max 5
        finalColors = validColorVals.map((v) => ({
          name: v,
          hex: '#2563eb',
          image: v === 'Default' ? logoImage : (colorPhotos[v] || logoImage),
        }));
        const variantPhotos = validColorVals
          .filter((v) => v !== 'Default')
          .map((v) => colorPhotos[v])
          .filter(Boolean);
        finalImages = [logoImage, ...variantPhotos];
      } else {
        finalColors = [{ name: 'Default', hex: '#2563eb', image: logoImage }];
        finalImages = [logoImage];
      }

      const specStrings = specColumns.map((c) => `${c.name}: ${c.values.join(', ') || 'Standard'}`);
      const normSlug = normalizeCategorySlug(effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

      const createdProduct = await createAndPersistProduct({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stockCount: finalStockCount,
        category: effectiveCategory,
        categorySlug: normSlug,
        productClass: selectedClass,
        keywords: selectedKeywords,
        sizes: uniqueSizes,
        colors: finalColors,
        images: finalImages,
        features: [
          `Category: ${effectiveCategory}`,
          `Class: ${selectedClass}`,
          ...specStrings,
        ],
        specifications: {
          Category: effectiveCategory,
          Class: selectedClass === 'I' ? 'Individual (I)' : selectedClass === 'T' ? 'Team (T)' : selectedClass === 'C' ? 'Coaching (C)' : 'Officiation (O)',
          'Listing Type': 'Store Catalog Verified',
          ...Object.fromEntries(specColumns.filter((c) => c.values.length > 0).map((c) => [c.name, c.values.join(', ')])),
          'Search Keywords': selectedKeywords.join(', '),
        },
      });

      onSaveProduct(createdProduct);
      try {
        localStorage.removeItem(STORAGE_KEY_ADD_PRODUCT_DRAFT);
      } catch (_) {}
      onClose();
    } catch (err) {
      console.error('Failed to create and persist product:', err);
      alert('Error creating product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      data-admin-modal="true"
      data-admin-product="true"
      data-prevent-popunder="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
    >
      {/* Google Forms Minimalist Card Container */}
      <div 
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden my-auto transition-all ${
          theme === 'dark' ? 'bg-[#122336] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Google Forms Top Blue Accent Bar */}
        <div className="h-2.5 bg-blue-600 w-full" />

        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                Step {step} of 3
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-100">
                {step === 1 && 'General Product Details'}
                {step === 2 && 'Categorization & Search Keywords'}
                {step === 3 && 'Photos & Specifications Table'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 1 && 'Fill in product name, price, description and baseline quantities.'}
              {step === 2 && 'Assign category, grade classification, and select search keywords.'}
              {step === 3 && 'Set listing logo, gallery pictures, and organize specifications into separate columns.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 shadow-md transition-colors cursor-pointer shrink-0"
            title="Close add product modal"
          >
            <span>Close</span>
            <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
          </button>
        </div>

        {/* Step Progress Indicators (Minimalist Google Forms pill style) */}
        <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between text-xs font-bold ${
          theme === 'dark' ? 'bg-[#0f1d2d] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span className={step === 1 ? 'text-blue-400 font-bold' : ''}>1. General</span>
          </div>

          <div className="h-px w-8 sm:w-16 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {step > 2 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span className={step === 2 ? 'text-blue-400 font-bold' : ''}>2. Category & Keywords</span>
          </div>

          <div className="h-px w-8 sm:w-16 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              3
            </span>
            <span className={step === 3 ? 'text-blue-400 font-bold' : ''}>3. Specs & Stock</span>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh]">
          {/* ================= STEP 1: GENERAL ================= */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>Product Name</span>
                    <span className="text-red-400">*</span>
                  </label>
                  {touched.name && !isNameValid && (
                    <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Product name required (min 2 chars)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Egerton FC Pro Home Match Jersey"
                  value={name}
                  onBlur={() => markTouched('name')}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all focus:outline-hidden ${
                    touched.name && !isNameValid
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : theme === 'dark'
                      ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Description with Character Limit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>Product Description</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${
                    description.length > 300 ? 'text-red-400 font-bold' : 'text-slate-400'
                  }`}>
                    {description.length} / 300 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Enter concise product details, fabric material, and fit specs..."
                  value={description}
                  onBlur={() => markTouched('description')}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all focus:outline-hidden ${
                    touched.description && !isDescValid
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : theme === 'dark'
                      ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
                {touched.description && !isDescValid && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Description must be between 10 and 300 characters.
                  </p>
                )}
              </div>

              {/* Price & Baseline Store Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <span>Price (KES)</span>
                      <span className="text-red-400">*</span>
                    </label>
                    {touched.price && !isPriceValid && (
                      <span className="text-[11px] text-red-400 font-semibold">Enter valid price</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2400"
                    value={price}
                    onBlur={() => markTouched('price')}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all focus:outline-hidden ${
                      touched.price && !isPriceValid
                        ? 'border-red-500 bg-red-500/10 text-white'
                        : theme === 'dark'
                        ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <span>Baseline Store Quantity</span>
                      <span className="text-red-400">*</span>
                    </label>
                    {touched.initialQuantity && !isInitQtyValid && (
                      <span className="text-[11px] text-red-400 font-semibold">Must be 0 or more</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 20"
                    value={initialQuantity}
                    onBlur={() => markTouched('initialQuantity')}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all focus:outline-hidden ${
                      touched.initialQuantity && !isInitQtyValid
                        ? 'border-red-500 bg-red-500/10 text-white'
                        : theme === 'dark'
                        ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 block">
                    (Note: In Step 3, if you configure variants, variant quantities will override this).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: CATEGORY & KEYWORDS ================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Category Dropdown with option to add another */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>Category</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewCategory(!isAddingNewCategory);
                      if (!isAddingNewCategory) setCustomCategory('');
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingNewCategory ? 'Choose from existing' : '+ Add Another Category'}</span>
                  </button>
                </div>

                {!isAddingNewCategory ? (
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingNewCategory(true);
                      } else {
                        setSelectedCategory(e.target.value);
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-hidden ${
                      theme === 'dark' ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="__NEW__">+ Add Custom Category...</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Type custom category name..."
                      value={customCategory}
                      onBlur={() => markTouched('category')}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all focus:outline-hidden ${
                        touched.category && !customCategory.trim()
                          ? 'border-red-500 bg-red-500/10 text-white'
                          : theme === 'dark'
                          ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                    {touched.category && !customCategory.trim() && (
                      <p className="text-[11px] text-red-400 font-semibold">Please enter category name</p>
                    )}
                  </div>
                )}
              </div>

              {/* Product Class Selection (Strict 4 classes: I, T, C, O - NOT preselected) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>Product Class</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Strict class (I, T, C, O) sets 1st letter of Product ID</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CLASS_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setSelectedClass(opt.code);
                        setTouched((prev) => ({ ...prev, productClass: true }));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedClass === opt.code
                          ? 'border-blue-500 bg-blue-600/20 text-white ring-1 ring-blue-500'
                          : theme === 'dark'
                          ? 'bg-[#182b42] border-slate-700 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{opt.code}</span>
                        {selectedClass === opt.code && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <p className="text-[11px] font-bold mt-0.5">{opt.label}</p>
                      <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
                {touched.productClass && !isClassValid && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> Please select a product class to proceed
                  </p>
                )}
              </div>

              {/* Keywords Select Trigger & Chips */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                touched.keywords && !isKeywordsValid
                  ? 'border-red-500 bg-red-500/10'
                  : theme === 'dark'
                  ? 'bg-[#182b42] border-slate-700'
                  : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" />
                      <span>Product Search Keywords</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Select exactly up to 6 search keywords used by customers to find this product.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsKeywordsModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Search className="w-3 h-3" />
                    <span>Select Keywords ({selectedKeywords.length}/6)</span>
                  </button>
                </div>

                {/* Selected Keywords Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => toggleKeyword(kw)}
                        className="text-blue-300 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {selectedKeywords.length === 0 && (
                    <span className="text-xs text-red-400 italic">No keywords selected yet. Please select at least 1 keyword.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SPECS, PHOTOS & VARIANTS ================= */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Headline Product Logo Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Product Logo / Main Photo</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Headline Visual for Storefront & Search</span>
                </div>

                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  theme === 'dark' ? 'bg-[#182b42] border-blue-500/40' : 'bg-slate-50 border-blue-400'
                }`}>
                  <div className="flex items-center gap-3">
                    {logoImage ? (
                      <img 
                        src={logoImage} 
                        alt="Logo preview" 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-900 border border-slate-700 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-500" />
                        <span className="text-[9px] font-semibold text-slate-400">No logo</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                          Main Listing Visual
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">Headline Product Logo / Photo</h4>
                      <p className="text-[11px] text-slate-400">Uploaded logo serves as the primary photo across all user views and Default color variant.</p>
                    </div>
                  </div>
                  <label className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e, 'logo')}
                    />
                  </label>
                </div>
              </div>

              {/* Multi-Column Specifications Table */}
              <div className={`p-4 rounded-xl border space-y-4 ${
                theme === 'dark' ? 'bg-[#182b42] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Product Specifications Table (Multi-Column)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Add specification columns (e.g. Colors, Sizes, Material). Data is placed beneath its column.
                      </p>
                    </div>
                  </div>

                  {/* Add Column Selector & Custom Creator */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isAddingCustomCol ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedColumnToAdd}
                          onChange={(e) => {
                            if (e.target.value === '__CUSTOM__') {
                              setIsAddingCustomCol(true);
                              setCustomColumnName('');
                            } else {
                              setSelectedColumnToAdd(e.target.value);
                            }
                          }}
                          className={`py-1.5 px-2.5 text-xs rounded-lg border font-semibold focus:outline-hidden ${
                            theme === 'dark' ? 'bg-[#122336] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          {availableSpecTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                          <option value="__CUSTOM__">+ Add Custom Specification...</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAddColumn(selectedColumnToAdd)}
                          className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Column</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <input
                          type="text"
                          placeholder="e.g. Fit / Cut"
                          value={customColumnName}
                          onChange={(e) => setCustomColumnName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddColumn();
                            }
                          }}
                          className={`py-1.5 px-2.5 text-xs rounded-lg border focus:outline-hidden ${
                            theme === 'dark' ? 'bg-[#122336] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddColumn()}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          Add & Include in Dropdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomCol(false)}
                          className="py-1.5 px-2 rounded-lg bg-slate-700 text-slate-300 text-xs hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specification Columns Board */}
                {specColumns.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-700 rounded-xl">
                    No specification columns added yet. Select a specification column above to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto pb-1">
                    {specColumns.map((col) => {
                      const isColorCol = col.name.toLowerCase() === 'colors' || col.name.toLowerCase() === 'color';

                      return (
                        <div
                          key={col.id}
                          className={`rounded-xl border flex flex-col justify-between overflow-hidden shadow-xs transition-colors ${
                            theme === 'dark'
                              ? 'bg-[#102235] border-slate-700'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {/* Column Header */}
                          <div className={`p-2.5 border-b flex items-center justify-between ${
                            theme === 'dark' ? 'bg-[#152a42] border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                          }`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${isColorCol ? 'bg-rose-500' : 'bg-blue-500'}`} />
                              <h5 className="text-xs font-black uppercase tracking-wider truncate">
                                {col.name} {isColorCol && '(Max 5)'}
                              </h5>
                              <span className="text-[10px] font-bold text-slate-400 bg-black/20 px-1.5 py-0.2 rounded-full">
                                {col.values.length}{isColorCol && '/5'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(col.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title={`Remove ${col.name} column`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Column Values List - Data placed beneath column header */}
                          <div className="p-2.5 flex-grow space-y-2 min-h-[90px] max-h-[220px] overflow-y-auto">
                            {col.values.length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic py-2 text-center">
                                No values under {col.name}. Add below.
                              </p>
                            ) : (
                              col.values.map((val) => (
                                <div
                                  key={val}
                                  className={`flex items-center justify-between gap-2 p-2 rounded-lg text-xs font-semibold ${
                                    theme === 'dark'
                                      ? 'bg-[#18314e] text-slate-100 border border-slate-700/60'
                                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isColorCol && (
                                      (colorPhotos[val] || (val === 'Default' ? logoImage : '')) ? (
                                        <img
                                          src={colorPhotos[val] || (val === 'Default' ? logoImage : '')}
                                          alt={val}
                                          className="w-7 h-7 rounded-md object-cover border border-slate-600 shrink-0 bg-slate-900"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-md bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-slate-400 shrink-0 text-[9px] font-bold">
                                          ?
                                        </div>
                                      )
                                    )}
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate text-xs font-bold">{val}</span>
                                      {isColorCol && val === 'Default' && (
                                        <span className="text-[9px] text-blue-400 font-medium">Uses Product Logo</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isColorCol && (
                                      val === 'Default' ? (
                                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                                          Default
                                        </span>
                                      ) : (
                                        <label className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                          colorPhotos[val]
                                            ? 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40'
                                            : 'bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40'
                                        }`}>
                                          <Upload className="w-2.5 h-2.5" />
                                          <span>{colorPhotos[val] ? 'Photo Added' : 'Upload *'}</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleColorPhotoFileChange(val, e)}
                                          />
                                        </label>
                                      )
                                    )}
                                    {(!isColorCol || val !== 'Default') && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveValueFromColumn(col.id, val)}
                                        className="text-slate-400 hover:text-red-400 p-1 cursor-pointer"
                                        title={`Remove ${val}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add Value Input beneath the column */}
                          <div className={`p-2 border-t ${
                            theme === 'dark' ? 'bg-[#0e1d2e] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                          }`}>
                            {isColorCol && col.values.length >= 5 ? (
                              <div className="text-[11px] font-semibold text-amber-400 text-center py-1 bg-amber-500/10 rounded-lg">
                                Maximum 5 colors reached (Default + 4 others)
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder={`Add ${col.name.toLowerCase()} value...`}
                                  value={newValInputs[col.id] || ''}
                                  onChange={(e) => setNewValInputs((prev) => ({ ...prev, [col.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddValueToColumn(col.id);
                                    }
                                  }}
                                  className={`flex-grow px-2 py-1.5 text-xs rounded-lg border focus:outline-hidden ${
                                    theme === 'dark' ? 'bg-[#152a42] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddValueToColumn(col.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
                                  title={`Add value to ${col.name}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-[#0f1d2d] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Step {step + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Uploading & Persisting...' : 'Save Product to Catalog'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KEYWORDS SELECTION POPUP MODAL (Admin selects up to 6 keywords) */}
      {isKeywordsModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 flex flex-col max-h-[85vh] ${
            theme === 'dark' ? 'bg-[#15273c] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-blue-400" />
                  <span>Select Product Search Keywords</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose up to 6 relevant search tags ({selectedKeywords.length}/6 selected)
                </p>
              </div>
              <button
                onClick={() => setIsKeywordsModalOpen(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-colors cursor-pointer"
                title="Close keywords selector"
              >
                <span>Close</span>
                <X className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
              </button>
            </div>

            {/* Keyword Search & Add Custom */}
            <div className="py-3 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter available keywords..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                    theme === 'dark' ? 'bg-[#0f1d2d] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or type a custom tag..."
                  value={customKeywordInput}
                  onChange={(e) => setCustomKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomKeyword();
                    }
                  }}
                  className={`flex-grow px-3 py-1.5 text-xs rounded-lg border focus:outline-hidden ${
                    theme === 'dark' ? 'bg-[#0f1d2d] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomKeyword}
                  disabled={selectedKeywords.length >= 6}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Keyword Pool Badges */}
            <div className="overflow-y-auto flex-grow p-1">
              <div className="flex flex-wrap gap-2">
                {PRESET_KEYWORDS
                  .filter((kw) => kw.toLowerCase().includes(keywordSearch.toLowerCase()))
                  .map((kw) => {
                    const isSelected = selectedKeywords.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => toggleKeyword(kw)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
                        }`}
                      >
                        <span>{kw}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {selectedKeywords.length} of 6 selected
              </span>
              <button
                type="button"
                onClick={() => setIsKeywordsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
