import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useStore } from '@/store';

export function OnboardingTour() {
    const [run, setRun] = useState(false);
    const { user } = useStore();

    useEffect(() => {
        // Only run the tour if the user hasn't seen it yet
        const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
        if (!hasSeenTour && user) {
            // Small delay to ensure the UI is fully rendered
            const timer = setTimeout(() => {
                setRun(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            content: (
                <div className="text-left space-y-2">
                    <h3 className="font-semibold text-lg text-primary">Welcome to TAC Cargo v2.0</h3>
                    <p className="text-sm text-muted-foreground">
                        We've completely redesigned your interface to help you manage logistics faster than ever.
                        Let's take a quick look around.
                    </p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '[data-testid="sidebar-nav"]',
            content: (
                <div className="text-left space-y-2">
                    <h3 className="font-semibold">Navigation Sidebar</h3>
                    <p className="text-sm">
                        Everything is organized cleanly in this collapsible sidebar. Look out for the live badges!
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '[data-testid="kpi-grid"]',
            content: (
                <div className="text-left space-y-2">
                    <h3 className="font-semibold">Dashboard KPIs</h3>
                    <p className="text-sm">
                        Tap on any KPI card to instantly drill down into the related data table view.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.lucide-search',
            content: (
                <div className="text-left space-y-2">
                    <h3 className="font-semibold">Command Palette</h3>
                    <p className="text-sm">
                        Press CMD+K (or CTRL+K) anywhere to instantly search shipments, manifests, or take action.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[aria-label="Toggle menu"]',
            content: (
                <div className="text-left space-y-2">
                    <h3 className="font-semibold">Mobile Ready</h3>
                    <p className="text-sm">
                        On smaller screens, you can toggle the sidebar navigation here. Everything is built to be responsive.
                    </p>
                </div>
            ),
            placement: 'bottom',
        },
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hasSeenOnboardingTour', 'true');
        }
    };

    if (!run) return null;

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
                options: {
                    primaryColor: 'var(--primary)',
                    textColor: 'var(--foreground)',
                    zIndex: 10000,
                    backgroundColor: 'var(--card)',
                    arrowColor: 'var(--card)',
                },
                tooltip: {
                    backgroundColor: 'var(--card)',
                    color: 'var(--card-foreground)',
                    borderRadius: 0,
                    padding: 20,
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                buttonNext: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 0,
                },
                buttonBack: {
                    color: 'var(--muted-foreground)',
                },
            }}
        />
    );
}
