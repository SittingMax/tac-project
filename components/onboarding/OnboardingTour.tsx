import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '@/store';

interface TourStep {
  title: string;
  content: string;
  target: string; // CSS selector or 'body' for centered modal
  placement: 'center' | 'right' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to TAC Cargo v2.0',
    content:
      "We've completely redesigned your interface to help you manage logistics faster than ever. Let's take a quick look around.",
  },
  {
    target: '[data-testid="sidebar-nav"]',
    placement: 'right',
    title: 'Navigation Sidebar',
    content:
      'Everything is organized cleanly in this collapsible sidebar. Look out for the live badges!',
  },
  {
    target: '[data-testid="kpi-grid"]',
    placement: 'bottom',
    title: 'Dashboard KPIs',
    content: 'Tap on any KPI card to instantly drill down into the related data table view.',
  },
  {
    target: '[data-tour="command-palette"]',
    placement: 'bottom',
    title: 'Command Palette',
    content:
      'Press CMD+K (or CTRL+K) anywhere to instantly search shipments, manifests, or take action.',
  },
  {
    target: '[aria-label="Toggle menu"]',
    placement: 'bottom',
    title: 'Mobile Ready',
    content:
      'On smaller screens, you can toggle the sidebar navigation here. Everything is built to be responsive.',
  },
];

/**
 * Retrieve the bounding rectangle of a DOM element identified by a CSS selector, or indicate absence for 'body'.
 *
 * @param selector - A CSS selector for the target element, or the literal string `'body'` to represent no specific target.
 * @returns The element's bounding client rect in viewport coordinates, or `null` if `selector` is `'body'` or no matching element is found.
 */
function getTargetRect(selector: string): DOMRect | null {
  if (selector === 'body') return null;
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

/**
 * Compute inline CSS positioning for a tour tooltip or centered modal.
 *
 * @param rect - Bounding client rect of the target element; pass `null` to position a centered modal.
 * @param placement - Desired tooltip placement relative to the target (`'center'`, `'right'`, or `'bottom'`).
 * @returns A CSS properties object positioning the tooltip: when `rect` is `null` it returns a centered modal layout; otherwise it returns a fixed-positioned tooltip anchored to the target with bounds clamped to the viewport for `'right'` and `'bottom'` placements.
 */
function computeTooltipStyle(
  rect: DOMRect | null,
  placement: TourStep['placement']
): React.CSSProperties {
  if (!rect) {
    // Centered modal
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 340,
    };
  }
  const GAP = 12;
  const CARD_WIDTH = 300;
  const PADDING = 16;

  // Fallback bounds safely clamping X/Y off-screen overflow
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (placement === 'right') {
    const rawLeft = rect.right + GAP;
    return {
      position: 'fixed',
      top: Math.min(Math.max(PADDING, rect.top), vh - PADDING * 10),
      left: Math.max(PADDING, Math.min(rawLeft, vw - CARD_WIDTH - PADDING)),
      width: CARD_WIDTH,
    };
  }
  // bottom
  const rawLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  return {
    position: 'fixed',
    top: Math.min(rect.bottom + GAP, vh - PADDING * 10),
    left: Math.max(PADDING, Math.min(rawLeft, vw - CARD_WIDTH - PADDING)),
    width: CARD_WIDTH,
  };
}

/**
 * Renders the onboarding tour UI and controls a guided, step-by-step walkthrough for new users.
 *
 * The component automatically starts for a logged-in user who has not previously completed the tour,
 * persists completion in localStorage under "hasSeenOnboardingTour", and provides Skip, Back, Next/Finish
 * controls with step indicators and targeted tooltips or a centered modal.
 *
 * @returns The tour's React element when running; `null` when the tour is not active.
 */
export function OnboardingTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);
  const { user } = useStore();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour && user) {
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const finish = useCallback((skipped = false) => {
    setRun(false);
    if (!skipped) localStorage.setItem('hasSeenOnboardingTour', 'true');
    else localStorage.setItem('hasSeenOnboardingTour', 'true');
  }, []);

  const next = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }, [stepIndex, finish]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!run) return null;

  const step = TOUR_STEPS[stepIndex];
  const rect = getTargetRect(step.target);
  const tooltipStyle = computeTooltipStyle(rect, step.placement);
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isCenter = step.target === 'body';

  return (
    <Dialog.Root
      open={run}
      onOpenChange={(open) => {
        if (!open) finish(true);
      }}
    >
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9998,
          }}
        />

        {/* Tooltip card */}
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => {
            // Prevent accidental closes unless they hit the skip button or Escape
            e.preventDefault();
          }}
          style={{
            ...tooltipStyle,
            zIndex: 9999,
            backgroundColor: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          <Dialog.Title className="sr-only" style={{ display: 'none' }}>
            {step.title}
          </Dialog.Title>

          {/* Step counter */}
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              marginBottom: '8px',
            }}
          >
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </div>

          {/* Title */}
          <h3
            style={{
              fontWeight: 600,
              fontSize: '1rem',
              color: isCenter ? 'var(--primary)' : 'var(--foreground)',
              marginBottom: '8px',
            }}
          >
            {step.title}
          </h3>

          {/* Content */}
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            {step.content}
          </p>

          {/* Progress dots */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '16px',
            }}
          >
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: i === stepIndex ? 'var(--primary)' : 'var(--muted)',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => finish(true)}
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted-foreground)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Skip tour
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {stepIndex > 0 && (
                <button
                  onClick={back}
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--muted-foreground)',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '6px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                style={{
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
