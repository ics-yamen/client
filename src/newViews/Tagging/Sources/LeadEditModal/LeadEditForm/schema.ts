import {
    ObjectSchema,
    requiredStringCondition,
    requiredCondition,
    PartialForm,
    urlCondition,
} from '@togglecorp/toggle-form';

import {
    KeyValueElement,
} from '#typings';

export type LeadSourceType = 'text' | 'disk' | 'website' |
    'dropbox' | 'google-drive' | 'rss-feed' | 'emm' | 'web-api' | 'unknown';

export interface EmmEntityOption {
    key: number;
    label: string;
    totalCount: number;
}

export interface EmmTrigger {
    emmKeyword: string;
    emmRiskFactor?: string;
    count: number;
}

export interface EmmEntity {
    name: string;
}

export interface Lead {
    // TODO: Handle case where assignee can be multiple
    assignee: number;
    authorRaw?: string;
    authors?: [number];
    confidentiality: string;
    emmEntities?: EmmEntity[];
    emmTriggers?: EmmTrigger[];
    leadGroup?: number;
    priority: number;
    project: number;
    publishedOn: string;
    source: number;
    sourceRaw?: string;
    sourceType: LeadSourceType;
    text?: string;
    title: string;
    url?: string;
    website?: string;
    attachment?: {
        id: number;
        title: string;
        file: string;
        mimeType: string;
    };
}

export type PartialFormType = PartialForm<Lead, 'emmEntities' | 'emmTriggers'>;
export type FormSchema = ObjectSchema<PartialFormType>;
export type FormSchemaFields = ReturnType<FormSchema['fields']>;

export interface Priority {
    key: number;
    value: string;
}

export interface LeadOptions {
    status: KeyValueElement[];
    projects: {
        id: number;
        title: string;
    }[];
    members: {
        id: number;
        displayName: string;
    }[];
    leadGroup: KeyValueElement[];
    priority: Priority[];
    confidentiality: KeyValueElement[];
    organizations: {
        id: number;
        title: string;
        shortName: string;
        mergedAs: {
            id: number;
            title: string;
        };
    }[];
    hasEmmLeads: boolean;
    emmEntities?: EmmEntityOption[];
    emmRiskFactors?: EmmEntityOption[];
    emmKeywords?: EmmEntityOption[];
}

export const schema:FormSchema = {
    fields: (value): FormSchemaFields => {
        let baseSchema: FormSchemaFields = {
            assignee: [requiredCondition],
            authors: [],
            confidentiality: [requiredCondition],
            leadGroup: [],
            priority: [requiredCondition],
            project: [requiredCondition],
            publishedOn: [requiredCondition],
            source: [requiredCondition],
            sourceType: [requiredCondition],
            title: [requiredStringCondition],
        };
        if (value?.sourceType === 'website') {
            baseSchema = {
                ...baseSchema,
                url: [requiredCondition, urlCondition],
                website: [requiredCondition],
                emmEntities: [],
                emmTriggers: [],
            };
        } else if (value?.sourceType === 'text') {
            baseSchema = {
                ...baseSchema,
                text: [requiredStringCondition],
            };
        } else {
            baseSchema = {
                ...baseSchema,
                attachment: [requiredCondition],
            };
        }
        return baseSchema;
    },
};
