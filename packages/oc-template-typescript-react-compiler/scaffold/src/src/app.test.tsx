import React from 'react';
import { mount } from 'enzyme';

import App from './app';

const getData = jest.fn();

describe('App - Page', () => {
  beforeEach(() => {
    window.oc = { events: { on: jest.fn(), fire: jest.fn() } };
  });

  it('Gets more data when clicking the button', () => {
    const renderedComponent = mount(<App getData={getData} />);

    renderedComponent.find('button').simulate('click');

    expect(getData).toHaveBeenCalled();
  });
});
