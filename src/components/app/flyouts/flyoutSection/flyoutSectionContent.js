// Copyright (c) Microsoft. All rights reserved.

import React from'react';

import { withAccordion } from './accordionProvider';
import { joinClasses } from 'utilities';

export const FlyoutSectionContent = withAccordion(
  ({ accordionIsOpen, className, children }) => (
    accordionIsOpen
      ? <div className={joinClasses('flyout-section-content', className)}>
          { children }
        </div>
      : null
  )
);
