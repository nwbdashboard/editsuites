import React, { useState, useEffect } from 'react';

const EditSuites = () => {
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekDays, setWeekDays] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Theme colors
  const colors = {
    darker: {
      bg: '#171e29',
      header: '#13171f',
      item: '#232b38',
      altItem: '#1d242f',
      accent: '#4b5563'
    },
    background: '#111827'
  };

  // Mount effect - fix hydration
  useEffect(() => {
    setSelectedDate(new Date());
    setMounted(true);
  }, []);

  // Generate weekdays for current week
  const generateWeekDays = () => {
    if (!selectedDate) return [];
    
    const today = new Date();
    const currentDay = today.getDay();
    
    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    const days = [];
    const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];
    
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      
      const isToday = day.toDateString() === today.toDateString();
      const isSelected = day.toDateString() === selectedDate.toDateString();
      
      days.push({
        day: dayNames[i],
        date: day.getDate().toString().padStart(2, '0') + ' ' + 
              day.toLocaleDateString('nl-NL', { month: 'short' }),
        fullDate: day,
        selected: isSelected,
        isToday: isToday
      });
    }
    
    return days;
  };

  // Update week days when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setWeekDays(generateWeekDays());
    }
  }, [selectedDate]);

  // Fetch suites data from API
  const fetchSuites = async (date = selectedDate) => {
    if (!date) return;
    
    try {
      setLoading(true);
      const dateParam = date.toISOString().split('T')[0];
      const response = await fetch(`/api/suites?date=${dateParam}`);
      const data = await response.json();
      
      if (data.success) {
        setSuites(data.suites);
        setLastUpdate(data.lastUpdate);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching suites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDate(day.fullDate);
    fetchSuites(day.fullDate);
  };

  // Load data on component mount
  useEffect(() => {
    if (selectedDate) {
      fetchSuites();
      const interval = setInterval(() => fetchSuites(), 30000);
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  // Mobile responsive
  const [width, setWidth] = useState(1200);
  const isMobile = width < 768;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth);
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Don't render until mounted
  if (!mounted || !selectedDate) {
    return (
      <div style={{
        backgroundColor: colors.background,
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.background,
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Edit Suites Planning
          </h1>
          <p style={{
            color: '#9ca3af',
            fontSize: '1rem',
            marginBottom: '0.5rem'
          }}>
            {selectedDate.toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          {lastUpdate && (
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              Laatste update: {new Date(lastUpdate).toLocaleTimeString('nl-NL')}
            </p>
          )}
          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '0.5rem',
              borderRadius: '0.375rem'
            }}>
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Main Container */}
        <div style={{
          backgroundColor: colors.darker.bg,
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #232b38',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.darker.header,
          }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              Edit Suites
            </h2>
            <button
              onClick={() => fetchSuites()}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(107, 114, 128, 0.4)',
                color: '#d1d5db',
                border: 'none',
                padding: '0.2rem 0.4rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? '⟳' : '↻'} Ververs
            </button>
          </div>

          <div style={{ padding: '1rem' }}>
            {/* Days Selector */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {weekDays.map((day, index) => {
                if (isMobile && index > 2) return null;

                return (
                  <button
                    key={index}
                    onClick={() => handleDaySelect(day)}
                    style={{
                      padding: '0.4rem 0.2rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      width: '100%',
                      backgroundColor: day.selected ? '#1e40af' : (index % 2 === 0 ? colors.darker.item : colors.darker.altItem),
                      borderRadius: '0.25rem',
                      border: '2px solid',
                      borderColor: day.isToday ? '#10b981' : (day.selected ? '#1e40af' : '#4b5563'),
                      height: '3rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      position: 'relative'
                    }}
                  >
                    {day.isToday && (
                      <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%'
                      }}></div>
                    )}
                    <div style={{
                      color: day.selected ? 'white' : '#d1d5db',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      width: '90%'
                    }}>
                      {day.day}
                    </div>
                    <div style={{
                      color: day.selected ? '#bfdbfe' : '#9ca3af',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      width: '90%'
                    }}>
                      {day.date}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⟳</div>
                Gegevens laden...
              </div>
            )}

            {/* Suites List */}
            {!loading && (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {suites.map((suite, index) => (
                  <div key={index} style={{
                    backgroundColor: index % 2 === 0 ? colors.darker.item : colors.darker.altItem,
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '0.875rem'
                        }}>
                          {suite.name}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            {suite.status === 'Vrij' ? 'Beschikbaar' : suite.editor}
                          </span>
                          <button style={{
                            backgroundColor: index % 2 === 0 ? colors.darker.altItem : colors.darker.item,
                            color: '#d1d5db',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.125rem 0.375rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}>
                            {suite.status === 'Vrij' ? 'Reserveren' : 'Bewerken'}
                          </button>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            {suite.project || 'Geen project'}
                          </span>
                        </div>
                        {suite.status === 'Bezet' && suite.progress > 0 && (
                          <div style={{
                            width: '4rem',
                            height: '0.25rem',
                            backgroundColor: index % 2 === 0 ? colors.darker.altItem : colors.darker.item,
                            borderRadius: '9999px',
                            marginLeft: 'auto',
                            marginTop: '0.25rem',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${suite.progress}%`,
                              backgroundColor: '#6b7280'
                            }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSuites;
