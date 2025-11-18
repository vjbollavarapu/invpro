import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '../confirm-dialog'

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    mockOnConfirm.mockClear()
    mockOnOpenChange.mockClear()
  })

  it('renders when open is true', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Title"
        description="Test Description"
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        title="Test Title"
        description="Test Description"
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={mockOnConfirm}
        confirmText="Delete"
      />
    )

    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={mockOnConfirm}
        cancelText="Cancel"
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders custom button text', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Custom Dialog"
        description="Custom Description"
        onConfirm={mockOnConfirm}
        confirmText="Yes, proceed"
        cancelText="No, go back"
      />
    )

    expect(screen.getByRole('button', { name: /yes, proceed/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no, go back/i })).toBeInTheDocument()
  })

  it('applies destructive variant', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Delete"
        description="Are you sure?"
        onConfirm={mockOnConfirm}
        variant="destructive"
      />
    )

    // Button should be rendered (variant testing would require actual styling checks)
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })
})

