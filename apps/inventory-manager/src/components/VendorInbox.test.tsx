import { render, screen, fireEvent } from '@testing-library/react'
import { VendorInbox } from './VendorInbox'

// Mock the useVendorInbox hook
const mockUseVendorInbox = jest.fn()

jest.mock('@/hooks/useVendorInbox', () => ({
  useVendorInbox: () => mockUseVendorInbox()
}))

describe('VendorInbox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    mockUseVendorInbox.mockReturnValue({
      variants: [],
      loading: false,
      error: null,
      page: 1,
      total: 0,
      filters: {
        search: '',
        category: '',
        decision: ''
      },
      loadVariants: jest.fn(),
      updateFilters: jest.fn(),
      updatePage: jest.fn(),
      updateDecision: jest.fn(),
      bulkUpdateDecisions: jest.fn(),
      clearError: jest.fn()
    })

    render(<VendorInbox />)
    expect(screen.getByText('Vendor Inbox')).toBeInTheDocument()
  })

  it('displays empty state when no variants', () => {
    mockUseVendorInbox.mockReturnValue({
      variants: [],
      loading: false,
      error: null,
      page: 1,
      total: 0,
      filters: {
        search: '',
        category: '',
        decision: ''
      },
      loadVariants: jest.fn(),
      updateFilters: jest.fn(),
      updatePage: jest.fn(),
      updateDecision: jest.fn(),
      bulkUpdateDecisions: jest.fn(),
      clearError: jest.fn()
    })

    render(<VendorInbox />)
    expect(screen.getByText('No vendor products found')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    mockUseVendorInbox.mockReturnValue({
      variants: [],
      loading: true,
      error: null,
      page: 1,
      total: 0,
      filters: {
        search: '',
        category: '',
        decision: ''
      },
      loadVariants: jest.fn(),
      updateFilters: jest.fn(),
      updatePage: jest.fn(),
      updateDecision: jest.fn(),
      bulkUpdateDecisions: jest.fn(),
      clearError: jest.fn()
    })

    render(<VendorInbox />)
    // Check for the loading spinner element
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays error state', () => {
    mockUseVendorInbox.mockReturnValue({
      variants: [],
      loading: false,
      error: 'Failed to load vendor variants',
      page: 1,
      total: 0,
      filters: {
        search: '',
        category: '',
        decision: ''
      },
      loadVariants: jest.fn(),
      updateFilters: jest.fn(),
      updatePage: jest.fn(),
      updateDecision: jest.fn(),
      bulkUpdateDecisions: jest.fn(),
      clearError: jest.fn()
    })

    render(<VendorInbox />)
    expect(screen.getByText('Failed to load vendor variants')).toBeInTheDocument()
  })
})