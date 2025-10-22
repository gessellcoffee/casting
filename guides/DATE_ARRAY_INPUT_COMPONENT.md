# DateArrayInput Component Guide

## Overview

The `DateArrayInput` is a custom React component that provides an intuitive calendar interface for selecting multiple dates. It supports click-and-drag selection, deselection, and non-contiguous date ranges all within a single input.

## Features

### 1. **Click-and-Drag Selection**
- Click on a date to select it
- Hold and drag to select multiple consecutive dates
- Automatically determines whether to select or deselect based on the first clicked date

### 2. **Deselection**
- Click on an already-selected date to deselect it
- Drag across selected dates to deselect multiple dates at once

### 3. **Non-Contiguous Ranges**
- Select dates from different parts of the calendar
- No restriction on date continuity
- All selected dates are automatically sorted chronologically

### 4. **Visual Feedback**
- Selected dates are highlighted in blue
- Today's date has a ring indicator
- Hover effects for better interaction
- Display shows date range and count

### 5. **Month Navigation**
- Previous/Next month buttons
- "Today" quick action button
- "Clear All" button when dates are selected

### 6. **Smart Display**
- Shows placeholder when empty
- Shows single date when one is selected
- Shows range with count when multiple dates selected
- Dropdown shows up to 10 selected dates as chips

## Usage

### Basic Example

```tsx
import DateArrayInput from '@/components/ui/DateArrayInput';

function MyComponent() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  return (
    <DateArrayInput
      label="Select Dates"
      value={selectedDates}
      onChange={setSelectedDates}
      placeholder="Choose your dates..."
    />
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string[]` | Yes | - | Array of date strings in YYYY-MM-DD format |
| `onChange` | `(dates: string[]) => void` | Yes | - | Callback when dates change |
| `label` | `string` | No | - | Label text displayed above input |
| `placeholder` | `string` | No | `'Select dates...'` | Placeholder text when no dates selected |
| `className` | `string` | No | `''` | Additional CSS classes for container |

### Date Format

Dates are stored and passed as strings in ISO format: `YYYY-MM-DD`

Example: `["2024-01-15", "2024-01-16", "2024-01-20"]`

## Implementation in AuditionDetailsForm

The component is used for three date fields:

```tsx
<DateArrayInput
  label="Audition Dates"
  value={localDetails.auditionDates}
  onChange={(dates) => updateField('auditionDates', dates)}
  placeholder="Select audition dates..."
/>

<DateArrayInput
  label="Rehearsal Dates"
  value={localDetails.rehearsalDates}
  onChange={(dates) => updateField('rehearsalDates', dates)}
  placeholder="Select rehearsal dates..."
/>

<DateArrayInput
  label="Performance Dates"
  value={localDetails.performanceDates}
  onChange={(dates) => updateField('performanceDates', dates)}
  placeholder="Select performance dates..."
/>
```

## User Interaction Flow

1. **Opening the Calendar**
   - User clicks on the input field
   - Calendar dropdown appears below the input

2. **Selecting Dates**
   - User clicks on a date → date is selected
   - User holds mouse down and drags → multiple dates are selected
   - Selected dates turn blue

3. **Deselecting Dates**
   - User clicks on a selected (blue) date → date is deselected
   - User drags across selected dates → those dates are deselected

4. **Navigating Months**
   - Click left/right arrows to change months
   - Click "Today" to jump to current month

5. **Clearing Selection**
   - Click "Clear All" button to remove all selected dates

6. **Closing the Calendar**
   - Click outside the calendar
   - Calendar closes automatically

## Technical Details

### State Management

The component manages several internal states:
- `isOpen`: Controls calendar visibility
- `currentMonth`: Tracks displayed month
- `isDragging`: Tracks if user is currently dragging
- `dragMode`: Determines if dragging selects or deselects

### Event Handling

- **Mouse Down**: Initiates drag, determines mode (select/deselect)
- **Mouse Enter**: Continues drag selection on hover
- **Mouse Up**: Ends drag operation (handled globally)
- **Click Outside**: Closes calendar dropdown

### Accessibility Considerations

- Keyboard navigation not yet implemented (future enhancement)
- Visual indicators for selected dates
- Clear visual feedback for interactions
- Responsive design for mobile devices

## Styling

The component uses the cosmic theme styling:
- Background: `from-[#2e3e5e] to-[#26364e]`
- Selected dates: `bg-[#5a8ff5]`
- Borders: `border-[#4a7bd9]/20`
- Text: `text-[#c5ddff]`

All styles are inline with the existing design system.

## Future Enhancements

Potential improvements:
- Keyboard navigation (arrow keys, Enter, Escape)
- Date range shortcuts (e.g., "Next 7 days", "This month")
- Min/max date restrictions
- Disabled dates functionality
- Custom date formatting options
- Multi-month view
- Time selection support
- Accessibility improvements (ARIA labels, screen reader support)

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Efficient rendering with React state management
- No external dependencies beyond React
- Minimal re-renders with proper event handling
- Lightweight component (~300 lines)

## Testing Checklist

- [ ] Select single date
- [ ] Select multiple dates by clicking
- [ ] Select range by dragging
- [ ] Deselect single date
- [ ] Deselect range by dragging
- [ ] Navigate between months
- [ ] Use "Today" button
- [ ] Use "Clear All" button
- [ ] Close by clicking outside
- [ ] Verify dates are sorted
- [ ] Check display text updates correctly
- [ ] Test on mobile devices
- [ ] Verify no duplicate dates can be added
