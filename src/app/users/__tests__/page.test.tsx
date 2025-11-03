import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersDirectoryPage from '../page';
import { searchUsers, getAllSkills, getAllLocations } from '@/lib/supabase/userSearch';

// Mock the supabase functions
jest.mock('@/lib/supabase/userSearch', () => ({
  searchUsers: jest.fn(),
  getAllSkills: jest.fn(),
  getAllLocations: jest.fn(),
}));

// Mock StarryContainer
jest.mock('@/components/StarryContainer', () => {
  return function StarryContainer({ children, className }: any) {
    return <div className={className}>{children}</div>;
  };
});

// Mock next/link
jest.mock('next/link', () => {
  return function Link({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

const mockSearchUsers = searchUsers as jest.MockedFunction<typeof searchUsers>;
const mockGetAllSkills = getAllSkills as jest.MockedFunction<typeof getAllSkills>;
const mockGetAllLocations = getAllLocations as jest.MockedFunction<typeof getAllLocations>;

describe('UsersDirectoryPage', () => {
  const mockUsers = [
    {
      id: '1',
      username: 'actor1',
      first_name: 'John',
      middle_name: null,
      last_name: 'Doe',
      location: 'New York, NY',
      location_lat: null,
      location_lng: null,
      description: 'Experienced theater actor',
      skills: ['Acting', 'Singing'],
      profile_photo_url: null,
      resume_url: null,
      image_gallery: null,
      video_gallery: null,
      education: null,
      preferences: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      username: 'actor2',
      first_name: 'Jane',
      middle_name: null,
      last_name: 'Smith',
      location: 'Los Angeles, CA',
      location_lat: null,
      location_lng: null,
      description: 'Professional dancer and choreographer',
      skills: ['Dancing', 'Choreography'],
      profile_photo_url: null,
      resume_url: null,
      image_gallery: null,
      video_gallery: null,
      education: null,
      preferences: null,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockSkills = ['Acting', 'Singing', 'Dancing', 'Choreography', 'Directing'];
  const mockLocations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL'];

  beforeEach(() => {
    mockSearchUsers.mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
    });
    mockGetAllSkills.mockResolvedValue(mockSkills);
    mockGetAllLocations.mockResolvedValue(mockLocations);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the page title and description', async () => {
      render(<UsersDirectoryPage />);

      expect(screen.getByText('Find Talent')).toBeInTheDocument();
      expect(screen.getByText('Search for actors, directors, and theater professionals')).toBeInTheDocument();
    });

    it('should load and display skills and locations', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(mockGetAllSkills).toHaveBeenCalled();
        expect(mockGetAllLocations).toHaveBeenCalled();
      });
    });

    it('should display users after loading', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<UsersDirectoryPage />);

      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter users by search query', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name, username, or bio...');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'John',
          })
        );
      }, { timeout: 500 });
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name, username, or bio...');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'test');

      // Should not call immediately
      expect(mockSearchUsers).toHaveBeenCalledTimes(1); // Initial load

      // Wait for debounce
      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'test',
          })
        );
      }, { timeout: 500 });
    });
  });

  describe('Skills Filter with MultiSelectDropdown', () => {
    it('should display the skills filter with MultiSelectDropdown', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/Skills \(0 selected\)/)).toBeInTheDocument();
      });
    });

    it('should filter users by selected skills', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open the skills dropdown
      const dropdownButton = screen.getAllByRole('button')[0]; // First button should be the dropdown
      await user.click(dropdownButton);

      // Wait for options to appear
      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });

      // Select a skill
      await user.click(screen.getByText('Acting'));

      // Verify the search was called with the selected skill
      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            skills: ['Acting'],
          })
        );
      });
    });

    it('should update the selected count when skills are selected', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/Skills \(0 selected\)/)).toBeInTheDocument();
      });

      // Open and select a skill
      const dropdownButton = screen.getAllByRole('button')[0];
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Acting'));

      // The count should update (note: this might require a rerender in the actual component)
      await waitFor(() => {
        expect(screen.getByText(/Skills \(1 selected\)/)).toBeInTheDocument();
      });
    });

    it('should reset page to 0 when skills are changed', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open and select a skill
      const dropdownButton = screen.getAllByRole('button')[0];
      await user.click(dropdownButton);

      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Acting'));

      // Verify offset is 0 (first page)
      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 0,
          })
        );
      });
    });
  });

  describe('Location Filter', () => {
    it('should filter users by location', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const locationSelect = screen.getByRole('combobox');
      await user.selectOptions(locationSelect, 'New York, NY');

      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            location: 'New York, NY',
          })
        );
      });
    });

    it('should reset page to 0 when location is changed', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const locationSelect = screen.getByRole('combobox');
      await user.selectOptions(locationSelect, 'New York, NY');

      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 0,
          })
        );
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show clear filters button when filters are active', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Add a search query
      const searchInput = screen.getByPlaceholderText('Search by name, username, or bio...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
    });

    it('should clear all filters when clicked', async () => {
      const user = userEvent.setup();
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Add filters
      const searchInput = screen.getByPlaceholderText('Search by name, username, or bio...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByText('Clear all filters');
      await user.click(clearButton);

      // Verify filters are cleared
      expect(searchInput).toHaveValue('');
      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            query: '',
            skills: [],
            location: '',
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are multiple pages', async () => {
      mockSearchUsers.mockResolvedValue({
        users: mockUsers,
        total: 50, // More than one page
      });

      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      mockSearchUsers.mockResolvedValue({
        users: mockUsers,
        total: 50,
      });

      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 20, // PAGE_SIZE is 20
          })
        );
      });
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      mockSearchUsers.mockResolvedValue({
        users: mockUsers,
        total: 50,
      });

      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Previous')).not.toBeDisabled();
      });

      // Go back to page 1
      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 0,
          })
        );
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no users found', async () => {
      mockSearchUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
      });
    });
  });

  describe('User Display', () => {
    it('should display user information correctly', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('@actor1')).toBeInTheDocument();
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
        expect(screen.getByText('Experienced theater actor')).toBeInTheDocument();
      });
    });

    it('should display user skills', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Acting')).toBeInTheDocument();
        expect(screen.getByText('Singing')).toBeInTheDocument();
      });
    });

    it('should show +X more when user has more than 3 skills', async () => {
      mockSearchUsers.mockResolvedValue({
        users: [
          {
            ...mockUsers[0],
            skills: ['Acting', 'Singing', 'Dancing', 'Directing', 'Choreography'],
          },
        ],
        total: 1,
      });

      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });

    it('should link to user profile', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        const link = screen.getByText('John Doe').closest('a');
        expect(link).toHaveAttribute('href', '/profile/1');
      });
    });
  });

  describe('Results Count', () => {
    it('should display the correct number of results', async () => {
      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Found 2 users')).toBeInTheDocument();
      });
    });

    it('should use singular form for one result', async () => {
      mockSearchUsers.mockResolvedValue({
        users: [mockUsers[0]],
        total: 1,
      });

      render(<UsersDirectoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Found 1 user')).toBeInTheDocument();
      });
    });
  });
});
