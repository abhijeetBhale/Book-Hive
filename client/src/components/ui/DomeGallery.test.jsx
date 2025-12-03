/**
 * Basic test file for DomeGallery component
 * This is a simple smoke test to verify the component renders without errors
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DomeGallery from './DomeGallery';

describe('DomeGallery Component', () => {
  it('should render without crashing', () => {
    const testImages = [
      { src: 'test1.jpg', alt: 'Test 1' },
      { src: 'test2.jpg', alt: 'Test 2' },
    ];

    const { container } = render(
      <div style={{ width: '500px', height: '500px' }}>
        <DomeGallery images={testImages} />
      </div>
    );

    expect(container.querySelector('.sphere-root')).toBeTruthy();
  });

  it('should render with custom props', () => {
    const testImages = [
      { src: 'test1.jpg', alt: 'Test 1' },
    ];

    const { container } = render(
      <div style={{ width: '500px', height: '500px' }}>
        <DomeGallery
          images={testImages}
          fit={0.5}
          grayscale={false}
          segments={20}
        />
      </div>
    );

    expect(container.querySelector('.sphere-root')).toBeTruthy();
  });
});
