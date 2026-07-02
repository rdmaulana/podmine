import { useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Home, 
  Search, 
  PlusCircle, 
  LogIn, 
  LogOut, 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  X, 
  Radio, 
  Music
} from 'lucide-react';
import { api, tokenStorage } from './infrastructure/api';
import { 
  usePodcasts, 
  useGeneratePodcast, 
  useLogin, 
  useRegister 
} from './infrastructure/hooks';
import type { Podcast } from './domain/podcast';

import './presentation/styles/index.css';
import './presentation/styles/app.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function PodmineApp() {
  // UI State
  const [currentUser, setCurrentUser] = useState(tokenStorage.getUser());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'my-podcasts'>('home');
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // Audio Player State
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Queries & Mutations
  const { data: podcastData, isLoading } = usePodcasts(search, 1);
  const generateMutation = useGeneratePodcast();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Handlers
  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const mutation = authMode === 'login' ? loginMutation : registerMutation;
    mutation.mutate({ username, password }, {
      onSuccess: (user) => {
        setCurrentUser(user);
        setShowAuthModal(false);
      },
    });
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prompt = formData.get('prompt') as string;

    generateMutation.mutate(prompt, {
      onSuccess: () => {
        setShowGenerateModal(false);
      },
    });
  };

  const playPodcast = (podcast: Podcast) => {
    if (podcast.status !== 'COMPLETED') return;
    
    // Set current podcast
    setCurrentPodcast(podcast);
    setIsPlaying(true);
    
    // The browser audio element is controlled by binding src and loading it
    if (audioRef.current) {
      audioRef.current.src = api.getStreamUrl(podcast.id);
      audioRef.current.load();
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentPodcast) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Derived state (no useEffect needed)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Filter list by tab
  const podcasts = (podcastData?.data || []).filter(p => {
    if (activeTab === 'my-podcasts') {
      return p.userId === currentUser?.userId;
    }
    return true;
  });

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <Radio size={28} />
          <span>PODMINE</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
          <ul className="nav-links">
            <li>
              <div 
                className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                <Home size={20} />
                <span>Umpan Publik</span>
              </div>
            </li>
            {currentUser && (
              <li>
                <div 
                  className={`nav-item ${activeTab === 'my-podcasts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('my-podcasts')}
                >
                  <Music size={20} />
                  <span>Podcast Saya</span>
                </div>
              </li>
            )}
            <li>
              <div 
                className="nav-item"
                onClick={() => {
                  if (!currentUser) {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  } else {
                    setShowGenerateModal(true);
                  }
                }}
              >
                <PlusCircle size={20} />
                <span>Buat Baru</span>
              </div>
            </li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            {currentUser ? (
              <div className="nav-item" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Keluar ({currentUser.username})</span>
              </div>
            ) : (
              <div className="nav-item active" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                <LogIn size={20} />
                <span>Masuk / Daftar</span>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <Search size={18} color="#b3b3b3" />
            <input 
              type="text" 
              placeholder="Cari podcast berdasarkan judul..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="user-profile">
            {currentUser ? (
              <button className="btn" onClick={() => setShowGenerateModal(true)}>
                <PlusCircle size={18} />
                <span>Buat Podcast</span>
              </button>
            ) : (
              <button className="btn" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                <span>Mulai Buat Podcast</span>
              </button>
            )}
          </div>
        </header>

        <h2 className="dashboard-title">
          {activeTab === 'my-podcasts' ? 'Podcast Saya' : 'Umpan Publik'}
        </h2>

        {isLoading ? (
          <div className="empty-view">
            <p>Memuat podcast...</p>
          </div>
        ) : podcasts.length === 0 ? (
          <div className="empty-view">
            <p>Belum ada podcast yang dibuat.</p>
            {activeTab === 'my-podcasts' && (
              <button className="btn" onClick={() => setShowGenerateModal(true)}>
                Mulai Buat Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="podcast-grid">
            {podcasts.map((podcast) => (
              <div 
                key={podcast.id} 
                className="podcast-card"
                onClick={() => playPodcast(podcast)}
              >
                <div className="card-img-container">
                  <Radio size={48} />
                  {podcast.status === 'COMPLETED' && (
                    <button className="play-hover-btn">
                      <Play size={20} fill="#fff" />
                    </button>
                  )}
                </div>
                <div className="card-info">
                  <span className="card-title">{podcast.title || 'Tanpa Judul'}</span>
                  <span className="card-meta" title={podcast.prompt}>{podcast.prompt}</span>
                  
                  {/* Status Badge & Progress */}
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className={`status-badge status-${podcast.status.toLowerCase()}`}>
                      {podcast.status}
                    </span>
                    {podcast.status === 'PROCESSING' && podcast.jobs?.[0] && (
                      <div style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${podcast.jobs[0].progress}%`, backgroundColor: 'var(--primary)' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Persistent bottom Audio Player */}
      <footer className="bottom-player">
        <div className="player-info">
          <div className="player-thumbnail">
            <Music size={24} />
          </div>
          <div className="player-metadata">
            <span className="player-title">{currentPodcast?.title || 'Tidak ada judul'}</span>
            <span className="player-artist">{currentPodcast ? 'AI Host A & Host B' : '-'}</span>
          </div>
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button className="control-btn play-pause-btn" onClick={togglePlay} disabled={!currentPodcast}>
              {isPlaying ? <Pause size={18} fill="#000" color="#000" /> : <Play size={18} fill="#000" color="#000" style={{ marginLeft: '2px' }} />}
            </button>
          </div>
          <div className="progress-container">
            <span className="progress-time">{formatTime(currentTime)}</span>
            <div className="progress-bar" onClick={handleSeek}>
              <div 
                className="progress-filled" 
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="progress-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-extra">
          {currentPodcast?.audioUrl && (
            <a 
              href={currentPodcast.audioUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="control-btn"
              title="Unduh Berkas Audio"
            >
              <Download size={20} />
            </a>
          )}
          <div className="volume-container">
            <Volume2 size={18} color="#b3b3b3" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume} 
              onChange={handleVolumeChange}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        {/* Hidden native HTML5 audio element */}
        <audio 
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onEnded={() => setIsPlaying(false)}
        />
      </footer>

      {/* Auth Modal (Login / Register) */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3 className="modal-title">{authMode === 'login' ? 'Masuk' : 'Daftar Akun'}</h3>
              <button className="control-btn" onClick={() => setShowAuthModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" required placeholder="Masukkan username..." />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="Masukkan password..." />
              </div>
              
              {(loginMutation.isError || registerMutation.isError) && (
                <span className="error-message">
                  {loginMutation.error?.message || registerMutation.error?.message}
                </span>
              )}

              <button className="btn" type="submit" disabled={loginMutation.isPending || registerMutation.isPending}>
                {authMode === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {authMode === 'login' ? (
                <span>Belum punya akun? <a href="#" style={{ color: 'var(--primary)' }} onClick={(e) => { e.preventDefault(); setAuthMode('register'); }}>Daftar di sini</a></span>
              ) : (
                <span>Sudah punya akun? <a href="#" style={{ color: 'var(--primary)' }} onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}>Masuk di sini</a></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Podcast Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3 className="modal-title">Buat Podcast AI Baru</h3>
              <button className="control-btn" onClick={() => setShowGenerateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="prompt">Topik atau Prompt Podcast</label>
                <textarea 
                  id="prompt" 
                  name="prompt" 
                  required 
                  placeholder="Contoh: Diskusi seru tentang masa depan AI di Indonesia..." 
                />
              </div>

              {generateMutation.isError && (
                <span className="error-message">
                  {generateMutation.error?.message}
                </span>
              )}

              <div className="modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setShowGenerateModal(false)}>
                  Batal
                </button>
                <button className="btn" type="submit" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? 'Mengantrekan...' : 'Mulai Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PodmineApp />
    </QueryClientProvider>
  );
}
