// pages/trigger.tsx
import React, { useState, useEffect, JSX, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Image from 'next/image';

interface Vault {
  id: number;
  cid: string;
  name: string;
  triggerDate: string | null;
}

// --- Advanced Calendar Component ---
const Calendar = ({ selectedDate, onDateSelect, closeCalendar }: { selectedDate: Date, onDateSelect: (date: Date) => void, closeCalendar: () => void }) => {
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [displayDate, setDisplayDate] = useState(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        closeCalendar();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeCalendar]);

  const changeMonth = (offset: number) => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + offset, 1));
  };
  
  const changeYear = (offset: number) => {
    setDisplayDate(new Date(displayDate.getFullYear() + offset, displayDate.getMonth(), 1));
  };

  const changeDecade = (offset: number) => {
    setDisplayDate(new Date(displayDate.getFullYear() + (offset * 10), displayDate.getMonth(), 1));
  };

  const renderDaysView = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDayIndex }, (_, i) => <div key={`empty-${i}`} className="calendarDay empty"></div>);
    
    return (
      <>
        <div className="calendarHeader">
          <button onClick={() => changeMonth(-1)}>&lt;</button>
          <button className="headerTitle" onClick={() => setView('months')}>
            {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </button>
          <button onClick={() => changeMonth(1)}>&gt;</button>
        </div>
        <div className="calendarGrid">
          <div className="dayName">Su</div><div className="dayName">Mo</div><div className="dayName">Tu</div><div className="dayName">We</div><div className="dayName">Th</div><div className="dayName">Fr</div><div className="dayName">Sa</div>
          {emptyDays}
          {days.map(day => {
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
            return <div key={day} className={`calendarDay ${isSelected ? 'selected' : ''}`} onClick={() => onDateSelect(new Date(year, month, day))}>{day}</div>
          })}
        </div>
      </>
    );
  };
  
  const renderMonthsView = () => {
    const year = displayDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'short' }));
    return (
      <>
        <div className="calendarHeader">
          <button onClick={() => changeYear(-1)}>&lt;</button>
          <button className="headerTitle" onClick={() => setView('years')}>{year}</button>
          <button onClick={() => changeYear(1)}>&gt;</button>
        </div>
        <div className="calendarGrid monthYearGrid">
          {months.map((month, index) => (
            <div key={month} className="gridItem" onClick={() => { setDisplayDate(new Date(year, index, 1)); setView('days'); }}>
              {month}
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderYearsView = () => {
    const startYear = Math.floor(displayDate.getFullYear() / 10) * 10;
    const years = Array.from({ length: 10 }, (_, i) => startYear + i);
    return (
      <>
        <div className="calendarHeader">
          <button onClick={() => changeDecade(-1)}>&lt;</button>
          <span className="headerTitle">{`${startYear} - ${startYear + 9}`}</span>
          <button onClick={() => changeDecade(1)}>&gt;</button>
        </div>
        <div className="calendarGrid monthYearGrid">
          {years.map(year => (
            <div key={year} className="gridItem" onClick={() => { setDisplayDate(new Date(year, 0, 1)); setView('months'); }}>
              {year}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="calendarContainer" ref={calendarRef}>
      {view === 'days' && renderDaysView()}
      {view === 'months' && renderMonthsView()}
      {view === 'years' && renderYearsView()}
    </div>
  );
};

export default function TriggerPage(): JSX.Element {
  const { status } = useSession({ required: true, onUnauthenticated() { router.push('/login') } });
  const router = useRouter();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchVaults = async () => {
        setIsLoading(true);
        try {
          const res = await axios.get('/api/vaults');
          setVaults(res.data);
        } catch (err) { setError('Failed to fetch vaults.'); } 
        finally { setIsLoading(false); }
      };
      fetchVaults();
    }
  }, [status, router]);

  const handleSetTrigger = async () => {
    if (!selectedVault || !date) {
      setError('Please select a vault and a date.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/api/vaults/set-trigger', { vaultId: selectedVault.id, triggerDate: date });
      setMessage(`Trigger for "${selectedVault.name}" set to ${new Date(date).toLocaleDateString('en-CA')}.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set trigger.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (newDate: Date) => {
    setDate(newDate.toISOString().split('T')[0]);
    setIsCalendarOpen(false);
  };

  const cssStyles = `
    html, body { margin: 0; padding: 0; box-sizing: border-box; }
    .pageContainer { min-height: 100vh; width: 100%; background: linear-gradient(to bottom right, #0f172a, #000000, #3b0764); padding: 2rem 1rem; font-family: 'Inter', sans-serif; }
    .header {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem 0;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }
    .header-title-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .siteTitle {
      font-size: 3.25rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(90deg, #a78bfa, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    .backButton {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: 1px solid #475569;
      color: #94a3b8;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    .backButton:hover { background-color: #475569; color: white; }
    .card { width: 100%; max-width: 500px; margin: 2rem auto 0; background-color: rgba(17, 24, 39, 0.5); backdrop-filter: blur(10px); border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 2.5rem; border: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 1.5rem; }
    .title { font-size: 1.875rem; font-weight: 700; color: white; margin: 0; text-align: center; }
    .formGroup { display: flex; flex-direction: column; gap: 0.5rem; }
    .label { color: #94a3b8; font-size: 0.875rem; font-weight: 500; }
    .actionButton { width: 100%; padding: 0.85rem 0; background: linear-gradient(to right, #7c3aed, #a855f7); color: white; font-weight: 600; border-radius: 0.5rem; border: none; cursor: pointer; transition: all 0.2s ease; }
    .actionButton:hover { box-shadow: 0 0 15px rgba(168, 85, 247, 0.5); transform: translateY(-2px); }
    .actionButton:disabled { background: #374151; cursor: not-allowed; transform: none; box-shadow: none; }
    .errorMessage { text-align: center; color: #f87171; }
    .successMessage { text-align: center; color: #6ee7b7; }
    .customDropdown, .dateInputContainer { position: relative; }
    .dropdownButton { width: 100%; padding: 0.75rem 1rem; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; color: white; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; }
    .dropdownButton:focus, .dropdownButton.open { outline: none; box-shadow: 0 0 0 2px #a855f7; border-color: #a855f7; }
    .dropdownMenu { position: absolute; top: 100%; left: 0; right: 0; background-color: #1f2937; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; margin-top: 0.5rem; z-index: 10; max-height: 200px; overflow-y: auto; }
    .dropdownItem { padding: 0.75rem 1rem; color: #d1d5db; cursor: pointer; }
    .dropdownItem:hover { background-color: #374151; color: white; }
    .calendarContainer { position: absolute; width: 100%; box-sizing: border-box; top: 100%; left: 0; right: 0; background-color: #1f2937; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.5rem; margin-top: 0.5rem; z-index: 10; padding: 1rem; }
    .calendarHeader { display: flex; justify-content: space-between; align-items: center; color: white; font-weight: 600; margin-bottom: 1rem; }
    .calendarHeader button { background: none; border: none; color: #a855f7; font-size: 1.5rem; cursor: pointer; padding: 0 0.5rem; }
    .calendarHeader .headerTitle { font-size: 1rem; color: white; background: none; border: none; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 0.25rem; transition: background-color 0.2s; }
    .calendarHeader .headerTitle:hover { background-color: #374151; }
    .calendarGrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center; }
    .dayName { color: #94a3b8; font-size: 0.75rem; }
    .calendarDay { color: #d1d5db; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: background-color 0.2s; }
    .calendarDay:not(.empty):hover { background-color: #374151; }
    .calendarDay.selected { background-color: #a855f7; color: white; font-weight: bold; }
    .calendarDay.empty { cursor: default; }
    .monthYearGrid { grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .gridItem { padding: 1rem 0.5rem; color: #d1d5db; cursor: pointer; border-radius: 0.5rem; transition: background-color 0.2s; }
    .gridItem:hover { background-color: #374151; }
  `;

  return (
    <>
      <Head>
        <title>Set Trigger Date</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </Head>
      <div className="pageContainer">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <header className="header">
          <div className="header-title-container">
            <Image src="/Logo.png" alt="Digital Afterlife Logo" width={150} height={150} />
            <h1 className="siteTitle">Digital Afterlife</h1>
          </div>
          <button className="backButton" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </header>
        <div className="card">
          <h1 className="title">Set a Trigger Date</h1>
          <div className="formGroup">
            <label className="label">Select a Vault</label>
            <div className="customDropdown">
              <button className={`dropdownButton ${isDropdownOpen ? 'open' : ''}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span>{selectedVault ? selectedVault.name : '-- Choose a vault --'}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {isDropdownOpen && (
                <div className="dropdownMenu">
                  {vaults.map(vault => (
                    <div key={vault.id} className="dropdownItem" onClick={() => { setSelectedVault(vault); setIsDropdownOpen(false); }}>
                      {vault.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="formGroup">
            <label className="label">Select Delivery Date</label>
            <div className="dateInputContainer">
              <button className="dropdownButton" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                <span>{new Date(date).toLocaleDateString('en-CA')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </button>
              {isCalendarOpen && <Calendar selectedDate={new Date(date)} onDateSelect={handleDateSelect} closeCalendar={() => setIsCalendarOpen(false)} />}
            </div>
          </div>
          <button className="actionButton" onClick={handleSetTrigger} disabled={isLoading}>
            {isLoading ? 'Setting Trigger...' : 'Set Trigger'}
          </button>
          {error && <p className="errorMessage">{error}</p>}
          {message && <p className="successMessage">{message}</p>}
        </div>
      </div>
    </>
  );
}

