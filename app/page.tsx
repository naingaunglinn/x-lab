'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDown, 
  ShoppingBag, 
  X, 
  Sparkles, 
  Layers, 
  Cpu, 
  RotateCw, 
  Trash2, 
  Check, 
  FileText,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';

// Static imports for our generated visual assets
import heroImage from '@/src/assets/images/hero_streetwear_1781057492123.png';
import gloveImage from '@/src/assets/images/tech_glove_product_1781057511455.png';
import stickerImage from '@/src/assets/images/sticker_lineup_1781057530025.png';

// Product Catalog
interface SpecType {
  material?: string;
  thickness?: string;
  dimensions?: string;
  durability?: string;
  finish?: string;
  sensors?: string;
  power?: string;
  structure?: string;
  fit?: string;
  rating?: string;
  series?: string;
  adhesion?: string;
  transmission?: string;
  weight?: string;
  straps?: string;
  protocol?: string;
  charge?: string;
  print?: string;
}

interface Product {
  id: string;
  index: string;
  title: string;
  category: 'Stickers' | 'Future Gear';
  priceStr: string;
  priceNum: number;
  image: string;
  description: string;
  specs: SpecType;
  accent: string;
  tagBadge: string;
}

const PRODUCTS_DATA: Product[] = [
  {
    id: 'sticker-01',
    index: '01',
    title: 'LABS // WARNING_DECAL_V1',
    category: 'Stickers',
    priceStr: '$12.00',
    priceNum: 12.00,
    image: stickerImage.src,
    description: 'Premium heavy-vinyl tactical warning decal lineup. Features triple-layer weatherproofing, 3M-grade strong adhesive, and high-contrast toxic/hazard graphic notation.',
    specs: {
      material: '3M Cast Vinyl + UV Scratch Laminate',
      thickness: '12 mil Heavy Duty Shielding',
      dimensions: '110mm x 110mm panel size',
      durability: '5-Year Active Outdoor Weatherproof Resistance',
      finish: 'Matte Tactile Finish'
    },
    accent: '#8F1D14',
    tagBadge: 'STREETWEAR LOG'
  },
  {
    id: 'gear-01',
    index: '02',
    title: 'SYNAPSE // SHELL_GLOVE',
    category: 'Future Gear',
    priceStr: '$245.00',
    priceNum: 245.00,
    image: gloveImage.src,
    description: 'Biomimetic carbon composite active protection glove. Outfitted with high-contrast tactical volcanic-orange active wiring channels, haptic thermal responsive sensor points, and matte obsidian raw structures.',
    specs: {
      material: 'Liquid TPU Carbon Mesh + Kevlar Weft',
      sensors: 'Biometric Touch-Capacitive Conductors (Fingers)',
      power: 'Integrated 3V rechargeable microcell',
      structure: 'Asymmetrical Ergonomic Finger Seams',
      fit: 'Pre-curved Form Molding'
    },
    accent: '#F89D13',
    tagBadge: 'ACTIVE MODEL'
  },
  {
    id: 'sticker-02',
    index: '03',
    title: 'COGNITIVE_OVERLOAD_THERMO',
    category: 'Stickers',
    priceStr: '$14.50',
    priceNum: 14.50,
    image: stickerImage.src,
    description: 'Thermotropic active decal set that triggers a structural graphic shift under hand temperature activation. Changes from stark deep crimson red to a brilliant cybernetic yellow-orange.',
    specs: {
      material: 'Active Liquid Crystal Composite Film',
      adhesion: 'Dry-Apply air release adhesive layers',
      dimensions: '85mm x 85mm circular format',
      series: '02 // LABORATORY PROTOCOL',
      finish: 'Velvet Satin Thermochromic'
    },
    accent: '#8F1D14',
    tagBadge: 'TEMP ACTIVE'
  },
  {
    id: 'gear-02',
    index: '04',
    title: 'INTELLIGENT_VISOR_S1',
    category: 'Future Gear',
    priceStr: '$380.00',
    priceNum: 380.00,
    image: heroImage.src,
    description: 'Sleek active-shading futuristic helmet visor block. Integrated UV-rejection shields, high-torque industrial fasteners, magnetic strap systems, and modular wear capabilities.',
    specs: {
      material: 'Carbonized Polycarbonate + Steel rivets',
      transmission: 'Variable Light Transmission 15% - 45%',
      weight: '190 grams ultraweight distribution',
      straps: 'Dual magnetic buckle tensioners',
      rating: 'IP55 Atmospheric particle security'
    },
    accent: '#8F1D14',
    tagBadge: 'CONCEPT ARMOR'
  },
  {
    id: 'sticker-03',
    index: '05',
    title: 'BLUEPRINT // WORKSTATION_CALIBRATION',
    category: 'Stickers',
    priceStr: '$9.00',
    priceNum: 9.00,
    image: stickerImage.src,
    description: 'Micro-printed high density machine layout calibration sticker. Pure technical typography, tiny dimensional indicators, and accurate ruler guides designed to accent heavy gear.',
    specs: {
      material: 'Brushed Metallic Alloy Sheeting',
      print: 'UV cured structural obsidian ink layers',
      dimensions: '180mm x 35mm linear block',
      adhesion: 'Permanent Acrylic Pressure-Sensitive',
      finish: 'Satin Metallic Reflective'
    },
    accent: '#1B120F',
    tagBadge: 'TECHNICAL CALIB'
  },
  {
    id: 'gear-03',
    index: '06',
    title: 'LABS // CHRONOKEY_COSMOS_V2',
    category: 'Future Gear',
    priceStr: '$190.00',
    priceNum: 190.00,
    image: gloveImage.src,
    description: 'Offline cryptographically sealed digital key container. Housed in solid structural volcanic-black polymer blocks, featuring active OLED matrix output lines to indicate authentication protocol runs.',
    specs: {
      material: 'Precision Milled 6061-T6 Aluminum',
      protocol: 'Hardware AES-256 air-gapped cryptographic engine',
      dimensions: '60mm x 22mm x 14mm billet',
      charge: 'High-speed Type-C raw pin interface',
      rating: '10m Static Hermetic Submersion'
    },
    accent: '#F89D13',
    tagBadge: 'OFFLINE CRYT'
  }
];

// Interactive sticker items for the modular sandbox workspace
const SANDBOX_STICKERS_LIST = [
  { id: 'sb-1', label: '☣️ DANGER_HIGH_VOLTAGE', color: '#8F1D14', width: 140, rot: -8 },
  { id: 'sb-2', label: '⚠️ SYSTEM_OVERRIDE', color: '#F89D13', width: 160, rot: 5 },
  { id: 'sb-3', label: '[ LABS_RUN_ACTIVE ]', color: '#1B120F', width: 150, rot: 15 },
  { id: 'sb-4', label: '● SECURE_AES_256', color: '#8F1D14', width: 130, rot: -12 },
  { id: 'sb-5', label: 'X // LAB', color: '#F89D13', width: 80, rot: 45 },
  { id: 'sb-6', label: 'WARNING: DO NOT TOUCH', color: '#1B120F', width: 180, rot: -3 },
];

// PURE IMPURE GENERATORS DECOUPLED FROM RENDERING CYCLES (ESlint compliance)
function generateStickerSpecs(stickerLabel: string, color: string, indexSeed: number, width?: number) {
  const timestamp = Date.now();
  const randX = Math.sin(indexSeed + 1) * 0.5 + 0.5; // Deterministic pseudo-randomness inside bounds
  const randY = Math.cos(indexSeed + 2) * 0.5 + 0.5;
  const randRot = Math.sin(indexSeed + 3) * 30;
  
  const id = `placed-${timestamp}-${indexSeed}`;
  return {
    id,
    label: stickerLabel,
    color,
    x: Math.floor(15 + randX * 110),
    y: Math.floor(15 + randY * 90),
    scale: 1,
    rotation: Math.floor(randRot),
    width: width || 140,
  };
}

function generateReceiptManifest(cart: { product: Product; quantity: number }[]) {
  const randNum = Math.floor(100000 + (Math.sin(Date.now()) * 0.5 + 0.5) * 899999);
  const operatorId = Math.floor((Math.cos(Date.now()) * 0.5 + 0.5) * 899);
  const receiptId = `LAB-REC-${randNum}`;
  
  const lineItems = cart.map(item => `   - [${item.product.category.toUpperCase()}] ${item.product.title.padEnd(25)} Qty: ${item.quantity.toString().padStart(2)} | ${(item.product.priceNum * item.quantity).toFixed(2)}`).join('\n');
  const totalCost = cart.reduce((acc, item) => acc + (item.product.priceNum * item.quantity), 0);
  
  return {
    receiptId,
    totalCost,
    manifest: `
========================================
       LAB. DIGITAL SPECIFICATION
             RECEIPT ARCHIVE
========================================
STAMP ID: ${receiptId}
TIMESTAMP: 2026-06-10 // UTC LAB
OPERATOR: USER_${operatorId}
STATUS: ENCRYPTED // AES-256_ACTIVE

[ITEMS PURCHASED]
${lineItems}

----------------------------------------
SUBTOTAL: $${totalCost.toFixed(2)}
DELIVERY: $15.00 (SURFACE SYSTEM CRITICAL)
TOTAL DUE: $${(totalCost + 15).toFixed(2)}
========================================
STATUS: PREPARED FOR HIGH-SPEED LOGISTICS
WEATHERPROOF WRAP PROTOCOL: YES
THANK YOU FOR COLLABORATING WITH X/LABS
========================================
`
  };
}

export default function Page() {
  // Navigation & Category States
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Stickers' | 'Future Gear'>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Cart States
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  // Sticker Sandbox State (Laptop Graphic customizer)
  const [placedStickers, setPlacedStickers] = useState<{
    id: string;
    label: string;
    color: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    width: number;
  }[]>([]);
  const [activeSandboxSticker, setActiveSandboxSticker] = useState<string | null>(null);
  const sandboxCounterRef = useRef<number>(0);

  // Digital Sound Synthesizer toggles
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live Local UTC Clocks
  const [currentTime, setCurrentTime] = useState('02:11:05');
  const [currentDate, setCurrentDate] = useState('2026-06-10');

  useEffect(() => {
    // Keep clock synced
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.getUTCHours().toString().padStart(2, '0') + ':' + 
                     now.getUTCMinutes().toString().padStart(2, '0') + ':' + 
                     now.getUTCSeconds().toString().padStart(2, '0'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Native Synthesizer Sound Maker (No libraries, zero lag)
  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored if blocked by browser autoplay rules
    }
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    playBeep(650, 'triangle', 0.12);
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Visual indicator sequence
    setCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    playBeep(320, 'sine', 0.1);
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    playBeep(490, 'sine', 0.08);
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    }));
  };

  // Checkout Protocol Simulation using pure decouple generator
  const handleCheckout = () => {
    playBeep(880, 'sine', 0.25);
    setTimeout(() => { playBeep(1200, 'sine', 0.15); }, 120);

    const { manifest } = generateReceiptManifest(cart);
    setLastReceipt(manifest);
    setOrderComplete(true);
    setCart([]);
  };

  // Sticker Sandbox actions utilizing decoupled non-pure calculations outside
  const placeStickerOnSandbox = (stickerLabel: string, color: string) => {
    playBeep(720, 'sine', 0.1);
    sandboxCounterRef.current += 1;
    const matchingSticker = SANDBOX_STICKERS_LIST.find(s => s.label === stickerLabel);
    const stickerWidth = matchingSticker ? matchingSticker.width : 140;
    const newSticker = generateStickerSpecs(stickerLabel, color, sandboxCounterRef.current, stickerWidth);
    
    setPlacedStickers(prev => [...prev, newSticker]);
    setActiveSandboxSticker(newSticker.id);
  };

  const removeStickerFromSandbox = (id: string) => {
    playBeep(280, 'sine', 0.1);
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
    if (activeSandboxSticker === id) setActiveSandboxSticker(null);
  };

  const rotateStickerSandbox = (id: string) => {
    playBeep(520, 'triangle', 0.08);
    setPlacedStickers(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, rotation: (s.rotation + 45) % 360 };
      }
      return s;
    }));
  };

  const scaleStickerSandbox = (id: string, multiplier: number) => {
    playBeep(580, 'triangle', 0.08);
    setPlacedStickers(prev => prev.map(s => {
      if (s.id === id) {
        let newScale = s.scale * multiplier;
        if (newScale < 0.6) newScale = 0.6;
        if (newScale > 1.8) newScale = 1.8;
        return { ...s, scale: Number(newScale.toFixed(2)) };
      }
      return s;
    }));
  };

  // Filter products catalog
  const filteredProducts = PRODUCTS_DATA.filter(prod => {
    if (selectedCategory === 'All') return true;
    return prod.category === selectedCategory;
  });

  const cartCount = cart.reduce((acc, current) => acc + current.quantity, 0);

  return (
    <div className="relative min-h-screen font-mono bg-[#E6DEDD] text-[#1B120F] flex flex-col selection:bg-[#8F1D14] selection:text-[#E6DEDD]">
      
      {/* SOLID STRUCTURAL LINES FOR GLOBAL LAYOUT GRID */}
      {/* Top Banner Static System Status */}
      <div className="w-full border-b-2 border-[#1B120F] bg-[#1B120F] text-[#E6DEDD] uppercase text-[10px] tracking-wider py-2 px-4 flex justify-between items-center z-40">
        <div className="flex items-center space-x-6 overflow-hidden max-w-full">
          <span className="flex items-center font-bold text-[#F89D13]">
            <span className="inline-block w-2.5 h-2.5 bg-[#F89D13] animate-pulse mr-2 rounded-none"></span>
            {"STATUS: ACTIVE LABORATORY NETWORK"}
          </span>
          <span className="hidden md:inline font-light opacity-65">{"CHRONO: "} {currentDate} {currentTime} {" UTC"}</span>
          <span className="hidden lg:inline font-light opacity-65">{"// PRE-RELEASE COMPILATION SERIES v4.0.1"}</span>
          <span className="hidden xl:inline font-light opacity-65">{"// ACCENT ALPHA_SECTOR_07"}</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playBeep(440, 'sine', 0.08);
            }} 
            className="flex items-center space-x-1.5 px-2 py-0.5 border border-[#E6DEDD]/20 hover:border-[#F89D13] text-[#E6DEDD] hover:text-[#F89D13] transition-colors focus:outline-none"
            title="Toggle feedback synthesizer audio"
          >
            {soundEnabled ? (
              <>
                <Volume2 size={12} className="text-[#F89D13]" />
                <span className="text-[9px]">{"SYNTH_ON"}</span>
              </>
            ) : (
              <>
                <VolumeX size={12} className="opacity-50" />
                <span className="text-[9px] opacity-50">{"SYNTH_OFF"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Top Header Section */}
      <header className="w-full border-b-2 border-[#1B120F] relative grid grid-cols-1 md:grid-cols-12 h-auto md:h-[100px] bg-[#E6DEDD]">
        
        {/* Left Column Brand Module */}
        <div className="md:col-span-3 border-b md:border-b-0 border-r-2 border-[#1B120F] p-6 flex items-center justify-between">
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-black tracking-tighter text-[#1B120F]">{"X // LAB."}</span>
            <span className="text-xs px-2 py-0.5 font-bold border border-[#1B120F] text-[#E6DEDD] bg-[#1B120F]">{"STORE"}</span>
          </div>
          <span className="text-xs font-bold md:hidden text-[#8F1D14] animate-pulse">{"01"}</span>
        </div>

        {/* Center Sticky/Hover navigation ticker */}
        <div className="md:col-span-6 border-b md:border-b-0 md:border-r-2 border-[#1B120F] px-8 py-4 md:py-0 flex items-center min-w-0">
          <div className="w-full h-full flex items-center overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#E6DEDD] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#E6DEDD] to-transparent z-10 pointer-events-none" />
            
            {/* Seamless Infinite Marquee with Framer Motion */}
            <motion.div 
              animate={{ x: [0, -1000] }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
              style={{ display: 'flex', whiteSpace: 'nowrap' }}
              className="space-x-12 text-xs font-semibold tracking-widest text-[#1B120F] uppercase whitespace-nowrap"
            >
              <span>{"● CODES: PREMIUM HEAVY VINYL SEALS // WEATHERPROOF SPECIFICATIONS // HIGH FIDELITY STICKERS"}</span>
              <span>{"● FUTURISTIC CONCEPT GADGETS PREVIEW ACTIVE // SCALABLE CORE INFRASTRUCTURE"}</span>
              <span>{"● DISRUPTING AESTHETICS DAILY // SWISS GEOMETRY DESIGN GRID // MONOSPACE LABELS"}</span>
              <span>{"● 16-35 SECTOR SECURED // RESISTANCE RESISTANT 100% QUALITY SPEC"}</span>
            </motion.div>
          </div>
        </div>

        {/* Right Corner Indicator Block */}
        <div className="md:col-span-3 p-6 flex items-center justify-between bg-[#1B120F]/5">
          <div className="text-[11px] leading-tight font-bold text-[#1B120F]">
            <div>{"COORD / 45.10.99"}</div>
            <div className="font-light opacity-75">{"SECTOR: EUROPE_AMERICA"}</div>
          </div>
          
          {/* Cart Icon / Action Widget */}
          <button 
            id="cart-trigger-button"
            onClick={() => {
              playBeep(700, 'sine', 0.1);
              setCartOpen(true);
            }}
            className="flex items-center space-x-2 border-2 border-[#1B120F] bg-[#E6DEDD] hover:bg-[#8F1D14] hover:text-[#E6DEDD] active:translate-x-0.5 active:translate-y-0.5 transition-all text-[#1B120F] px-4 py-2 font-bold text-xs"
          >
            <ShoppingBag size={14} />
            <span>{"CART ["}{cartCount}{"]"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="flex-grow w-full grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* Sticky Future-Proof Category Navigation Column (Asymmetric Left Sidebar) */}
        <aside className="lg:col-span-3 border-r-2 border-[#1B120F] flex flex-col justify-between bg-[#E6DEDD] p-8 space-y-12">
          
          <div className="space-y-8">
            <div className="border-b border-[#1B120F]/20 pb-4">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#1B120F]/50">
                {"01 / EXPLORATION FILTERS"}
              </span>
              <h2 className="text-lg font-bold text-[#1B120F] mt-1">{"THE DIGITAL VAULT"}</h2>
            </div>

            {/* Interactive Filters with exact 0.3s transition hover effects as specified */}
            <nav className="flex flex-col space-y-4">
              {[
                { name: 'All', label: '00 // SHOW ALL CATALOG', count: PRODUCTS_DATA.length },
                { name: 'Stickers', label: '01 // WEATHERPROOF STICKERS', count: PRODUCTS_DATA.filter(p => p.category === 'Stickers').length },
                { name: 'Future Gear', label: '02 // COGNITIVE LAB GADGETS', count: PRODUCTS_DATA.filter(p => p.category === 'Future Gear').length },
              ].map((category) => {
                const isActive = selectedCategory === category.name;
                return (
                  <button
                    key={category.name}
                    onClick={() => {
                      playBeep(450 + (isActive ? 150 : 50), 'sine', 0.08);
                      setSelectedCategory(category.name as any);
                    }}
                    className={`relative w-full border text-left p-4.5 font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#1B120F] text-[#E6DEDD] border-[#1B120F] translate-x-2'
                        : 'border-[#1B120F] hover:border-[#8F1D14] hover:text-[#801b13] bg-[#E6DEDD]/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs tracking-tight">{category.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 ${isActive ? 'bg-[#F89D13] text-[#1B120F]' : 'bg-[#1B120F]/10 text-[#1B120F]/70'}`}>
                        {category.count}
                      </span>
                    </div>
                    {/* Tiny visual highlight block matching the Design language */}
                    {isActive && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#F89D13]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Asymmetric Swiss Detail block - "Lab Coordinates" info panel */}
          <div className="border-t-2 border-[#1B120F] pt-6 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#8F1D14]">
              <Layers size={13} />
              <span>{"ACTIVE SYSTEM CONSTRAINTS"}</span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-[#1B120F]/70">
              {"This space serves the 16-35 design sector. Raw grid architecture, high contrast offsets, and direct mechanical typography form our molecular layout standards."}
            </p>

            <div className="bg-[#1B120F]/5 p-3 flex flex-col space-y-1.5 text-[10px] text-[#1B120F] border border-[#1B120F]/15">
              <div className="flex justify-between">
                <span className="opacity-60">{"GRID STATUS"}</span>
                <span className="font-bold text-[#8F1D14]">{"100% VISIBLE SEALS"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">{"ACCENTS MAP"}</span>
                <span className="font-bold text-[#F89D13]">{"#F89D13 / #8F1D14"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">{"GEOMETRY RULES"}</span>
                <span className="font-bold">{"SWISS EDITORIAL SYSTEM"}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Center Work Area (Exploded layout) */}
        <section className="lg:col-span-9 flex flex-col bg-[#E6DEDD]">
          
          {/* Stark Asymmetric Hero Section */}
          <div className="w-full border-b-2 border-[#1B120F] grid grid-cols-1 md:grid-cols-12 relative min-h-[460px] bg-gradient-to-tr from-[#1B120F]/5 via-transparent to-transparent">
            
            {/* Left Statement Block */}
            <div className="col-span-1 md:col-span-5 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r-2 border-[#1B120F]">
              <div>
                <div className="text-[#8F1D14] text-xs font-extrabold tracking-widest uppercase mb-4">
                  {"[ SERIES 001 // THE LAUNCH ]"}
                </div>
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-[#1B120F] select-none leading-none">
                  {"lab."}
                </h1>
                <div className="text-3xl font-extrabold tracking-tighter text-[#1B120F] mt-2">
                  {"MATERIAL_SYSTEM_01"}
                </div>
                <p className="text-sm mt-6 text-[#1B120F]/80 leading-relaxed max-w-sm">
                  {"A stark exploration of premium physical decals and future electronics design. Built under extreme tactical limits. Precision-crafted for immediate use."}
                </p>
              </div>

              {/* Action Circle CTA & Offset Indicator */}
              <div className="mt-8 pt-8 border-t border-[#1B120F]/25 flex items-end justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] block opacity-50">{"SCROLL PROTOCOL"}</span>
                  <a 
                    href="#catalog-anchor"
                    onClick={(e) => {
                      e.preventDefault();
                      playBeep(500, 'sine', 0.1);
                      document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center space-x-1.5 text-xs font-bold hover:text-[#8F1D14] transition-colors"
                  >
                    <span>{"BROWSE STICKER LAB"}</span>
                    <ArrowDown size={14} className="animate-bounce" />
                  </a>
                </div>
                <div className="font-black text-6xl opacity-35 tracking-tight text-[#1B120F]">
                  {"001"}
                </div>
              </div>
            </div>

            {/* Asymmetrical Right Model Banner Block with Overlapping Orange Overlay */}
            <div className="col-span-1 md:col-span-7 relative overflow-hidden flex items-stretch">
              
              {/* Massive high-contrast vivid orange background block that visually overlaps as specified */}
              <div className="absolute top-[25%] left-0 right-0 h-[45%] bg-[#8F1D14] z-0 transform skew-y-3 flex items-center justify-center border-y-2 border-[#1B120F] overflow-hidden">
                <div className="text-[#E6DEDD] text-[150px] font-black opacity-10 uppercase tracking-tighter select-none whitespace-nowrap animate-pulse">
                  {"FUTURE CONCEPT LABS"}
                </div>
              </div>

              {/* Streetswear Featured Model Image wrapped in asymmetrical, grid borders */}
              <div className="relative w-[340px] md:w-[420px] max-w-full mx-auto my-12 z-10 border-2 border-[#1B120F] bg-[#E6DEDD] shadow-[8px_8px_0px_#1B120F] flex flex-col">
                <div className="h-8 bg-[#1B120F] text-[#E6DEDD] px-4 flex justify-between items-center text-[10px]">
                  <span>{"REACTION_DECAL.EXE // CORE_RUN"}</span>
                  <span className="inline-block w-2.5 h-2.5 bg-[#F89D13]"></span>
                </div>
                <div className="relative flex-grow h-[350px] overflow-hidden bg-[#1D1B1B]">
                  <img
                    src={heroImage.src}
                    alt="X Labs Streetwear Model - Orange and obsidian cargo jacket with face cover"
                    className="w-full h-full object-cover grayscale brightness-95 contrast-110 hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Absolute visual overlay markers */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#1B120F] text-[#E6DEDD] p-3 border border-[#F89D13]/55 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] tracking-tight font-extrabold text-[#F89D13]">{"SYSTEM DESIGN DECAL SPEC"}</div>
                      <div className="text-[9px] opacity-70">{"LIMITED TEST LAUNCH // AREA_4"}</div>
                    </div>
                    {/* Circle hover CTA overlapping the graphic */}
                    <button 
                      onClick={() => handleAddToCart(PRODUCTS_DATA[1])}
                      className="bg-[#F89D13] hover:bg-[#8F1D14] text-[#1B120F] hover:text-[#E6DEDD] p-2 leading-none border border-[#1B120F] active:scale-95 transition-all focus:outline-none"
                      title="Add Featured Gglove concept to security cart"
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Superimpose extra technical labels around visual blocks to complete Swiss aesthetics */}
              <div className="absolute right-4 top-4 text-right z-20 text-[9px] text-[#1B120F] opacity-70 leading-tight hidden lg:block uppercase font-bold">
                <div>{"X-LAB MODEL SECURE // 2026_M"}</div>
                <div>{"AUTOUR DETAILED MATERIALS: LAB_09"}</div>
                <div>{"X/LABS HEAVY SEALS"}</div>
              </div>

            </div>

          </div>

          {/* Anchor Scroll Header for Physical Product List */}
          <div id="catalog-anchor" className="w-full bg-[#1B120F] text-[#E6DEDD] border-b-2 border-[#1B120F] py-4 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <span className="bg-[#8F1D14] text-[#E6DEDD] px-2 py-0.5 text-xs font-extrabold font-mono border border-[#E6DEDD]/20">
                {"DEPT 02"}
              </span>
              <h3 className="text-sm font-black tracking-widest uppercase">
                {"THE LAB CATALOG // "}{selectedCategory.toUpperCase()}{" PRODUCTS"}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="opacity-60 text-[11px] uppercase">{"SORT PROTOCOL:"}</span>
              <span className="font-bold text-[#F89D13] border-b border-[#F89D13]">{"DEFAULT MECHANICAL ID"}</span>
            </div>
          </div>

          {/* Structured Editorial Product Grid ("The Lab") */}
          <div className="p-8 flex-grow">
            {filteredProducts.length === 0 ? (
              <div className="w-full border-2 border-dashed border-[#1B120F]/30 p-16 text-center">
                <p className="text-sm text-[#1B120F]/60 font-bold mb-4">{"NO COMPONENT REGISTERED UNDER THIS CATEGORY."}</p>
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className="bg-[#1B120F] text-[#E6DEDD] font-bold px-6 py-2 hover:bg-[#8F1D14] transition-colors"
                >
                  {"RESET EXPLORATION FILTERS"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                
                {/* Product Mapping with Framer Motion 0.3s Transition hover animations */}
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="border-2 border-[#1B120F] bg-[#E6DEDD] hover:shadow-[6px_6px_0px_#1B120F] transition-shadow duration-300 flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Product Header / Index Block */}
                      <div className="border-b border-[#1B120F] p-4 flex justify-between items-center bg-[#1B120F]/5">
                        <span className="text-2xl font-black text-[#1B120F]">{product.index}</span>
                        <span className="text-[10px] border border-[#1B120F] px-2 py-0.5 font-bold uppercase tracking-tighter bg-[#E6DEDD]">
                          {product.category}
                        </span>
                      </div>

                      {/* Product Image Area with Offset Overlap design */}
                      <div className="p-6 flex items-center justify-center border-b border-[#1B120F] bg-white/20 min-h-[220px] relative overflow-hidden group">
                        
                        {/* Decorative solid red or yellow block behind for asymmetrical Neo-Brutalist depth */}
                        <div 
                          className="absolute w-24 h-24 -right-4 -bottom-4 opacity-15 transform rotate-12 transition-all duration-300 group-hover:scale-150"
                          style={{ backgroundColor: product.accent }}
                        />

                        <img
                          src={product.image}
                          alt={product.title}
                          className="max-h-[160px] max-w-[85%] object-contain grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Interactive "Spec quick view" badge on mouseover */}
                        <div className="absolute top-3 left-3 bg-[#1B120F] text-[#E6DEDD] text-[9px] py-0.5 px-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-wider">
                          {product.tagBadge}
                        </div>
                      </div>

                      {/* Product Text info and Buy panel */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-black tracking-tight text-[#1B120F] leading-tight uppercase group-hover:text-[#8F1D14] transition-colors">
                              {product.title}
                            </h4>
                            <span className="text-sm font-extrabold text-[#1B120F] whitespace-nowrap bg-[#F89D13]/10 px-1.5 border border-[#F89D13]/25">
                              {product.priceStr}
                            </span>
                          </div>
                          <p className="text-xs text-[#1B120F]/80 mt-2 line-clamp-3 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        {/* Interactive Actions Grid */}
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => {
                              playBeep(450, 'sine', 0.1);
                              setSelectedProduct(product);
                            }}
                            className="flex-grow border-2 border-[#1B120F] py-2 px-3 hover:bg-[#1B120F]/90 hover:text-[#E6DEDD] font-bold text-xs flex justify-center items-center space-x-1.5 transition-colors duration-200 active:translate-y-0.5"
                          >
                            <FileText size={13} />
                            <span>{"SPEC_REPORT"}</span>
                          </button>
                          
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-2 border-2 border-[#1B120F] bg-[#8F1D14] hover:bg-[#F89D13] text-[#E6DEDD] hover:text-[#1B120F] transition-colors duration-200 active:translate-y-0.5"
                            title="Add to heavy supply cart"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

              </div>
            )}
          </div>

          {/* Interactive Lab Sticker Showcase Sandbox */}
          <div className="border-t-2 border-[#1B120F] bg-[#1B120F]/5">
            
            {/* Header of Sandbox */}
            <div className="border-b border-[#1B120F] bg-[#1B120F] text-[#E6DEDD] py-4 px-8 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Sparkles size={16} className="text-[#F89D13] animate-pulse" />
                <h3 className="text-xs uppercase font-extrabold tracking-widest">
                  {"03 / INTERACTIVE DIGITAL PLAYGROUND // CUSTOMIZER LAB"}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 border border-[#E6DEDD]/20 uppercase">{"DECAL RESISTANCE PREVIEW v2"}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 relative">
              
              {/* Sandbox Left Control Deck */}
              <div className="xl:col-span-4 p-8 border-b xl:border-b-0 xl:border-r border-[#1B120F] space-y-6">
                <div>
                  <h4 className="text-base font-bold text-[#1B120F]">{"APPLY DECALS TO GEAR"}</h4>
                  <p className="text-xs mt-1.5 text-[#1B120F]/70 leading-relaxed">
                    {"Select a high-contrast vinyl warning label below to dynamically synthesize it onto our custom titanium-matte workspace lid. Rotate, scale, and layer elements."}
                  </p>
                </div>

                {/* Sticker Palette Selector */}
                <div className="space-y-3.5">
                  <span className="text-[10px] block font-bold text-[#8F1D14] uppercase tracking-wider">{"AVAILABLE DECAL CODES:"}</span>
                  <div className="flex flex-col gap-2">
                    {SANDBOX_STICKERS_LIST.map((sticker) => {
                      return (
                        <button
                          key={sticker.id}
                          onClick={() => placeStickerOnSandbox(sticker.label, sticker.color)}
                          className="w-full text-left border border-[#1B120F] p-3 hover:bg-[#1B120F] text-[#1B120F] hover:text-[#E6DEDD] transition-colors text-xs font-bold flex items-center justify-between"
                        >
                          <span>{sticker.label}</span>
                          <span 
                            className="w-3 h-3 border border-[#1B120F]" 
                            style={{ backgroundColor: sticker.color }} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset Tool Controls */}
                <div className="border-t border-[#1B120F]/20 pt-4 flex justify-between items-center">
                  <span className="text-[10px] text-[#1B120F]/60">{"ACTIVE ON SCREEN: "}{placedStickers.length}</span>
                  <button
                    onClick={() => {
                      playBeep(300, 'sawtooth', 0.15);
                      setPlacedStickers([]);
                      setActiveSandboxSticker(null);
                    }}
                    disabled={placedStickers.length === 0}
                    className="flex items-center space-x-1 border border-[#8F1D14]/50 text-[#8F1D14] hover:bg-[#8F1D14] hover:text-[#E6DEDD] transition-colors py-1 px-3 text-xs font-bold disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8F1D14]"
                  >
                    <RefreshCw size={11} />
                    <span>{"RESET CANVAS"}</span>
                  </button>
                </div>
              </div>

              {/* Sandbox Active Canvas Arena (Matte Black Titanium Laptop Workspace) */}
              <div className="xl:col-span-8 p-8 flex flex-col justify-between bg-zinc-950 text-[#E6DEDD] min-h-[440px] relative">
                
                {/* Grid Overlay background lines for technical look */}
                <div className="absolute inset-0 opacity-15 pointer-events-none lab-grid-bg" />

                <div className="relative z-10 flex justify-between text-[11px] font-bold text-zinc-500 uppercase">
                  <span>{"TERMINAL WORKSPACE // SYSTEM_LID_VIEW"}</span>
                  <span className="text-[#F89D13] font-light tracking-widest">{"// CLONE_MODEL_L-4"}</span>
                </div>

                {/* Virtual Laptop Workspace Representation */}
                <div className="flex-grow flex items-center justify-center py-8 relative">
                  
                  {/* Laptop Frame Core */}
                  <div className="w-[380px] md:w-[480px] h-[240px] md:h-[290px] border-4 border-zinc-700 bg-zinc-900 rounded-2xl relative shadow-2xl flex flex-col justify-between p-4 overflow-hidden select-none">
                    
                    {/* Subtle metallic matte reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/20 via-transparent to-zinc-500/10 pointer-events-none" />
                    
                    {/* Center metallic logo */}
                    <div className="absolute top-[45%] left-[45%] translate-x-1/2 translate-y-1/2 flex flex-col items-center opacity-20 pointer-events-none z-10">
                      <span className="text-[25px] font-black tracking-widest font-mono text-[#E6DEDD]">{"X"}</span>
                    </div>

                    {/* Placed Stickers Interactive Render with exact 0.3s framer-motion responsive alignments */}
                    <div className="absolute inset-2 z-20">
                      {placedStickers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-[11px] text-zinc-500 uppercase tracking-widest border border-zinc-800 p-2 text-center bg-zinc-950/40">
                            {"[ VACANT_LID // INJECT STICKER CODES ]"}
                          </p>
                        </div>
                      )}

                      <AnimatePresence>
                        {placedStickers.map((sticker) => {
                          const isActive = activeSandboxSticker === sticker.id;
                          return (
                            <motion.div
                              key={sticker.id}
                              initial={{ scale: 0, rotate: sticker.rotation - 20, opacity: 0 }}
                              animate={{ scale: sticker.scale, rotate: sticker.rotation, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                playBeep(520, 'sine', 0.05);
                                setActiveSandboxSticker(sticker.id);
                              }}
                              style={{ 
                                left: `${sticker.x}px`,
                                top: `${sticker.y}px`,
                                width: `${sticker.width}px`
                              }}
                              className={`absolute cursor-pointer p-2.5 font-bold border-2 text-[10px] break-all leading-tight select-none shadow-md ${
                                isActive 
                                  ? 'border-[#F89D13] shadow-[#F89D13]/40 z-40 bg-[#E6DEDD] text-[#1B120F]' 
                                  : 'border-[#E6DEDD] z-30 bg-[#1B120F] text-[#E6DEDD]'
                              }`}
                            >
                              <div className="flex flex-col space-y-1 block max-w-full">
                                <div className="flex justify-between items-center text-[8px] opacity-75 border-b border-current pb-1 mb-1">
                                  <span>{"DEC-OK // "}{sticker.id.substring(7, 11)}</span>
                                  {isActive && <span className="text-[#8F1D14] font-bold">{"ACTIVE"}</span>}
                                </div>
                                <span className="tracking-tight uppercase">{sticker.label}</span>
                              </div>

                              {/* Tiny Custom Modifier Handles when Active */}
                              {isActive && (
                                <div className="absolute -top-3 -right-3 flex space-x-1.5 z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      rotateStickerSandbox(sticker.id);
                                    }}
                                    className="bg-[#1B120F] text-[#E6DEDD] border border-[#F89D13] p-1 hover:bg-[#8F1D14] active:scale-95 transition-all focus:outline-none"
                                    title="Rotate 45 degrees"
                                  >
                                    <RotateCw size={8} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      scaleStickerSandbox(sticker.id, 1.15);
                                    }}
                                    className="bg-[#1B120F] text-[#E6DEDD] border border-[#F89D13] p-1.5 leading-none hover:bg-zinc-800 active:scale-95 transition-all focus:outline-none"
                                    title="Scale Up"
                                  >
                                    <Plus size={8} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      scaleStickerSandbox(sticker.id, 0.85);
                                    }}
                                    className="bg-[#1B120F] text-[#E6DEDD] border border-[#F89D13] p-1.5 leading-none hover:bg-zinc-800 active:scale-95 transition-all focus:outline-none"
                                    title="Scale Down"
                                  >
                                    <Minus size={8} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeStickerFromSandbox(sticker.id);
                                    }}
                                    className="bg-[#8F1D14] text-[#E6DEDD] border border-[#E6DEDD] p-1 hover:bg-red-600 active:scale-95 transition-all focus:outline-none"
                                    title="Dismiss design item"
                                  >
                                    <X size={8} />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Rubber hinge / Base connector representation */}
                    <div className="absolute bottom-0 left-[20%] right-[20%] h-3 bg-zinc-950 rounded-t-lg pointer-events-none" />
                  </div>

                </div>

                {/* Workspace Footer Action Ticker */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] text-zinc-500 mt-4 border-t border-zinc-800 pt-4">
                  <div>
                    <span>{"* NOTE: DOUBLE CLICK DECALS IN THIS EMULATOR TO UNLOCK ADVANCED ALIGNMENTS."}</span>
                    <div className="opacity-50">{"STRETCH-RESISTANT HIGH PRECISION SIMULATOR MODE"}</div>
                  </div>
                  <div className="flex space-x-2">
                    <span className="text-zinc-400">{"HARDWARE MODEL:"}</span>
                    <span className="font-bold text-[#F89D13]">{"TITANIUM // SECURE"}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </section>

      </main>

      {/* Global Bottom High-Contrast Info Banner */}
      <footer className="w-full bg-[#1B120F] text-[#E6DEDD] border-t-2 border-[#1B120F] p-12 grid grid-cols-1 md:grid-cols-12 gap-8 z-30">
        
        <div className="col-span-1 md:col-span-4 space-y-4">
          <div className="text-xl font-black">{"X // LABS"}</div>
          <p className="text-xs text-[#E6DEDD]/60 leading-relaxed max-w-sm">
            {"Future-proof digital showcase dedicated to premium decals and concept structural products. Merging hard geometry grids, raw monochromatic textures, and Swiss layouts for active target groups."}
          </p>
          <div className="text-[10px] opacity-40 font-mono">
            {"© 2026 // ALL SYSTEMS ACTIVE AND VERIFIED RESISTANT"}
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 space-y-2">
          <span className="text-[10px] text-[#F89D13] font-bold uppercase tracking-widest block">{"DECAL CODES"}</span>
          <ul className="space-y-1.5 text-xs text-[#E6DEDD]/80">
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// COGNITIVE_OVERLOAD_ACTIVE"}</li>
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// WARNING_WARNING_S7"}</li>
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// SYSTEM_FAILURE_LABS"}</li>
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// CALIBRATION_GRID_METRIC"}</li>
          </ul>
        </div>

        <div className="col-span-1 md:col-span-3 space-y-2">
          <span className="text-[10px] text-[#F89D13] font-bold uppercase tracking-widest block">{"FUTURE GEAR SENSORS"}</span>
          <ul className="space-y-1.5 text-xs text-[#E6DEDD]/80">
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// THERMO_RESPONSIVE_GLOVES"}</li>
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// ACTIVE_SHIELDING_SHADOW"}</li>
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// SECURE_OFFLINE_STORAGE"}</li>
            <li className="hover:text-[#F89D13] transition-colors cursor-pointer">{"// HELMET_VISOR_ACTIVE"}</li>
          </ul>
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2 text-right">
          <span className="text-[10px] text-zinc-500 block uppercase font-bold text-right">{"SYSTEM SPEC"}</span>
          <div className="bg-[#E6DEDD] text-[#1B120F] text-[10px] font-bold p-2 text-center uppercase tracking-tighter">
            {"EST: 2026 // UTC"}
          </div>
          <div className="text-[9px] opacity-45">{"CODEBASE SECURED AES_256"}</div>
        </div>

      </footer>

      {/* ========================================================================= */}
      {/* OVERLAY COMPONENT: INTERACTIVE PRODUCT DETAIL SPEC SHEETS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
            
            {/* Click backdrop to exit */}
            <div className="absolute inset-0" onClick={() => {
              playBeep(400, 'sine', 0.08);
              setSelectedProduct(null);
            }} />

            {/* Slide in drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-xl h-full bg-[#E6DEDD] border-l-4 border-[#1B120F] p-8 flex flex-col justify-between overflow-y-auto shadow-2xl z-20 text-[#1B120F]"
            >
              
              {/* Drawer Top Header */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#1B120F]/20 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold bg-[#1B120F] text-[#E6DEDD] px-2 py-0.5">
                      {selectedProduct.index}
                    </span>
                    <span className="text-xs uppercase font-extrabold text-[#8F1D14]">
                      {"TECHNICAL SPEC REPORT"}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      playBeep(400, 'sine', 0.08);
                      setSelectedProduct(null);
                    }}
                    className="border-2 border-[#1B120F] hover:bg-[#8F1D14] hover:text-[#E6DEDD] p-2 transition-colors active:translate-y-0.5 focus:outline-none"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Centered Graphic showcase in report */}
                <div className="border border-[#1B120F] p-6 bg-white/30 flex items-center justify-center min-h-[200px] relative">
                  <div className="absolute left-2 top-2 text-[8px] text-[#1B120F]/50 font-mono">{"LABS_SPEC_VISUAL_DEPT_02"}</div>
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="max-h-[160px] object-contain grayscale tracking-tight"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Text Report Detail */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] text-[#F89D13] font-extrabold uppercase bg-[#F89D13]/10 px-1.5 border border-[#F89D13]/30">
                    {"STATUS: VERIFIED RESISTANT"}
                  </span>
                  <h3 className="text-xl font-black text-[#1B120F] uppercase">{selectedProduct.title}</h3>
                  <p className="text-xs leading-relaxed text-[#1B120F]/85">{selectedProduct.description}</p>
                </div>

                {/* Spec Table */}
                <div className="border-t border-[#1B120F] pt-4 mt-6">
                  <span className="text-[10px] block font-bold text-[#8F1D14] uppercase mb-2">
                    {"MOLECULAR LAYOUT DESIGN METRICS:"}
                  </span>
                  <div className="flex flex-col space-y-2">
                    {Object.entries(selectedProduct.specs).map(([key, value]) => {
                      return (
                        <div key={key} className="flex justify-between items-center text-xs border-b border-[#1B120F]/15 py-1">
                          <span className="opacity-55 uppercase font-semibold">{key}</span>
                          <span className="font-bold text-[#1B120F] text-right">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Drawer bottom order action */}
              <div className="border-t-2 border-[#1B120F] pt-6 flex gap-4 mt-8">
                <div className="flex-grow flex flex-col justify-center">
                  <span className="text-[9px] opacity-55">{"STARK VALUE:"}</span>
                  <span className="text-lg font-extrabold text-[#1B120F]">{selectedProduct.priceStr}</span>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="bg-[#8F1D14] hover:bg-[#F89D13] text-[#E6DEDD] hover:text-[#1B120F] font-black uppercase text-xs tracking-wider py-4 px-8 border-2 border-[#1B120F] transition-all duration-200"
                >
                  {"ACQUIRE_MATERIAL"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* OVERLAY COMPONENT: INTERACTIVE CART AND LAB RECEIPT STATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
            
            <div className="absolute inset-0" onClick={() => {
              playBeep(400, 'sine', 0.08);
              setCartOpen(false);
              setOrderComplete(false);
              setLastReceipt(null);
            }} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-lg h-full bg-[#E6DEDD] border-l-4 border-[#1B120F] p-8 flex flex-col justify-between overflow-y-auto shadow-2xl z-20 text-[#1B120F]"
            >
              
              {/* Cart Drawer Header */}
              <div className="space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center border-b border-[#1B120F]/20 pb-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="text-[#8F1D14]" size={16} />
                    <span className="text-xs uppercase font-extrabold tracking-widest">
                      {"LAB SUPPLY CART STATION // TOTALS"}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      playBeep(400, 'sine', 0.08);
                      setCartOpen(false);
                      setOrderComplete(false);
                      setLastReceipt(null);
                    }}
                    className="border-2 border-[#1B120F] hover:bg-[#8F1D14] hover:text-[#E6DEDD] p-2 transition-colors active:translate-y-0.5 focus:outline-none"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* If order check is completed successfully */}
                {orderComplete && lastReceipt ? (
                  <div className="space-y-4 flex-grow flex flex-col justify-center py-4">
                    <div className="bg-[#F89D13]/10 border border-[#F89D13] p-4 text-[#1B120F] space-y-1.5 text-center">
                      <div className="w-8 h-8 rounded-full bg-[#1B120F] text-[#F89D13] flex items-center justify-center mx-auto mb-1">
                        <Check size={16} />
                      </div>
                      <h4 className="text-sm font-black">{"STAMP SUCCESS // ORDER TRANSMITTED"}</h4>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        {"Your conceptual supply chain request has been compiled. Read the transaction stamp sheet report below."}
                      </p>
                    </div>

                    <div className="relative flex-grow bg-zinc-950 text-[#E6DEDD] font-mono text-[9px] p-4 border-2 border-[#1B120F] overflow-x-auto whitespace-pre rounded-sm leading-tight max-h-[360px]">
                      {lastReceipt}
                    </div>

                    <button
                      onClick={() => {
                        playBeep(420, 'sine', 0.08);
                        setOrderComplete(false);
                        setLastReceipt(null);
                        setCartOpen(false);
                      }}
                      className="w-full bg-[#1B120F] text-[#E6DEDD] py-3 text-xs font-bold font-mono tracking-wider text-center border-2 border-[#1B120F] hover:bg-[#8F1D14] transition-colors"
                    >
                      {"SECURE_CLOSE"}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Cart Items List */}
                    <div className="flex-grow overflow-y-auto space-y-4 py-4 min-h-[300px]">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                          <p className="text-xs font-extrabold text-[#1B120F]/50 uppercase tracking-widest mb-2">
                            {"[ SUPPLY CHANNELS EMPTY ]"}
                          </p>
                          <p className="text-[11px] text-[#1B120F]/65 max-w-xs">
                            {"Select weatherproof warning stickers or modular conceptual gadgets to load them onto our hardware truck."}
                          </p>
                        </div>
                      ) : (
                        cart.map((item) => {
                          return (
                            <div 
                              key={item.product.id}
                              className="border border-[#1B120F] bg-white/20 p-4 flex gap-4 items-center justify-between group"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <span className="text-xs font-black bg-[#1B120F] text-[#E6DEDD] px-1.5 py-0.5">
                                  {item.product.index}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-[#1B120F] truncate uppercase">{item.product.title}</h4>
                                  <div className="text-[10px] text-[#1B120F]/60 uppercase">{item.product.category}</div>
                                  <div className="text-xs font-extrabold text-[#8F1D14] mt-1">${item.product.priceNum.toFixed(2)}</div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                {/* Quantity Toggles */}
                                <div className="flex items-center border border-[#1B120F] bg-[#E6DEDD]">
                                  <button
                                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                    className="px-2 py-1 text-xs hover:bg-[#1B120F]/10 font-black"
                                  >
                                    {"-"}
                                  </button>
                                  <span className="px-2 text-xs font-bold text-center min-w-[20px]">{item.quantity}</span>
                                  <button
                                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                    className="px-2 py-1 text-xs hover:bg-[#1B120F]/10 font-black"
                                  >
                                    {"+"}
                                  </button>
                                </div>

                                {/* Trash Delete Button */}
                                <button
                                  onClick={() => handleRemoveFromCart(item.product.id)}
                                  className="text-[#1B120F]/60 hover:text-[#8F1D14] p-1.5 border border-transparent hover:border-[#8F1D14]/30"
                                  title="Dismiss item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Cart Totals Checkout Pane */}
                    {cart.length > 0 && (
                      <div className="border-t-2 border-[#1B120F] pt-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="opacity-60">{"SUPPLY CHAIN COMPONENT COUNT:"}</span>
                            <span className="font-bold">{cartCount} {" ITEMS"}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="opacity-60">{"WEATHER SEAL SURFACE DISPATCH:"}</span>
                            <span className="font-bold">{"$15.00"}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-dashed border-[#1B120F]/30 pt-2 font-bold select-none">
                            <span>{"TOTAL STARK VALUATION:"}</span>
                            <span className="text-[#8F1D14] text-lg">
                              {"$"}{(cart.reduce((acc, item) => acc + (item.product.priceNum * item.quantity), 0) + 15).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleCheckout}
                          className="w-full bg-[#1B120F] text-[#E6DEDD] hover:bg-[#8F1D14] py-4 text-xs font-black uppercase tracking-widest text-center border-2 border-[#1B120F] active:translate-y-1 transition-all"
                        >
                          {"INITIALIZE_SECURE_CHECKOUT"}
                        </button>
                        <p className="text-[10px] text-center opacity-45 uppercase leading-none">
                          {"* ALL OUTLET SHIPMENTS ARMED WITH SECURE PLASTIC LAMINATING SHEATHS."}
                        </p>
                      </div>
                    )}
                  </>
                )}

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
