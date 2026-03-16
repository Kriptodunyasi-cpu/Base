/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ethers } from 'ethers';
import { 
  MapPin, 
  Plus, 
  Search, 
  Navigation, 
  Coffee, 
  Briefcase, 
  Home, 
  CheckCircle2, 
  Wallet,
  X,
  Info,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NOMAD_MAP_ABI, BASE_SEPOLIA_CONFIG } from './constants';
import { cn } from './lib/utils';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Types ---
declare global {
  interface Window {
    solana: any;
  }
}

interface Location {
  id: number;
  name: string;
  description: string;
  imageIPFS: string;
  lat: number;
  long: number;
  category: string;
  totalCheckIns: number;
  creator: string;
}

// --- Constants ---
const SCALE = 1000000;
const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784]; // Istanbul

// Mock data for demo if no contract is connected
const MOCK_LOCATIONS: Location[] = [
  {
    id: 1,
    name: "Espresso Lab - Karaköy",
    description: "Great coffee and fast wifi. Perfect for deep work sessions.",
    imageIPFS: "https://picsum.photos/seed/coffee/400/300",
    lat: 41.0225,
    long: 28.9748,
    category: "Cafe",
    totalCheckIns: 124,
    creator: "0x123...abc"
  },
  {
    id: 2,
    name: "Impact Hub Istanbul",
    description: "Vibrant co-working space with a strong community of social entrepreneurs.",
    imageIPFS: "https://picsum.photos/seed/cowork/400/300",
    lat: 41.0592,
    long: 28.9921,
    category: "Co-working",
    totalCheckIns: 89,
    creator: "0x456...def"
  },
  {
    id: 3,
    name: "Nomad House - Kadıköy",
    description: "A cozy place for nomads to stay and work together in the heart of Kadıköy.",
    imageIPFS: "https://picsum.photos/seed/house/400/300",
    lat: 40.9918,
    long: 29.0270,
    category: "Nomad-House",
    totalCheckIns: 45,
    creator: "0x789...ghi"
  }
];

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocationSharingActive, setIsLocationSharingActive] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [newLocationCoords, setNewLocationCoords] = useState<[number, number] | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<'metamask' | 'phantom' | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [ncatBalance, setNcatBalance] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Cafe',
    imageIPFS: ''
  });

  const showNotification = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // --- Blockchain Interaction ---
  const switchToBaseSepolia = async () => {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_CONFIG],
          });
        } catch (addError) {
          console.error("Failed to add Base Sepolia", addError);
        }
      }
      console.error("Failed to switch to Base Sepolia", switchError);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        
        // Ensure we are on Base Sepolia
        await switchToBaseSepolia();

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setWalletType('metamask');
        setIsWalletModalOpen(false);
        showNotification("MetaMask connected successfully to Base Sepolia!", "success");
        
        // Replace with your deployed contract address
        const contractAddress: string = "0x9520544D5548E05dfCED8Dd0EFC771538a1E445C"; 
        if (contractAddress !== "0x0000000000000000000000000000000000000000") {
          const signer = await provider.getSigner();
          const nomadContract = new ethers.Contract(contractAddress, NOMAD_MAP_ABI, signer);
          setContract(nomadContract);
          loadLocations(nomadContract);
        }
      } catch (error: any) {
        console.error("MetaMask connection failed", error);
        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
          showNotification("Connection request was cancelled.", "info");
        } else {
          showNotification("Failed to connect MetaMask", "error");
        }
      } finally {
        setIsConnecting(false);
      }
    } else {
      showNotification("Please install MetaMask!", "error");
    }
  };

  const connectPhantom = async () => {
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    if (isPhantomInstalled) {
      try {
        setIsConnecting(true);
        const response = await window.solana.connect();
        setAccount(response.publicKey.toString());
        setWalletType('phantom');
        setIsWalletModalOpen(false);
        showNotification("Phantom connected successfully!", "success");
      } catch (error: any) {
        console.error("Phantom connection failed", error);
        showNotification("Failed to connect Phantom wallet", "error");
      } finally {
        setIsConnecting(false);
      }
    } else {
      showNotification("Please install Phantom wallet!", "error");
      window.open("https://phantom.app/", "_blank");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWalletType(null);
    setContract(null);
    showNotification("Wallet disconnected", "info");
  };

  const loadLocations = async (nomadContract: ethers.Contract) => {
    try {
      const count = await nomadContract.locationCount();
      const loadedLocations: Location[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const loc = await nomadContract.locations(i);
        loadedLocations.push({
          id: Number(loc.id),
          name: loc.name,
          description: loc.description,
          imageIPFS: loc.imageIPFS,
          lat: Number(loc.lat) / SCALE,
          long: Number(loc.long) / SCALE,
          category: loc.category,
          totalCheckIns: Number(loc.totalCheckIns),
          creator: loc.creator
        });
      }
      if (loadedLocations.length > 0) {
        setLocations(loadedLocations);
      }
    } catch (error) {
      console.error("Failed to load locations", error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      showNotification("Please connect your wallet first!", "error");
      return;
    }
    if (!newLocationCoords) {
      showNotification("Please verify your location first!", "error");
      return;
    }

    if (!contract) {
      // For demo purposes, we'll just add it to the local state if no contract
      const newLoc: Location = {
        id: locations.length + 1,
        name: formData.name,
        description: formData.description,
        imageIPFS: formData.imageIPFS || `https://picsum.photos/seed/${formData.name}/400/300`,
        lat: newLocationCoords[0],
        long: newLocationCoords[1],
        category: formData.category,
        totalCheckIns: 0,
        creator: account
      };
      setLocations([...locations, newLoc]);
      setIsAddingLocation(false);
      setNewLocationCoords(null);
      setFormData({ name: '', description: '', category: 'Cafe', imageIPFS: '' });
      showNotification("New spot added (Demo Mode)!", "success");
      return;
    }

    try {
      const tx = await contract.addLocation(
        formData.name,
        formData.description,
        formData.imageIPFS,
        Math.round(newLocationCoords[0] * SCALE),
        Math.round(newLocationCoords[1] * SCALE),
        formData.category
      );
      await tx.wait();
      loadLocations(contract);
      setIsAddingLocation(false);
      setNewLocationCoords(null);
      showNotification("Location added successfully!", "success");
    } catch (error: any) {
      console.error("Failed to add location", error);
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        showNotification("Transaction was cancelled.", "info");
      } else {
        showNotification("Failed to add location to blockchain.", "error");
      }
    }
  };

  const handleCheckIn = async (locationId: number) => {
    if (!account) {
      showNotification("Please connect your wallet first!", "error");
      return;
    }

    if (!isLocationSharingActive || !userCoords) {
      showNotification("Please enable location sharing to check-in.", "info");
      verifyLocation();
      return;
    }

    // Check distance for check-in
    const loc = locations.find(l => l.id === locationId);
    if (loc) {
      const distance = getDistance(userCoords[0], userCoords[1], loc.lat, loc.long);
      if (distance > 0.5) { // 500 meters
        showNotification("You must be within 500 meters of the location to check-in!", "error");
        return;
      }
    }

    if (!contract) {
      // Demo mode
      setLocations(locations.map(loc => 
        loc.id === locationId ? { ...loc, totalCheckIns: loc.totalCheckIns + 1 } : loc
      ));
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(prev => prev ? { ...prev, totalCheckIns: prev.totalCheckIns + 1 } : null);
      }
      setNcatBalance(prev => prev + 10);
      showNotification("Check-in successful! You earned 10 NCAT tokens.", "success");
      return;
    }

    try {
      const tx = await contract.checkIn(locationId);
      await tx.wait();
      loadLocations(contract);
      setNcatBalance(prev => prev + 10);
      showNotification("Check-in successful on-chain! You earned 10 NCAT tokens.", "success");
    } catch (error: any) {
      console.error("Check-in failed", error);
      if (error.code === "ACTION_REJECTED" || error.code === 4001) {
        showNotification("Check-in transaction was cancelled.", "info");
      } else {
        showNotification(`Check-in failed: ${error.message || "Unknown error"}`, "error");
      }
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const simulateLocation = () => {
    // Default to a popular nomad spot (e.g., Canggu, Bali)
    const mockCoords: [number, number] = [-8.6478, 115.1385];
    console.log("Simulating location:", mockCoords);
    setUserCoords(mockCoords);
    setNewLocationCoords(mockCoords);
    setIsLocationSharingActive(true);
    showNotification("Location simulated for testing!", "info");
    
    if (map) {
      map.flyTo(mockCoords, 15);
    }
  };

  const verifyLocation = () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser", "error");
      return;
    }

    console.log("Starting geolocation request...");
    setIsLocating(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation success:", position.coords);
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserCoords(coords);
        setNewLocationCoords(coords);
        setIsLocationSharingActive(true);
        setIsLocating(false);
        showNotification("Location verified!", "success");
        
        if (map) {
          map.flyTo(coords, 15);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Unable to retrieve your location.";
        if (error.code === 1) msg = "Location permission denied. Please allow access or use 'Simulate Location' for testing.";
        else if (error.code === 2) msg = "Location unavailable. Try moving to a more open area or use 'Simulate Location'.";
        else if (error.code === 3) msg = "Location request timed out. Try again or use 'Simulate Location'.";
        
        showNotification(msg, "error");
        setIsLocationSharingActive(false);
        setIsLocating(false);
      },
      options
    );
  };

  const toggleLocationSharing = () => {
    if (isLocationSharingActive) {
      setIsLocationSharingActive(false);
      setUserCoords(null);
      setNewLocationCoords(null);
      showNotification("Location sharing disabled", "info");
    } else {
      verifyLocation();
    }
  };

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    if (map) {
      map.flyTo([loc.lat, loc.long], 15, {
        duration: 1.5
      });
    }
  };

  const openDirections = (loc: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.long}`;
    window.open(url, '_blank');
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesCategory = selectedCategory === 'All' || loc.category === selectedCategory;
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           loc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [locations, selectedCategory, searchQuery]);

  // --- Components ---
  function MapEvents() {
    useMapEvents({
      click(e) {
        if (isAddingLocation) {
          setNewLocationCoords([e.latlng.lat, e.latlng.lng]);
          showNotification("Location selected on map!", "info");
        }
      },
    });
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cafe': return <Coffee className="w-4 h-4" />;
      case 'Co-working': return <Briefcase className="w-4 h-4" />;
      case 'Nomad-House': return <Home className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("flex h-screen w-full bg-slate-50 font-sans text-slate-900", isAddingLocation && "adding-location")}>
      {/* --- Notifications --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
              notification.type === 'error' ? "bg-rose-50 border-rose-100 text-rose-700" :
              notification.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
              "bg-indigo-50 border-indigo-100 text-indigo-700"
            )}
          >
            {notification.type === 'error' ? <X className="w-5 h-5" /> : 
             notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             <Info className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Sidebar --- */}
      <aside className="w-96 h-full bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Globe className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">NomadMap</h1>
          </div>

          <button
            onClick={() => account ? disconnectWallet() : setIsWalletModalOpen(true)}
            disabled={isConnecting}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 mb-2",
              account 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
            )}
          >
            <Wallet className="w-4 h-4" />
            {account ? (
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60 uppercase font-bold">{walletType}</span>
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>

          {account && (
            <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">NC</div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">NCAT Balance</span>
              </div>
              <span className="text-lg font-black text-indigo-600">{ncatBalance}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className={cn("w-4 h-4", isLocationSharingActive ? "text-indigo-600" : "text-slate-400")} />
                <span className="text-sm font-medium text-slate-700">Location Sharing</span>
              </div>
              <button 
                onClick={toggleLocationSharing}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  isLocationSharingActive ? "bg-indigo-600" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isLocationSharingActive ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            {!isLocationSharingActive && (
              <button 
                onClick={simulateLocation}
                className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider hover:underline text-left pl-6"
              >
                Simulate for testing (Bali)
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search locations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'Cafe', 'Co-working', 'Nomad-House'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                  selectedCategory === cat 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
              {selectedCategory === 'All' ? 'Nearby Spots' : `${selectedCategory} Spots`} ({filteredLocations.length})
            </h2>
            {filteredLocations.map(loc => (
              <motion.div
                key={loc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleLocationSelect(loc)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all",
                  selectedLocation?.id === loc.id 
                    ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex gap-3">
                  <img 
                    src={loc.imageIPFS} 
                    alt={loc.name} 
                    className="w-16 h-16 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{loc.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      {getCategoryIcon(loc.category)}
                      <span>{loc.category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{loc.totalCheckIns} check-ins</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setIsAddingLocation(!isAddingLocation)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all shadow-sm",
              isAddingLocation 
                ? "bg-rose-50 text-rose-600 border border-rose-100" 
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            {isAddingLocation ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAddingLocation ? "Cancel Adding" : "Add New Spot"}
          </button>
        </div>
      </aside>

      {/* --- Main Map Area --- */}
      <main className="flex-1 relative z-10">
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={13} 
          className="w-full h-full"
          zoomControl={false}
          ref={setMap}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapEvents />

          {userCoords && (
            <Marker position={userCoords} icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #4f46e5; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {filteredLocations.map(loc => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.long]}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-slate-900">{loc.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{loc.category}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {newLocationCoords && (
            <Marker position={newLocationCoords} icon={L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: iconShadow,
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })} />
          )}
        </MapContainer>

        {/* --- Floating UI --- */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-[1000]">
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/20 flex flex-col gap-2">
            <button 
              onClick={toggleLocationSharing}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              title={isLocationSharingActive ? "Disable Location" : "Enable Location"}
            >
              <Navigation className={cn("w-5 h-5", isLocationSharingActive ? "text-indigo-600" : "text-slate-600", isLocating && "animate-pulse")} />
            </button>
            <div className="h-px bg-slate-200 mx-2" />
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- Add Location Modal --- */}
        <AnimatePresence>
          {isAddingLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-[1001]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add New Nomad Spot</h3>
                <button onClick={() => setIsAddingLocation(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {!newLocationCoords ? (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-3 text-indigo-700">
                    <Navigation className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-medium">To add a new spot, you can verify your physical location or select manually on the map.</p>
                  </div>
                  <button
                    onClick={verifyLocation}
                    disabled={isLocating}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    {isLocating ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    {isLocating ? "Verifying..." : "Verify My Location"}
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400 font-semibold">Or</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                    <p className="text-xs text-slate-500 mb-2 font-medium italic">Click anywhere on the map to select a spot manually</p>
                    <div className="flex items-center justify-center gap-2 text-indigo-600 animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>

                  <button
                    onClick={simulateLocation}
                    className="w-full py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-semibold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    Simulate Location (Bali)
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">Spot Details</label>
                    <button 
                      type="button"
                      onClick={() => setNewLocationCoords(null)}
                      className="text-[10px] text-indigo-600 font-bold uppercase hover:underline"
                    >
                      Change Location
                    </button>
                  </div>
                  <form onSubmit={handleAddLocation} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Name</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Co-working Space X"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                        placeholder="Tell us about this place..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                        <select 
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option>Cafe</option>
                          <option>Co-working</option>
                          <option>Nomad-House</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Image URL (Optional)</label>
                        <input 
                          value={formData.imageIPFS}
                          onChange={e => setFormData({...formData, imageIPFS: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="IPFS or HTTP link"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                    >
                      Confirm & Add to Map
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Location Detail Panel --- */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-[1002] flex flex-col"
            >
              <div className="relative h-64">
                <img 
                  src={selectedLocation.imageIPFS} 
                  alt={selectedLocation.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-full text-xs font-bold shadow-sm">
                    {selectedLocation.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-900">{selectedLocation.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedLocation.lat.toFixed(4)}, {selectedLocation.long.toFixed(4)}</span>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">About</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedLocation.description}
                  </p>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Total Check-ins</p>
                      <p className="text-2xl font-bold text-indigo-600">{selectedLocation.totalCheckIns}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Creator</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-6 h-6 bg-slate-200 rounded-full" />
                    <span className="font-mono">{selectedLocation.creator.slice(0, 10)}...</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 space-y-3">
                <button
                  onClick={() => openDirections(selectedLocation)}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </button>
                <button
                  onClick={() => handleCheckIn(selectedLocation.id)}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Check-in On-Chain
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-1">
                  Check-ins are recorded on the blockchain and provide proof of presence.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Wallet Selection Modal --- */}
      <AnimatePresence>
        {isWalletModalOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWalletModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Connect Wallet</h3>
                <button onClick={() => setIsWalletModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={connectMetaMask}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Logo.svg" alt="MetaMask" className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">MetaMask</div>
                    <div className="text-xs text-slate-500">Connect to Ethereum / EVM</div>
                  </div>
                </button>

                <button
                  onClick={connectPhantom}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <img src="https://phantom.app/img/phantom-logo.svg" alt="Phantom" className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Phantom</div>
                    <div className="text-xs text-slate-500">Connect to Solana</div>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                By connecting, you agree to our Terms of Service.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
