import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import asteroidService from '../services/asteroidService';
import authService from '../services/authService';
import {
    LogOut,
    RefreshCw,
    AlertTriangle,
    Heart,
    Orbit,
    Info,
    ChevronRight,
    Search,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';


const Dashboard = () => {
    const [asteroids, setAsteroids] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState('all'); // 'all' or 'watchlist'
    const [wishlist, setWishlist] = useState([]);
    const [selectedAsteroid, setSelectedAsteroid] = useState(null);
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [data, alertData, wishlistData] = await Promise.all([
                asteroidService.getAsteroids(),
                asteroidService.getAlerts(),
                asteroidService.getWishlist()
            ]);
            setAsteroids(data);
            setAlerts(alertData);
            setWishlist(wishlistData || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load orbital data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        const toastId = toast.loading('Synchronizing with NASA...');
        try {
            await asteroidService.fetchFreshData();
            await loadData();
            toast.success('System synchronized', { id: toastId });

            // Notification for hazardous asteroids
            const hazards = asteroids.filter(a => a.hazardous || a.is_potentially_hazardous_asteroid);
            if (hazards.length > 0) {
                toast(`Warning: ${hazards.length} hazardous objects detected!`, {
                    icon: '⚠️',
                    duration: 5000,
                });
            }
        } catch (err) {
            console.error(err);
            toast.error('Synchronization failed', { id: toastId });
        } finally {
            setRefreshing(false);
        }
    };

    const toggleWishlist = async (e, asteroid) => {
        e.stopPropagation();
        const id = asteroid.id || asteroid.neo_reference_id;
        const isWishlisted = wishlist.some(w => w.id === id);

        try {
            if (isWishlisted) {
                await asteroidService.removeFromWishlist(id);
                setWishlist(prev => prev.filter(w => w.id !== id));
                toast.success(`${asteroid.name} removed from watchlist`);
            } else {
                await asteroidService.addToWishlist(asteroid);
                // Ensure the local state addition also uses the new unified properties
                const newWishlistItem = {
                    ...asteroid,
                    id,
                    diameter_m: asteroid.diameter_m || asteroid.estimated_diameter?.meters?.estimated_diameter_max,
                    closest_approach_km: asteroid.closest_approach_km || asteroid.close_approach_data?.[0]?.miss_distance?.kilometers,
                    closest_approach_date: asteroid.closest_approach_date || asteroid.close_approach_data?.[0]?.close_approach_date,
                    nasa_jpl_url: asteroid.nasa_jpl_url || asteroid.nasaUrl
                };
                setWishlist(prev => [...prev, newWishlistItem]);
                toast.success(`${asteroid.name} added to watchlist`);
            }
        } catch (err) {
            console.error('Watchlist error:', err);
            toast.error('Failed to update watchlist');
        }
    };

    const handleDetails = (asteroid) => {
        const url = asteroid.nasa_jpl_url || asteroid.nasaUrl;
        if (url) {
            window.open(url, '_blank');
        } else {
            toast.error('NASA data link unavailable');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const filteredAsteroids = (viewMode === 'all' ? asteroids : wishlist).filter(a =>
        (a.name || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="min-h-screen p-6 md:p-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-2xl">
                            <Orbit className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold">Cosmic Watch</h1>
                            <p className="text-text-muted">Welcome back, Explorer</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setViewMode(viewMode === 'all' ? 'watchlist' : 'all')}
                        className={`btn ${viewMode === 'watchlist' ? 'btn-secondary' : 'btn-ghost'} flex items-center gap-2`}
                    >
                        <Heart className={`w-5 h-5 ${viewMode === 'watchlist' ? 'fill-current' : ''}`} />
                        <span className="hidden sm:inline">{viewMode === 'all' ? 'Watchlist' : 'Show All'}</span>
                    </button>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Find asteroid..."
                            className="input-control pl-10"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={`btn btn-ghost ${refreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-2xl font-bold">
                                {viewMode === 'all' ? 'Asteroid Feed' : 'My Watchlist'}
                            </h2>
                            <span className="text-sm text-text-muted">{filteredAsteroids.length} objects detected</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence>
                                {filteredAsteroids.map((a, idx) => (
                                    <motion.div
                                        key={a.id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="glass card group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-accent">{a.name}</h3>
                                            <div className="flex gap-2 items-center">
                                                {a.riskLevel && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${a.riskLevel === 'High' ? 'bg-secondary/30 text-secondary border border-secondary/50' :
                                                        a.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                                                            'bg-green-500/20 text-green-500 border border-green-500/50'
                                                        }`}>
                                                        {a.riskLevel} Risk
                                                    </span>
                                                )}
                                                {a.hazardous && (
                                                    <div className="p-1.5 bg-secondary/20 rounded-lg">
                                                        <AlertTriangle className="w-4 h-4 text-secondary" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 text-sm text-text-muted">
                                            <div className="flex justify-between">
                                                <span>Diameter:</span>
                                                <span className="text-text">
                                                    {(a.diameter_m || a.estimated_diameter?.meters?.estimated_diameter_max)?.toFixed(2)} m
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Miss Distance:</span>
                                                <span className="text-text">
                                                    {(a.closest_approach_km || a.close_approach_data?.[0]?.miss_distance?.kilometers)?.toLocaleString()} km
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Approach Date:</span>
                                                <span className="text-text">
                                                    {a.closest_approach_date || a.close_approach_data?.[0]?.close_approach_date}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-glass-border flex justify-between items-center">
                                            <button
                                                onClick={() => handleDetails(a)}
                                                className="text-primary flex items-center gap-2 hover:gap-3 transition-all text-sm font-semibold"
                                            >
                                                Details <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => toggleWishlist(e, a)}
                                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                <Heart
                                                    className={`w-5 h-5 transition-colors ${wishlist.some(w => w.id === (a.id || a.neo_reference_id))
                                                        ? 'text-secondary fill-secondary'
                                                        : 'text-text-muted hover:text-secondary'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <section className="glass p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="w-6 h-6 text-secondary" />
                            <h2 className="text-xl font-bold text-secondary">Close Approaches</h2>
                        </div>

                        <div className="space-y-4">
                            {alerts.length > 0 ? alerts.map((alert, idx) => (
                                <div key={idx} className="bg-secondary/10 border-l-4 border-secondary p-4 rounded-r-xl">
                                    <h4 className="font-bold mb-1">{alert.name}</h4>
                                    <p className="text-xs text-text-muted">
                                        Approaching on {alert.closest_approach_date} at
                                        <span className="text-secondary font-bold"> {alert.closest_approach_km?.toLocaleString()} km</span>
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-text-muted border-2 border-dashed border-glass-border rounded-xl">
                                    No immediate threats detected
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="glass p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-bold text-primary">Space News</h2>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                            NASA's Deep Space Network is currently tracking {asteroids.length} potential near-earth objects.
                            The next major close approach is expected in the coming 48 hours.
                        </p>
                    </section>
                </div>
            </main>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedAsteroid && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedAsteroid(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass max-w-2xl w-full p-8 relative overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedAsteroid(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-primary/20 rounded-2xl">
                                    <Orbit className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">{selectedAsteroid.name}</h2>
                                    <p className="text-text-muted">Object ID: {selectedAsteroid.id || selectedAsteroid.neo_reference_id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <h4 className="text-lg font-semibold border-b border-glass-border pb-2">Physical Params</h4>
                                    <ul className="space-y-4">
                                        <li className="flex justify-between">
                                            <span className="text-text-muted">Est. Diameter:</span>
                                            <span>{(selectedAsteroid.diameter_m || selectedAsteroid.estimated_diameter?.meters?.estimated_diameter_max)?.toFixed(2)} meters</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-text-muted">Potentially Hazardous:</span>
                                            <span className={selectedAsteroid.hazardous ? 'text-secondary' : 'text-green-400'}>
                                                {selectedAsteroid.hazardous ? 'Yes' : 'No'}
                                            </span>
                                        </li>
                                    </ul>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-lg font-semibold border-b border-glass-border pb-2">Orbital Dynamics</h4>
                                    <ul className="space-y-4">
                                        <li className="flex justify-between">
                                            <span className="text-text-muted">Miss Distance:</span>
                                            <span>{(selectedAsteroid.closest_approach_km || selectedAsteroid.close_approach_data?.[0]?.miss_distance?.kilometers)?.toLocaleString()} km</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-text-muted">Relative Velocity:</span>
                                            <span>{selectedAsteroid.relative_velocity_kph || selectedAsteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour || 'N/A'} km/h</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-text-muted">Next Approach:</span>
                                            <span>{selectedAsteroid.closest_approach_date || selectedAsteroid.close_approach_data?.[0]?.close_approach_date}</span>
                                        </li>
                                    </ul>
                                </section>
                            </div>

                            <div className="mt-8 flex flex-wrap justify-end gap-4">
                                {(selectedAsteroid.nasaUrl || selectedAsteroid.nasa_jpl_url) && (
                                    <a
                                        href={selectedAsteroid.nasaUrl || selectedAsteroid.nasa_jpl_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost border border-glass-border flex items-center gap-2"
                                    >
                                        NASA JPL Page
                                    </a>
                                )}
                                <button
                                    onClick={(e) => toggleWishlist(e, selectedAsteroid)}
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <Heart className={wishlist.some(w => w.id === (selectedAsteroid.id || selectedAsteroid.neo_reference_id)) ? 'fill-current' : ''} />
                                    {wishlist.some(w => w.id === (selectedAsteroid.id || selectedAsteroid.neo_reference_id)) ? 'In Watchlist' : 'Add to Watchlist'}
                                </button>
                                <button
                                    onClick={() => setSelectedAsteroid(null)}
                                    className="btn btn-primary"
                                >
                                    Close Monitor
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
