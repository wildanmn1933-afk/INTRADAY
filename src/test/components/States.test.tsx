import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorState } from '../../components/shared/ErrorState';
import { LoadingState } from '../../components/shared/LoadingState';

describe('Shared State Components', () => {
  describe('EmptyState', () => {
    it('renders title, description and triggers action', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Tidak ada data"
          description="Silakan coba filter lain"
          action={{
            label: 'Reset Filter',
            onClick: handleAction,
          }}
        />
      );

      expect(screen.getByText('Tidak ada data')).toBeInTheDocument();
      expect(screen.getByText('Silakan coba filter lain')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: /reset filter/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState', () => {
    it('renders error message and retry button', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Gagal Memuat Data"
          message="Koneksi server terputus"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText('Gagal Memuat Data')).toBeInTheDocument();
      expect(screen.getByText('Koneksi server terputus')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /coba lagi/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoadingState', () => {
    it('renders cards variant with custom message', () => {
      render(<LoadingState variant="cards" count={3} message="Memuat instrumen..." />);
      expect(screen.getByText('Memuat instrumen...')).toBeInTheDocument();
    });

    it('renders table variant', () => {
      render(<LoadingState variant="table" count={5} />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});
