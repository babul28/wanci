import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimestampSection } from '../../src/components/TimestampSection';
import { StyleSection } from '../../src/components/StyleSection';
import { Inspector } from '../../src/components/Inspector';
import { defaultMetadata } from '../../src/utils/metadata';

const NOTE = 'No capture time in photo. Using current time.';
const capturedAt = '2026-11-04T14:32:08';
const noExif = defaultMetadata(undefined, new Date(2026, 10, 5, 9, 0, 0));
const withExif = defaultMetadata({ capturedAt }, new Date(2026, 10, 5, 9, 0, 0));

describe('TimestampSection', () => {
  it('without capture time: shows the note and disables Capture time', () => {
    render(<TimestampSection metadata={noExif} onChange={vi.fn()} />);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Capture time' })).toBeDisabled();
  });

  it('with capture time selected: no note, shows the EXIF hint', () => {
    render(<TimestampSection metadata={withExif} capturedAt={capturedAt} onChange={vi.fn()} />);
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    expect(screen.getByText('Read from EXIF')).toBeInTheDocument();
  });

  it('with capture time available and Custom selected: no note', () => {
    render(<TimestampSection metadata={{ ...withExif, timestampSource: 'custom' }} capturedAt={capturedAt} onChange={vi.fn()} />);
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });

  it('typing switches the source to Custom', () => {
    const onChange = vi.fn();
    render(<TimestampSection metadata={noExif} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Timestamp'), { target: { value: '2026-01-02T03:04:05' } });
    expect(onChange).toHaveBeenCalledWith({ timestamp: '2026-01-02T03:04:05', timestampSource: 'custom' });
  });

  it('Capture time restores the EXIF value', () => {
    const onChange = vi.fn();
    render(<TimestampSection metadata={{ ...withExif, timestampSource: 'custom' }} capturedAt={capturedAt} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Capture time' }));
    expect(onChange).toHaveBeenCalledWith({ timestamp: capturedAt, timestampSource: 'capture' });
  });

  it('Now sets the current time', () => {
    const onChange = vi.fn();
    render(<TimestampSection metadata={withExif} capturedAt={capturedAt} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Now' }));
    expect(onChange).toHaveBeenCalledWith({ timestampSource: 'now', timestamp: expect.stringMatching(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/) });
  });
});

describe('StyleSection', () => {
  it('corner picker sets the position', () => {
    const onChange = vi.fn();
    render(<StyleSection metadata={noExif} onChange={onChange} keepSettings onKeepSettings={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Top left' }));
    expect(onChange).toHaveBeenCalledWith({ position: 'top-left' });
  });

  it('Keep settings switch', () => {
    const onKeep = vi.fn();
    render(<StyleSection metadata={noExif} onChange={vi.fn()} keepSettings onKeepSettings={onKeep} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Keep settings for next photo' }));
    expect(onKeep).toHaveBeenCalledWith(false);
  });
});

describe('Inspector', () => {
  const sections = [
    { id: 'time' as const, label: 'Time', node: <p>time body</p> },
    { id: 'location' as const, label: 'Location', node: <p>location body</p> },
    { id: 'style' as const, label: 'Style', node: <p>style body</p> },
  ];

  it('tab click reports the section; only the active section is shown on phone', () => {
    const onTab = vi.fn();
    const { container } = render(<Inspector active="location" onTab={onTab} sections={sections} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Style' }));
    expect(onTab).toHaveBeenCalledWith('style');
    expect(container.querySelector('#section-time')).toHaveClass('hidden');
    expect(container.querySelector('#section-style')).toHaveClass('hidden');
    expect(container.querySelector('#section-location')).not.toHaveClass('hidden');
  });
});
