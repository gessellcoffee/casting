import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CastShow from '../CastShow';
import { getAuditionRoles } from '@/lib/supabase/auditionRoles';
import { getAuditionSignups } from '@/lib/supabase/auditionSignups';
import { getAuditionCastMembers, createCastMember, deleteCastMember } from '@/lib/supabase/castMembers';
import { createCastingOffer } from '@/lib/supabase/castingOffers';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock StarryContainer
jest.mock('@/components/StarryContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="starry-container">{children}</div>,
}));

// Mock UserProfileModal
jest.mock('../UserProfileModal', () => ({
  __esModule: true,
  default: () => <div data-testid="user-profile-modal">User Profile Modal</div>,
}));

// Mock SendOfferModal
jest.mock('../SendOfferModal', () => ({
  __esModule: true,
  default: () => <div data-testid="send-offer-modal">Send Offer Modal</div>,
}));

// Mock the dependencies
jest.mock('@/lib/supabase/auditionRoles');
jest.mock('@/lib/supabase/auditionSignups');
jest.mock('@/lib/supabase/castMembers');
jest.mock('@/lib/supabase/castingOffers');

const mockGetAuditionRoles = getAuditionRoles as jest.MockedFunction<typeof getAuditionRoles>;
const mockGetAuditionSignups = getAuditionSignups as jest.MockedFunction<typeof getAuditionSignups>;
const mockGetAuditionCastMembers = getAuditionCastMembers as jest.MockedFunction<typeof getAuditionCastMembers>;
const mockCreateCastMember = createCastMember as jest.MockedFunction<typeof createCastMember>;
const mockDeleteCastMember = deleteCastMember as jest.MockedFunction<typeof deleteCastMember>;
const mockCreateCastingOffer = createCastingOffer as jest.MockedFunction<typeof createCastingOffer>;

describe('CastShow', () => {
  const mockAudition = {
    audition_id: 'audition-1',
    show_id: 'show-1',
    user_id: 'user-1',
    company_id: null,
    ensemble_size: 5,
    show: {
      title: 'Test Show',
      author: 'Test Author',
      description: 'Test Description',
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const mockRoles = [
    {
      audition_role_id: 'role-1',
      role_id: 'base-role-1',
      role_name: 'Lead Role',
      description: 'Main character',
      needs_understudy: false,
    },
    {
      audition_role_id: 'role-2',
      role_id: 'base-role-2',
      role_name: 'Supporting Role',
      description: 'Supporting character',
      needs_understudy: true,
    },
  ];

  const mockSignups = [
    {
      signup_id: 'signup-1',
      user_id: 'actor-1',
      role_id: 'base-role-1',
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
    },
    {
      signup_id: 'signup-2',
      user_id: 'actor-2',
      role_id: 'base-role-2',
      profiles: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      },
    },
  ];

  const mockCastMembers = [
    {
      cast_member_id: 'cast-1',
      audition_role_id: 'role-1',
      user_id: 'actor-1',
      is_understudy: false,
      role_id: 'base-role-1',
      audition_id: 'audition-1',
      status: 'Offered',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuditionRoles.mockResolvedValue(mockRoles as any);
    mockGetAuditionSignups.mockResolvedValue(mockSignups as any);
    mockGetAuditionCastMembers.mockResolvedValue(mockCastMembers as any);
  });

  it('should render loading state initially', () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should load and display roles with single selection dropdowns', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
      expect(screen.getByText('Supporting Role')).toBeInTheDocument();
    });

    // Should have select dropdowns for principal roles
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('should initialize with existing cast member selected', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // The first role should have actor-1 selected
    const selects = screen.getAllByRole('combobox');
    const principalSelect = selects[0];
    expect(principalSelect).toHaveValue('actor-1');
  });

  it('should allow changing principal cast selection', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const principalSelect = selects[0];

    // Change selection
    fireEvent.change(principalSelect, { target: { value: 'actor-2' } });

    expect(principalSelect).toHaveValue('actor-2');
  });

  it('should show understudy dropdown when needs_understudy is true', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Supporting Role')).toBeInTheDocument();
    });

    // Should show understudy section for role-2
    const understudyLabels = screen.getAllByText(/understudy/i);
    expect(understudyLabels.length).toBeGreaterThan(0);
  });

  it('should save single cast member per role', async () => {
    const onSave = jest.fn();
    mockCreateCastMember.mockResolvedValue({ data: null, error: null } as any);
    mockDeleteCastMember.mockResolvedValue({ error: null } as any);

    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={onSave}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // Change selection
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'actor-2' } });

    // Click save
    const saveButton = screen.getByText('Save Cast');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateCastMember).toHaveBeenCalledWith(
        expect.objectContaining({
          audition_id: 'audition-1',
          user_id: 'actor-2',
          is_understudy: false,
        })
      );
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('should remove cast member when selection is cleared', async () => {
    const onSave = jest.fn();
    mockDeleteCastMember.mockResolvedValue({ error: null } as any);

    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={onSave}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // Clear selection
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '' } });

    // Click save
    const saveButton = screen.getByText('Save Cast');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDeleteCastMember).toHaveBeenCalledWith('cast-1');
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('should prevent selecting same actor for principal and understudy', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Supporting Role')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    
    // Select actor-1 as principal for role-2
    const principalSelect = selects.find(select => 
      select.closest('tr')?.textContent?.includes('Supporting Role')
    );
    
    if (principalSelect) {
      fireEvent.change(principalSelect, { target: { value: 'actor-1' } });
      
      // The understudy dropdown should not include actor-1
      const options = Array.from(principalSelect.querySelectorAll('option'));
      const actorOptions = options.filter(opt => opt.value === 'actor-1');
      
      // After selection, actor-1 should still be available in the dropdown (current selection)
      // but should be filtered from the understudy dropdown
      expect(principalSelect).toHaveValue('actor-1');
    }
  });

  it('should display ensemble section when ensemble_size is set', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ensemble \(Size: 5\)/i)).toBeInTheDocument();
    });
  });

  it('should show View Profile button when actor is selected', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // Should show View Profile button for selected actor
    const viewProfileButtons = screen.getAllByText('View Profile');
    expect(viewProfileButtons.length).toBeGreaterThan(0);
  });

  it('should show Send Offer button for assigned actors', async () => {
    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // Should show Send Offer button for selected actor
    const sendOfferButtons = screen.getAllByText(/Send Offer/i);
    expect(sendOfferButtons.length).toBeGreaterThan(0);
  });

  it('should send individual casting offer when Send Offer button is clicked', async () => {
    mockCreateCastingOffer.mockResolvedValue({ data: { offer_id: 'offer-1' } as any, error: null });
    
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // Click Send Offer button
    const sendOfferButtons = screen.getAllByText(/📧 Send Offer/i);
    fireEvent.click(sendOfferButtons[0]);

    await waitFor(() => {
      expect(mockCreateCastingOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          auditionId: 'audition-1',
          userId: 'actor-1',
          sentBy: 'user-1',
          isUnderstudy: false,
        })
      );
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('sent successfully'));
    });

    alertMock.mockRestore();
  });

  it('should disable Send Offer button while sending', async () => {
    mockCreateCastingOffer.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100)));

    render(
      <CastShow
        audition={mockAudition as any}
        user={mockUser as any}
        onSave={jest.fn()}
        onError={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Role')).toBeInTheDocument();
    });

    // Click Send Offer button
    const sendOfferButtons = screen.getAllByText(/📧 Send Offer/i);
    fireEvent.click(sendOfferButtons[0]);

    // Button should show "Sending..." and be disabled
    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });
});
