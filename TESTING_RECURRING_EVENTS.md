# Testing Recurring Events on Calendar Views

## What Was Fixed

1. **Week View Display Issue**: Fixed the condition that was hiding personal events when there were no audition signups or callbacks
2. **Added Debug Logging**: Added console logs to trace the recurring event expansion process

## How to Test

### Step 1: Create a Recurring Event

1. Navigate to any calendar view (Month, Week, or List)
2. Click on a date to add a personal event
3. Create a recurring event with these settings:
   - **Title**: "Weekly Team Meeting"
   - **Start**: Any time (e.g., 2:00 PM)
   - **End**: 1 hour later (e.g., 3:00 PM)
   - **Recurrence**: Turn ON
   - **Frequency**: WEEKLY
   - **Ends**: After 10 occurrences (or pick an end date)
4. Save the event

### Step 2: Check the Calendar Views

#### Month View
- Navigate to the month view
- You should see the event appear on multiple weeks
- Each occurrence should show on its respective date

#### Week View
- Navigate to the week view
- If the current week contains an occurrence, you should see it
- Navigate to next/previous weeks to see other occurrences
- Each occurrence should display with the correct time

#### List View
- Navigate to the list view
- Filter by "Upcoming" or "All"
- You should see multiple instances of the recurring event listed
- Each should show the correct date and time

### Step 3: Check Browser Console

Open the browser developer console (F12) and look for logs:

```
[getEvents] Date range: { startDate: ..., endDate: ... }
[getEvents] Non-recurring events: X
[getEvents] Recurring events (base): Y
[expandRecurringEvent] Processing event: { title: ..., eventStart: ..., recurrenceRule: ... }
[expandRecurringEvent] Generated occurrences: Z
[getEvents] Expanded recurring events: Z
[getEvents] Sample expanded events: [...]
```

### Expected Results

✅ **Success Indicators:**
- Recurring events appear on multiple dates in all views
- Each occurrence shows the correct date and time
- Console logs show:
  - Recurring events (base): 1 or more
  - Generated occurrences: Multiple (based on recurrence rule)
  - Expanded recurring events: Multiple instances

❌ **Issues to Report:**
- If "Recurring events (base): 0" → No recurring events in database
- If "Generated occurrences: 0" → Issue with recurrence rule expansion
- If events don't appear on calendar → Check the date grouping logic

## Troubleshooting

### No Events Showing Up

1. **Check if events exist**: Look at console logs for "Recurring events (base)"
2. **Check date range**: Ensure the calendar is showing dates that include occurrences
3. **Check recurrence rule**: View the console log for the recurrence rule details

### Events Show in Console But Not on Calendar

1. **Check the date grouping**: The key format is `${year}-${month}-${date}`
2. **Verify the event structure**: Check if `evt.start` is a valid date string
3. **Check for JavaScript errors**: Look for any errors in the console

### Wrong Dates or Times

1. **Timezone issues**: Check if dates are being converted correctly
2. **Duration calculation**: Verify the event duration is preserved
3. **RRule configuration**: Check if the recurrence rule is set up correctly

## Common Recurrence Patterns to Test

1. **Daily**: Every day for 7 days
2. **Weekly**: Every Monday for 4 weeks
3. **Monthly**: First day of month for 6 months
4. **Custom**: Every 2 weeks on Monday and Wednesday

## Notes

- The system fetches ALL recurring events (not just those starting in the visible range) to properly calculate instances
- Each instance gets a unique ID: `${originalEventId}_${timestamp}`
- The original event ID is preserved in `_originalEventId` metadata
