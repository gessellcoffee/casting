'use client';

/**
 * Example usage of the Tooltip component
 * This file demonstrates how to use tooltips throughout the app
 */

import React from 'react';
import Tooltip from './Tooltip';

export default function TooltipExample() {
  return (
    <div style={{ padding: '100px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      {/* Basic tooltip on a button */}
      <Tooltip
        id="profile-photo-tip"
        title="Pro Tip"
        message="A professional headshot helps casting directors remember you!"
        position="top"
        delay={500}
      >
        <button className="neu-button">Upload Photo</button>
      </Tooltip>

      {/* Tooltip with longer message */}
      <Tooltip
        id="role-understudy-tip"
        title="Understudy Casting"
        message="When you mark a role as needing an understudy, you can cast two different actors to the same role - one as principal and one as understudy."
        position="right"
        delay={1000}
      >
        <div className="neu-card" style={{ padding: '20px' }}>
          <label>
            <input type="checkbox" />
            Needs Understudy
          </label>
        </div>
      </Tooltip>

      {/* Tooltip on hover area */}
      <Tooltip
        id="search-debounce-tip"
        message="Search results update automatically as you type. We use a smart delay to avoid excessive searches."
        position="bottom"
      >
        <input
          type="text"
          placeholder="Search..."
          className="neu-input"
          style={{ padding: '10px' }}
        />
      </Tooltip>

      {/* Tooltip for a complex feature */}
      <Tooltip
        id="callback-bulk-actions-tip"
        title="Bulk Actions"
        message="Select multiple items using the checkboxes, then use the actions menu to perform operations on all selected items at once."
        position="left"
        delay={2000}
      >
        <div className="neu-card" style={{ padding: '20px', minWidth: '200px' }}>
          <h3>Callbacks List</h3>
          <p>Select items to see bulk actions</p>
        </div>
      </Tooltip>
    </div>
  );
}
