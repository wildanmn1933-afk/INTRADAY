import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../../components/Header';

describe('Header component', () => {
  it('renders search input with current search query', () => {
    const handleSearchChange = vi.fn();
    render(
      <Header
        activeTab="terminal"
        setActiveTab={vi.fn()}
        sseStatus="CONNECTED"
        sessions={[]}
        onTriggerGlobalSync={vi.fn()}
        isSyncing={false}
        onToggleMobileMenu={vi.fn()}
        searchQuery="CPI"
        onSearchChange={handleSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search instruments, news/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('CPI');

    fireEvent.change(searchInput, { target: { value: 'NFP' } });
    expect(handleSearchChange).toHaveBeenCalledWith('NFP');
  });

  it('triggers global sync on button click', () => {
    const handleSync = vi.fn();
    render(
      <Header
        activeTab="terminal"
        setActiveTab={vi.fn()}
        sseStatus="CONNECTED"
        sessions={[]}
        onTriggerGlobalSync={handleSync}
        isSyncing={false}
        onToggleMobileMenu={vi.fn()}
      />
    );

    const syncBtn = screen.getByRole('button', { name: /sync/i });
    expect(syncBtn).toBeInTheDocument();
    fireEvent.click(syncBtn);
    expect(handleSync).toHaveBeenCalledTimes(1);
  });
});
