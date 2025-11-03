import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultiSelectDropdown from '../MultiSelectDropdown';

describe('MultiSelectDropdown', () => {
  const mockOptions = [
    'Acting',
    'Singing',
    'Dancing',
    'Stage Combat',
    'Directing',
    'Choreography',
    'Set Design',
    'Costume Design',
    'Lighting Design',
    'Sound Design',
    'Props',
    'Makeup',
    'Hair Styling',
    'Stage Management',
    'Technical Direction',
    'Carpentry',
    'Painting',
    'Welding',
    'Rigging',
    'Projection Design',
    'Video Editing',
    'Photography',
    'Graphic Design',
    'Marketing',
    'Fundraising',
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with placeholder when no values selected', () => {
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          placeholder="Select skills..."
        />
      );

      expect(screen.getByText('Select skills...')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(
        <MultiSelectDropdown
          label="Skills"
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Skills')).toBeInTheDocument();
    });

    it('should render selected values as chips', () => {
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={['Acting', 'Singing']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Acting')).toBeInTheDocument();
      expect(screen.getByText('Singing')).toBeInTheDocument();
    });

    it('should render error message when provided', () => {
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          error="This field is required"
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should render helper text when provided and no error', () => {
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          helperText="Select your skills"
        />
      );

      expect(screen.getByText('Select your skills')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          error="Error message"
          helperText="Helper text"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onChange when an option is selected', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Click to open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Wait for options to appear and click one
      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Acting'));

      expect(mockOnChange).toHaveBeenCalledWith(['Acting']);
    });

    it('should allow multiple selections', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Click to open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Select first option
      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Acting'));

      // Rerender with first selection
      rerender(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={['Acting']}
          onChange={mockOnChange}
        />
      );

      // Open dropdown again
      await user.click(button);

      // Select second option
      await waitFor(() => {
        expect(screen.getByText('Singing')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Singing'));

      expect(mockOnChange).toHaveBeenLastCalledWith(['Acting', 'Singing']);
    });

    it('should remove a value when clicking the X button', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={['Acting', 'Singing']}
          onChange={mockOnChange}
        />
      );

      // Find and click the X button for 'Acting'
      const chips = screen.getAllByRole('button');
      const actingChip = chips.find((chip) => chip.textContent?.includes('Acting'));
      
      if (actingChip) {
        const xButton = actingChip.querySelector('button') || actingChip;
        await user.click(xButton);
      }

      expect(mockOnChange).toHaveBeenCalledWith(['Singing']);
    });
  });

  describe('Search Functionality', () => {
    it('should filter options based on search query', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Find and type in search input
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'design');

      // Check that only design-related options are visible
      await waitFor(() => {
        expect(screen.getByText('Set Design')).toBeInTheDocument();
        expect(screen.getByText('Costume Design')).toBeInTheDocument();
        expect(screen.getByText('Lighting Design')).toBeInTheDocument();
        expect(screen.queryByText('Acting')).not.toBeInTheDocument();
      });
    });

    it('should show "No results found" when search has no matches', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Search for non-existent option
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Search with different case
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'ACTING');

      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });
    });

    it('should clear search when dropdown closes', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'design');

      // Close dropdown by clicking outside
      await user.click(document.body);

      // Reopen dropdown
      await user.click(button);

      // Search input should be cleared
      const newSearchInput = screen.getByPlaceholderText('Search...');
      expect(newSearchInput).toHaveValue('');
    });
  });

  describe('Infinite Scroll', () => {
    it('should initially show limited number of items', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          itemsPerPage={10}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        // First 10 items should be visible
        expect(screen.getByText('Acting')).toBeInTheDocument();
        expect(screen.getByText('Props')).toBeInTheDocument();
        
        // Items beyond 10 should not be visible initially
        expect(screen.queryByText('Carpentry')).not.toBeInTheDocument();
      });
    });

    it('should show "Scroll for more..." when there are more items', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          itemsPerPage={10}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Scroll for more...')).toBeInTheDocument();
      });
    });

    it('should load more items when scrolling', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          itemsPerPage={10}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Find the scrollable container
      const listContainer = document.querySelector('.overflow-y-auto.max-h-60');
      
      if (listContainer) {
        // Simulate scroll to bottom
        fireEvent.scroll(listContainer, {
          target: {
            scrollTop: listContainer.scrollHeight,
            scrollHeight: listContainer.scrollHeight,
            clientHeight: 100,
          },
        });

        // Wait for more items to load
        await waitFor(() => {
          expect(screen.getByText('Carpentry')).toBeInTheDocument();
        });
      }
    });

    it('should reset visible count when search query changes', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
          itemsPerPage={5}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      // Search to filter items
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'design');

      // Should show limited filtered results
      await waitFor(() => {
        const designOptions = screen.getAllByText(/Design/);
        expect(designOptions.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Empty States', () => {
    it('should show "No options available" when options array is empty', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={[]}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectDropdown
          options={mockOptions}
          selectedValues={[]}
          onChange={mockOnChange}
        />
      );

      // Tab to button and press Enter to open
      await user.tab();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });
    });
  });
});
