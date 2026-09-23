import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../../components/ui/badge';

describe('Badge component', () => {
  it('renders content correctly', () => {
    render(<Badge>BULLISH</Badge>);
    expect(screen.getByText('BULLISH')).toBeInTheDocument();
  });

  it('renders with variants', () => {
    const { rerender } = render(<Badge variant="emerald">PROFIT</Badge>);
    expect(screen.getByText('PROFIT')).toBeInTheDocument();

    rerender(<Badge variant="destructive">BEARISH</Badge>);
    expect(screen.getByText('BEARISH')).toBeInTheDocument();

    rerender(<Badge variant="amber">CAUTION</Badge>);
    expect(screen.getByText('CAUTION')).toBeInTheDocument();
  });
});
