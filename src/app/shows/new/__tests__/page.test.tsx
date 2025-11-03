import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NewShowPage from '../page';
import { createShow } from '@/lib/supabase/shows';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/shows', () => ({
  createShow: jest.fn(),
}));

jest.mock('@/components/StarryContainer', () => {
  return function StarryContainer({ children }: { children: React.ReactNode }) {
    return <div data-testid="starry-container">{children}</div>;
  };
});

describe('NewShowPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should render the form with all fields', () => {
    render(<NewShowPage />);

    expect(screen.getByText('Create New Show')).toBeInTheDocument();
    expect(screen.getByLabelText(/Show Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Author\/Composer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Show/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should show error when submitting without title', async () => {
    render(<NewShowPage />);

    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Show title is required')).toBeInTheDocument();
    });

    expect(createShow).not.toHaveBeenCalled();
  });

  it('should create show with valid data', async () => {
    const mockShow = {
      show_id: 'show-123',
      title: 'Hamilton',
      author: 'Lin-Manuel Miranda',
      description: 'A musical about Alexander Hamilton',
      creator_user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
    };

    (createShow as jest.Mock).mockResolvedValue({
      data: mockShow,
      error: null,
    });

    render(<NewShowPage />);

    // Fill in the form
    const titleInput = screen.getByLabelText(/Show Title/i);
    const authorInput = screen.getByLabelText(/Author\/Composer/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: 'Hamilton' } });
    fireEvent.change(authorInput, { target: { value: 'Lin-Manuel Miranda' } });
    fireEvent.change(descriptionInput, { target: { value: 'A musical about Alexander Hamilton' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createShow).toHaveBeenCalledWith({
        title: 'Hamilton',
        author: 'Lin-Manuel Miranda',
        description: 'A musical about Alexander Hamilton',
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/shows/show-123');
  });

  it('should handle null values for optional fields', async () => {
    const mockShow = {
      show_id: 'show-123',
      title: 'Hamilton',
      author: null,
      description: null,
      creator_user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
    };

    (createShow as jest.Mock).mockResolvedValue({
      data: mockShow,
      error: null,
    });

    render(<NewShowPage />);

    // Fill in only the title
    const titleInput = screen.getByLabelText(/Show Title/i);
    fireEvent.change(titleInput, { target: { value: 'Hamilton' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createShow).toHaveBeenCalledWith({
        title: 'Hamilton',
        author: null,
        description: null,
      });
    });
  });

  it('should show error message on create failure', async () => {
    (createShow as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    render(<NewShowPage />);

    // Fill in the form
    const titleInput = screen.getByLabelText(/Show Title/i);
    fireEvent.change(titleInput, { target: { value: 'Hamilton' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create show. Please try again.')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should navigate back to shows list on cancel', () => {
    render(<NewShowPage />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/shows');
  });

  it('should disable submit button when title is empty', () => {
    render(<NewShowPage />);

    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    expect(submitButton).toBeDisabled();

    // Add title
    const titleInput = screen.getByLabelText(/Show Title/i);
    fireEvent.change(titleInput, { target: { value: 'Hamilton' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('should disable all inputs while creating', async () => {
    (createShow as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<NewShowPage />);

    // Fill in the form
    const titleInput = screen.getByLabelText(/Show Title/i);
    fireEvent.change(titleInput, { target: { value: 'Hamilton' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Show Title/i)).toBeDisabled();
      expect(screen.getByLabelText(/Author\/Composer/i)).toBeDisabled();
      expect(screen.getByLabelText(/Description/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    });
  });

  it('should trim whitespace from inputs', async () => {
    const mockShow = {
      show_id: 'show-123',
      title: 'Hamilton',
      author: 'Lin-Manuel Miranda',
      description: 'A musical',
      creator_user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
    };

    (createShow as jest.Mock).mockResolvedValue({
      data: mockShow,
      error: null,
    });

    render(<NewShowPage />);

    // Fill in the form with extra whitespace
    const titleInput = screen.getByLabelText(/Show Title/i);
    const authorInput = screen.getByLabelText(/Author\/Composer/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: '  Hamilton  ' } });
    fireEvent.change(authorInput, { target: { value: '  Lin-Manuel Miranda  ' } });
    fireEvent.change(descriptionInput, { target: { value: '  A musical  ' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Show/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createShow).toHaveBeenCalledWith({
        title: 'Hamilton',
        author: 'Lin-Manuel Miranda',
        description: 'A musical',
      });
    });
  });
});
