'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiRequestError, createApiClient } from '@kmsdc/api-client';
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Input,
  Label,
  NativeSelect,
  Textarea,
} from '@kmsdc/ui';
import {
  ENQUIRY_SERVICES,
  enquiryFormSchema,
  type EnquiryForm as EnquiryFormValues,
  type EnquiryFormInput,
} from '@kmsdc/validation';
import { CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const SERVICE_LABELS: Record<(typeof ENQUIRY_SERVICES)[number], string> = {
  'general-dentistry': 'General dentistry / check-up',
  'root-canal-treatment': 'Root canal treatment',
  'teeth-whitening': 'Teeth whitening',
  'dental-implants': 'Dental implants',
  'braces-and-orthodontics': 'Braces and orthodontics',
  'pediatric-dentistry': 'Pediatric dentistry',
  'dental-x-rays': 'Dental X-rays',
  'other-dental-procedures': 'Other dental procedures',
  'not-sure': "I'm not sure",
};

const api = createApiClient({ baseUrl: '' });

type Status = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
    if (error.status === 400)
      return 'Some details could not be accepted. Please check the form and try again.';
    if (error.status === 404 || error.status >= 500) {
      return 'Online enquiries are temporarily unavailable.';
    }
  }
  return 'We could not send your enquiry. Please check your connection and try again.';
}

export function EnquiryForm({
  defaultService,
  alternativeContact,
}: {
  defaultService?: (typeof ENQUIRY_SERVICES)[number];
  /** Rendered with error messages so visitors always have another way to reach the clinic. */
  alternativeContact?: React.ReactNode;
}) {
  const mountedAt = useRef<number>(0);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormInput, unknown, EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      service: defaultService ?? 'not-sure',
      preferredTime: 'any',
      message: '',
      consentToContact: false,
      consentToPromotions: false,
    },
  });

  const submit = async (values: EnquiryFormValues) => {
    setStatus({ kind: 'idle' });
    const params = new URLSearchParams(window.location.search);
    const utm = (key: string) => params.get(key)?.slice(0, 100) ?? undefined;
    try {
      await api.createEnquiry({
        ...values,
        website: honeypot.current?.value ?? '',
        elapsedMs: Date.now() - mountedAt.current,
        source: {
          page: window.location.pathname,
          ...(document.referrer ? { referrer: document.referrer.slice(0, 500) } : {}),
          ...(utm('utm_source') ? { utmSource: utm('utm_source') } : {}),
          ...(utm('utm_medium') ? { utmMedium: utm('utm_medium') } : {}),
          ...(utm('utm_campaign') ? { utmCampaign: utm('utm_campaign') } : {}),
        },
      });
      reset();
      setStatus({ kind: 'success' });
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) });
    }
  };

  // handleSubmit is only invoked from the event handler, never during render.
  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(submit)(event);
  };

  if (status.kind === 'success') {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-3 rounded-xl border border-success-border bg-success-bg p-6"
      >
        <CircleCheck aria-hidden="true" className="size-8 text-success" />
        <h3 className="text-lg font-semibold text-fg">Thank you — your enquiry has been sent</h3>
        <p className="text-fg">
          The clinic team will contact you to arrange an appointment. Your appointment is confirmed
          only when the clinic replies.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setStatus({ kind: 'idle' });
          }}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      aria-describedby="enquiry-note"
    >
      <p id="enquiry-note" className="text-sm text-fg-muted">
        Fields marked <span className="text-danger">*</span> are required. Please do not include
        medical details — these are taken privately at the clinic.
      </p>

      {status.kind === 'error' ? (
        <Alert tone="danger" title={status.message} assertive>
          {alternativeContact}
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Your name" error={errors.name?.message} required>
          {(field) => <Input {...field} autoComplete="name" {...register('name')} />}
        </FormField>
        <FormField label="Mobile number" error={errors.phone?.message} required>
          {(field) => (
            <Input
              {...field}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 98765 43210"
              {...register('phone')}
            />
          )}
        </FormField>
        <FormField label="Email" error={errors.email?.message} showOptional>
          {(field) => <Input {...field} type="email" autoComplete="email" {...register('email')} />}
        </FormField>
        <FormField label="Preferred time" error={errors.preferredTime?.message}>
          {(field) => (
            <NativeSelect {...field} {...register('preferredTime')}>
              <option value="any">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </NativeSelect>
          )}
        </FormField>
        <FormField
          label="What is it about?"
          error={errors.service?.message}
          className="sm:col-span-2"
        >
          {(field) => (
            <NativeSelect {...field} {...register('service')}>
              {ENQUIRY_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField
          label="Message"
          error={errors.message?.message}
          showOptional
          className="sm:col-span-2"
        >
          {(field) => <Textarea {...field} rows={4} {...register('message')} />}
        </FormField>
      </div>

      {/* Honeypot for bots: hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="enquiry-website">Website</label>
        <input
          ref={honeypot}
          id="enquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Consent</legend>
        <Controller
          control={control}
          name="consentToContact"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-contact"
                  checked={field.value}
                  onCheckedChange={(v) => {
                    field.onChange(v === true);
                  }}
                  aria-invalid={errors.consentToContact ? true : undefined}
                  aria-describedby={errors.consentToContact ? 'consent-contact-error' : undefined}
                  className="mt-0.5"
                />
                <Label htmlFor="consent-contact" className="font-normal">
                  I agree to be contacted by phone, WhatsApp or email about this enquiry.{' '}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                </Label>
              </div>
              {errors.consentToContact ? (
                <p id="consent-contact-error" className="pl-8 text-sm text-danger">
                  {errors.consentToContact.message}
                </p>
              ) : null}
            </div>
          )}
        />
        <Controller
          control={control}
          name="consentToPromotions"
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-promotions"
                checked={field.value}
                onCheckedChange={(v) => {
                  field.onChange(v === true);
                }}
                className="mt-0.5"
              />
              <Label htmlFor="consent-promotions" className="font-normal text-fg-muted">
                Optional: send me occasional dental-health tips and clinic updates. You can opt out
                at any time.
              </Label>
            </div>
          )}
        />
      </fieldset>

      <p className="text-sm text-fg-muted">
        See our{' '}
        <a href="/privacy" className="text-fg-link underline">
          privacy policy
        </a>{' '}
        for how your details are used.
      </p>

      <div>
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send enquiry'}
        </Button>
      </div>
    </form>
  );
}
