import React from 'react';
import { render, screen } from '@testing-library/react';

import App from './app';

const getData = jest.fn();

describe('App - Page', () => {
  beforeEach(() => {
    window.oc = { events: { on: jest.fn(), fire: jest.fn() } } as any;
  });

  it('Gets more data when clicking the button', () => {
    render(
      <App firstName="firstName" lastName="lastName" userId={0} getData={getData} />
    );

    const hobbiesElement = screen.getByText(/Hobbies/i);
    expect(hobbiesElement).toBeInTheDocument();
  });
});
