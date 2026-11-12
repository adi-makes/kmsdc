import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatusBadge, IntegrationModeBadge } from './badge.js';
import { Button, IconButton } from './button.js';
import { ErrorState } from './feedback.js';
import { EmptyState } from './states.js';
import { FormField } from './form-field.js';
import { Input } from './input.js';
import { Breadcrumbs, PageHeader } from './navigation.js';

afterEach(cleanup);

describe('Button', () => {
  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button');
  });

  it('is disabled and busy while loading', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('IconButton always has an accessible name', () => {
    render(<IconButton label="Open navigation" icon={<svg />} />);
    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeTruthy();
  });
});

describe('FormField', () => {
  it('wires label, description and error to the control', () => {
    render(
      <FormField
        label="Phone"
        description="Indian mobile number"
        error="Enter a valid number"
        required
      >
        {(field) => <Input {...field} />}
      </FormField>,
    );
    const input = screen.getByLabelText(/Phone/);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    const texts = describedBy.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(texts).toEqual(['Indian mobile number', 'Enter a valid number']);
  });

  it('omits aria-invalid when there is no error', () => {
    render(<FormField label="Name">{(field) => <Input {...field} />}</FormField>);
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBeNull();
  });
});

describe('Status badges', () => {
  it('render text, not colour alone', () => {
    render(<AppointmentStatusBadge status="NO_SHOW" />);
    expect(screen.getByText('No-show')).toBeTruthy();
  });

  it('labels mock integrations explicitly for screen readers', () => {
    render(<IntegrationModeBadge mode="mock" />);
    expect(screen.getByText('Mock mode')).toBeTruthy();
    expect(screen.getByText(/nothing is actually sent/)).toBeTruthy();
  });
});

describe('Navigation', () => {
  it('marks the current breadcrumb', () => {
    render(
      <Breadcrumbs items={[{ label: 'Patients', href: '/app/patients' }, { label: 'Profile' }]} />,
    );
    expect(screen.getByRole('link', { name: 'Patients' }).getAttribute('href')).toBe(
      '/app/patients',
    );
    expect(screen.getByText('Profile').getAttribute('aria-current')).toBe('page');
  });

  it('PageHeader renders exactly one h1', () => {
    render(<PageHeader title="Appointments" description="Today" />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('States', () => {
  it('EmptyState offers a next step', () => {
    render(<EmptyState title="No patients yet" action={<Button>Add patient</Button>} />);
    expect(screen.getByRole('button', { name: 'Add patient' })).toBeTruthy();
  });

  it('ErrorState is announced and retryable', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
