export interface Asset {
    id: string;
    name: string;
    type: string;
    address: string;
    existence: 'tangible' | 'intangible';
    liquidity: 'current' | 'fixed';
    usage: 'operating' | 'non-operating';
}

export type TriggerType = 'time-lock' | 'oracle' | 'multi-sig' | 'conditional-rules' | 'dispute-resolution';

export interface Trigger {
    id: string;
    type: TriggerType;
    description: string;
    value: string;
    daysRemaining?: number;
}

export interface Rule {
    id: string;
    type: string;
    operator: string;
    value: string;
    release: string;
}

export interface WillState {
    assets: Asset[];
    triggers: Trigger[];
    status: 'draft' | 'deploying' | 'deployed' | 'executed';
    willType: string;
    willTypeFormData: any;
    documentData?: any;
    is2FAEnabled: boolean;
    isBiometricsEnabled: boolean;
    lastPing?: number;
    rules?: Rule[];
    txHash?: string;
    inheritedWills?: any[];
}
